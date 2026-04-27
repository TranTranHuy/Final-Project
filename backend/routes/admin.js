// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Order = require('../models/Order');

const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    next();
};

// API: Get overall statistics for Dashboard
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRecipes = await Recipe.countDocuments();
        
        // Find only completed orders to calculate accurate revenue and items sold
        const completedOrders = await Order.find({ status: 'completed' });
        
        let totalRevenue = 0;
        let totalItemsSold = 0;

        completedOrders.forEach(order => {
            totalRevenue += order.totalPrice;
            order.items.forEach(item => {
                totalItemsSold += item.quantity;
            });
        });

        // [MODIFIED] Get data for chart: Top Selling Ingredients
        const chartData = await Order.aggregate([
            { $match: { status: 'completed' } }, // Only count successfully sold orders
            { $unwind: "$items" }, // Break down the items array
            {
                $group: {
                    _id: "$items.name", // Group by ingredient name
                    count: { $sum: "$items.quantity" } // Sum the total quantity sold
                }
            },
            { $sort: { count: -1 } }, // Sort from highest to lowest
            { $limit: 7 } // Only show the top 7 best-selling ingredients
        ]);

        res.json({
            summary: { totalUsers, totalRecipes, totalItemsSold, totalRevenue },
            chartData
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});
// ==========================================
// [NEW] API: Get all users (Admin only)
// ==========================================
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        // Fetch all users, exclude passwords, sort by newest first
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// [NEW] API: Change user role (User <-> Admin)
// ==========================================
router.put('/users/:id/role', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Prevent admin from changing their own role accidentally
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'You cannot change your own role' });
        }
        
        // Toggle role
        user.role = user.role === 'admin' ? 'user' : 'admin';
        await user.save();
        
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// [NEW] API: Delete a user
// ==========================================
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete yourself' });
        }
        
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;