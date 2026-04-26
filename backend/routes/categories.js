// backend/routes/categories.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth'); // Authentication Middleware

// 1. Get all categories (Anyone can see them)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Add new category (Need to be logged in)
router.post('/', auth, async (req, res) => {
  const { name, image } = req.body;
  try {
    let category = await Category.findOne({ name });
    if (category) return res.status(400).json({ message: 'Category already exists' });

    category = new Category({
      name,
      image,
      user: req.user.id // Save creator ID
    });

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// 3. Update category (Permission required)
router.put('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // --- CHECK PERMISSION ---
    const isOwner = category.user && category.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    // If not the owner AND not an admin -> Block
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to edit this category' });
    }
    // ---------------------

    category.name = req.body.name || category.name;
    category.image = req.body.image || category.image;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// 4. Remove category (Permission required)
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // --- CHECK PERMISSION ---
    const isOwner = category.user && category.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this category' });
    }
    // ---------------------

    await category.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;