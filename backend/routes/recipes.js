// backend/routes/recipes.js
const fs = require('fs'); 
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const auth = require('../middleware/auth');

// Config Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) { cb(null, true); } 
    else { cb(new Error('Chỉ chấp nhận file ảnh!'), false); }
  }
});

const cpUpload = upload.fields([
    { name: 'image', maxCount: 1 }, 
    { name: 'ingredientImages', maxCount: 20 }
]);

// 1. GET ALL: Lấy danh sách bài viết
router.get('/', async (req, res) => {
  try {
      const { status } = req.query;
      let query = { status: status || 'approved' }; 

      const recipes = await Recipe.find(query)
          .populate('user', 'username email') 
          .sort({ createdAt: -1 });
          
      res.json(recipes);
  } catch (err) {
      res.status(500).json({ message: 'Lỗi server' });
  }
});

// 2. POST: Đăng bài
router.post('/', auth, cpUpload, async (req, res) => {
  try {
      if (!req.body.title || !req.body.instructions) return res.status(400).json({ message: 'Thiếu thông tin' });

      let extendedIngredients = [];
      if (req.body.extendedIngredients) {
          try { extendedIngredients = JSON.parse(req.body.extendedIngredients); } catch (e) {}
      }

      if (req.files && req.files['ingredientImages']) {
          const ingFiles = req.files['ingredientImages'];
          let fileIndex = 0;
          extendedIngredients = extendedIngredients.map(ing => {
              if (ing.hasImage && ingFiles[fileIndex]) {
                  const updated = { ...ing, image: `/uploads/${ingFiles[fileIndex].filename}` };
                  fileIndex++;
                  return updated;
              }
              return ing;
          });
      }

      const unknownIngredients = [];
      for (const item of extendedIngredients) {
          if(!item.name) continue;
          const exists = await Ingredient.findOne({ 
              name: { $regex: new RegExp(`^${item.name.trim()}$`, 'i') } 
          });
          if (!exists) {
              unknownIngredients.push(item.name.trim());
          }
      }

      let status = 'pending'; 
      if (req.user.role === 'admin' && unknownIngredients.length === 0) {
          status = 'approved';
      }

      const recipe = new Recipe({
          title: req.body.title,
          ingredients: req.body.ingredients ? req.body.ingredients.split(',') : [],
          instructions: req.body.instructions,
          image: (req.files && req.files['image']) ? `/uploads/${req.files['image'][0].filename}` : '',
          category: req.body.category || '',
          user: req.user.id,
          extendedIngredients: extendedIngredients,
          status: status, 
          unknownIngredients: unknownIngredients 
      });

      const newRecipe = await recipe.save();
      res.status(201).json(newRecipe);
  } catch (err) {
      res.status(400).json({ message: err.message });
  }
});


// =========================================================================
// CÁC ĐƯỜNG DẪN CỤ THỂ (PHẢI ĐẶT TRƯỚC CÁC ĐƯỜNG DẪN CHUNG CÓ /:id)
// =========================================================================

// 3. DUYỆT BÀI ĐĂNG (Chỉ Admin) -> Đã khôi phục lại code bị mất!
router.put('/:id/approve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
        
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
  
        recipe.status = 'approved';
        recipe.unknownIngredients = []; 
        await recipe.save();
        
        res.json(recipe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. XÓA CẢNH BÁO 1 NGUYÊN LIỆU (Khi Admin duyệt nguyên liệu)
router.put('/:id/remove-unknown-ingredient', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
        const { ingredientName } = req.body;
        
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Không tìm thấy' });

        recipe.unknownIngredients = recipe.unknownIngredients.filter(name => name !== ingredientName);
        await recipe.save();
        res.json(recipe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// =========================================================================
// CÁC ĐƯỜNG DẪN CHUNG CHỨA PARAMETER /:id (PHẢI ĐẶT Ở DƯỚI CÙNG)
// =========================================================================

// 5. GET SINGLE
router.get('/:id', async (req, res) => {
  try {
      const recipe = await Recipe.findById(req.params.id).populate('user', 'username');
      if (!recipe) return res.status(404).json({ message: 'Không tìm thấy' });
      res.json(recipe);
  } catch (err) {
      res.status(500).json({ message: 'Lỗi server' });
  }
});

// 6. PUT: Cập nhật bài viết
router.put('/:id', auth, cpUpload, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Không tìm thấy công thức' });

    const isOwner = recipe.user && recipe.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa bài viết này!' });
    }

    recipe.title = req.body.title || recipe.title;
    recipe.instructions = req.body.instructions || recipe.instructions;
    recipe.category = req.body.category || recipe.category;
    
    if (req.body.ingredients) {
        recipe.ingredients = req.body.ingredients.split(',').map(item => item.trim());
    }

    if (req.files && req.files['image']) {
      if (recipe.image) {
          const oldImagePath = path.join(__dirname, '..', recipe.image);
          if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      recipe.image = `/uploads/${req.files['image'][0].filename}`;
    }

    if (req.body.extendedIngredients) {
        try {
            let incomingIngredients = JSON.parse(req.body.extendedIngredients);
            
            if (req.files && req.files['ingredientImages']) {
                const ingFiles = req.files['ingredientImages'];
                let fileIndex = 0;
                incomingIngredients = incomingIngredients.map(ing => {
                    if (ing.hasImage && ingFiles[fileIndex]) {
                        const updatedIng = { ...ing, image: `/uploads/${ingFiles[fileIndex].filename}` };
                        fileIndex++;
                        return updatedIng;
                    }
                    return ing;
                });
            }
            recipe.extendedIngredients = incomingIngredients;

            const unknownIngredients = [];
            for (const item of incomingIngredients) {
                if (!item.name) continue;
                const exists = await Ingredient.findOne({ name: { $regex: new RegExp(`^${item.name.trim()}$`, 'i') } });
                if (!exists) unknownIngredients.push(item.name.trim());
            }

            recipe.unknownIngredients = unknownIngredients;
            
            if (unknownIngredients.length > 0 && req.user.role !== 'admin') {
                recipe.status = 'pending';
            }

        } catch (e) {
            console.error("Lỗi parse JSON nguyên liệu:", e);
        }
    }

    const updatedRecipe = await recipe.save();
    res.json(updatedRecipe);

  } catch (err) {
    console.error('Lỗi chi tiết từ Server khi SỬA:', err);
    res.status(400).json({ message: err.message || 'Lỗi khi cập nhật công thức' });
  }
});

// 7. DELETE: XÓA BÀI ĐĂNG
router.delete('/:id', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: 'Không tìm thấy công thức' });
        }

        const isAdmin = req.user.role === 'admin';
        const isOwner = recipe.user && recipe.user.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này!' });
        }

        if (recipe.image) {
            const mainImagePath = path.join(__dirname, '..', recipe.image);
            if (fs.existsSync(mainImagePath)) {
                fs.unlinkSync(mainImagePath);
            }
        }

        if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
            recipe.extendedIngredients.forEach(ing => {
                if (ing.image) {
                    const ingPath = path.join(__dirname, '..', ing.image);
                    if (fs.existsSync(ingPath)) {
                        fs.unlinkSync(ingPath);
                    }
                }
            });
        }

        await Recipe.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa công thức và thu dọn ảnh thành công!' });
    } catch (err) {
        console.error('Lỗi khi xóa bài:', err);
        res.status(500).json({ message: 'Lỗi server khi xóa bài. Vui lòng xem Terminal.' });
    }
});

module.exports = router;