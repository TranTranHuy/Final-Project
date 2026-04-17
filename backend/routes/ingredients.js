// backend/routes/ingredients.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Ingredient = require('../models/Ingredient');
const auth = require('../middleware/auth');

// Cấu hình Multer cho nguyên liệu
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ 
    storage, 
    limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB cho ảnh nguyên liệu
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Chỉ chấp nhận file ảnh!'), false);
    }
});

// 1. Lấy danh sách nguyên liệu
router.get('/', async (req, res) => {
    try {
        const { query } = req.query;
        if (query) {
            const ingredients = await Ingredient.find({ name: { $regex: query, $options: 'i' } }).limit(10);
            return res.json(ingredients);
        }
        const allIngredients = await Ingredient.find().sort({ createdAt: -1 }); 
        res.json(allIngredients);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 2. Thêm nguyên liệu mới (Có upload ảnh)
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Chỉ Admin mới được thêm' });

        const { name } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ message: 'Tên không được để trống' });

        let ingredient = await Ingredient.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
        if (ingredient) return res.status(400).json({ message: 'Nguyên liệu này đã tồn tại' });

        ingredient = new Ingredient({ 
            name: name.trim(),
            image: req.file ? `/uploads/${req.file.filename}` : ''
        });
        await ingredient.save();
        
        res.json(ingredient);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Sửa nguyên liệu (Đổi tên, đổi ảnh)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Chỉ Admin mới được sửa' });

        const ingredient = await Ingredient.findById(req.params.id);
        if (!ingredient) return res.status(404).json({ message: 'Không tìm thấy' });

        if (req.body.name) ingredient.name = req.body.name.trim();
        if (req.file) ingredient.image = `/uploads/${req.file.filename}`;

        await ingredient.save();
        res.json(ingredient);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. Xóa nguyên liệu
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Chỉ Admin mới được xóa' });
        await Ingredient.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa nguyên liệu' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;