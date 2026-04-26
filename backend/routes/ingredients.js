// backend/routes/ingredients.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Ingredient = require('../models/Ingredient');
const auth = require('../middleware/auth');

// Multer configuration for materials
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ 
    storage, 
    limits: { fileSize: 2 * 1024 * 1024 }, // Maximum 2MB for raw image files.
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'), false);
    }
});

// 1. Get the list of ingredients
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
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. Add new ingredient (With image upload)
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only Admin can add ingredients' });

        const { name } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ message: 'Name cannot be empty' });

        let ingredient = await Ingredient.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
        if (ingredient) return res.status(400).json({ message: 'Ingredient already exists' });

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

// 3. Update ingredient (Change name, change image)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only Admin can update ingredients' });

        const ingredient = await Ingredient.findById(req.params.id);
        if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });

        if (req.body.name) ingredient.name = req.body.name.trim();
        if (req.file) ingredient.image = `/uploads/${req.file.filename}`;

        await ingredient.save();
        res.json(ingredient);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. Delete ingredient
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only Admin can delete ingredients' });
        await Ingredient.findByIdAndDelete(req.params.id);
        res.json({ message: 'Ingredient deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;