// backend/routes/recipes.js
const fs = require('fs'); 
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const auth = require('../middleware/auth');
const User = require('../models/User');



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
    else { cb(new Error('Only image files are accepted!'), false); }
  }
});

const cpUpload = upload.fields([
    { name: 'image', maxCount: 1 }, 
    { name: 'ingredientImages', maxCount: 20 }
]);

// ==========================================
// 1. API: Get the Top 4 Most Liked Banner Formulas
// ==========================================
router.get('/top', async (req, res) => {
    try {
        // Use MongoDB's Aggregation to count the length of the 'likes' array and sort it in descending order.
        const topRecipes = await Recipe.aggregate([
            { $match: { status: 'approved' } }, // Only fetch approved recipes
            { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } }, // Create a virtual field to count likes
            { $sort: { likesCount: -1, createdAt: -1 } }, // Sort by like count and creation date
            { $limit: 4 } // Only fetch the top 4 recipes
        ]);
        res.json(topRecipes);
    } catch (err) {
        console.error("Error fetching Top Recipes:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==========================================
// [NEW] 2. API: Get the list of favorite recipes for the current user
// ==========================================
router.get('/favorites', auth, async (req, res) => {
    try {
        // Find all recipes that are liked by the current user and are approved
        const favorites = await Recipe.find({ likes: req.user.id, status: 'approved' }).sort({ createdAt: -1 });
        res.json(favorites);
    } catch (err) {
        console.error("Error fetching Favorites:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 1. GET ALL: Get the list of all recipes (with search and filter support)
router.get('/', async (req, res) => {
  try {
      const { status, search, category } = req.query;
      
      // Default to fetching only approved recipes
      let query = { status: status || 'approved' }; 

      // If there is a search keyword (Filter by title, case-insensitive)
      if (search) {
          query.title = { $regex: search, $options: 'i' };
      }

      // If a category is selected
      if (category) {
          query.category = category;
      }

      const recipes = await Recipe.find(query)
          .populate('user', 'username email') 
          .sort({ createdAt: -1 });
          
      res.json(recipes);
  } catch (err) {
      res.status(500).json({ message: 'Server error' });
  }
});

// 2. POST: Post an article
router.post('/', auth, cpUpload, async (req, res) => {
  try {
      if (!req.body.title || !req.body.instructions) return res.status(400).json({ message: 'Missing information' });

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


// 3. APPROVE POSTS (Admin Only)
router.put('/:id/approve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'You do not have permission to approve recipes' });
        
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  
        recipe.status = 'approved';
        recipe.unknownIngredients = []; 
        await recipe.save();
        
        res.json(recipe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. REMOVE UNKNOWN INGREDIENT (When Admin approves ingredients)
router.put('/:id/remove-unknown-ingredient', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'You do not have permission to remove unknown ingredients' });
        const { ingredientName } = req.body;
        
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

        recipe.unknownIngredients = recipe.unknownIngredients.filter(name => name !== ingredientName);
        await recipe.save();
        res.json(recipe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// 5. GET SINGLE
router.get('/:id', async (req, res) => {
  try {
      const recipe = await Recipe.findById(req.params.id).populate('user', 'username');
      if (!recipe) return res.status(404).json({ message: 'Not found' });
      res.json(recipe);
  } catch (err) {
      res.status(500).json({ message: 'Server error' });
  }
});

// 6. PUT: Update an article
router.put('/:id', auth, cpUpload, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const isOwner = recipe.user && recipe.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to update this recipe' });
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
            console.error("Error parsing raw JSON:", e);
        }
    }

    const updatedRecipe = await recipe.save();
    res.json(updatedRecipe);

  } catch (err) {
    console.error('Detailed error from Server when updating:', err);
    res.status(400).json({ message: err.message || 'Error when updating recipe' });
  }
});

// 7. DELETE: Delete a recipe
router.delete('/:id', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        const isAdmin = req.user.role === 'admin';
        const isOwner = recipe.user && recipe.user.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'You do not have permission to delete this recipe' });
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
        res.json({ message: 'Recipe deleted and images cleaned up successfully!' });
    } catch (err) {
        console.error('Error when deleting recipe:', err);
        res.status(500).json({ message: 'Server error when deleting recipe. Please check the terminal.' });
    }
});

// API: Like/Unlike posts
router.post('/:id/like', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

        //Check if the user has liked this post.
        const isLiked = recipe.likes.includes(req.user.id);

        if (isLiked) {
            // If already liked -> Remove like (remove ID from array)
            recipe.likes = recipe.likes.filter(id => id.toString() !== req.user.id);
        } else {
            // If not liked -> Add like (push ID to array)
            recipe.likes.push(req.user.id);
        }

        await recipe.save();
        res.json(recipe.likes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API: Add Comment
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

        const currentUser = await User.findById(req.user.id);
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        const newComment = {
            user: currentUser._id,
            username: currentUser.username,
            text: req.body.text
        };

        if (!recipe.comments) {
            recipe.comments = [];
        }

        // Push comment to the beginning
        recipe.comments.unshift(newComment);
        await recipe.save();

        res.json(recipe.comments);
    } catch (error) {
        console.error('Error when adding comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;