// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');


// API: Search for users by name
router.get('/search', auth, async (req, res) => {
    try {
        const keyword = req.query.q;
        if (!keyword) return res.json([]);

        // Find the user whose username contains the keyword (case-insensitive)
        // AND _id is not the logged-in user ($ne: not equal)
        const users = await User.find({
            username: { $regex: keyword, $options: 'i' },
            _id: { $ne: req.user.id }
        }).select('username _id'); // Only fetch ID and username for security

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get user profile and their list of recipes
router.get('/profile/:id', async (req, res) => {
    try {
        // Find the user (without returning the password)
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find the recipes submitted by this user (only approved ones)
        const recipes = await require('../models/Recipe').find({ user: req.params.id, status: 'approved' }).sort({ createdAt: -1 });

        res.json({
            user: user,
            recipeCount: recipes.length,
            recipes: recipes
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Configure the image storage location (uploads folder) and rename the files.
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) {
        cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API: Upload avatar
router.post('/avatar', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Please select an image' });

        const imagePath = '/uploads/' + req.file.filename;

        // Update the image link to the database.
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { avatar: imagePath },
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Error uploading avatar' });
    }
});

module.exports = router;