// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const auth = require('../middleware/auth');

// 1. Create a new order (Checkout)
router.post('/', auth, async (req, res) => {
    try {
        const { shippingInfo } = req.body; // [MODIFIED] Removed paymentMethod
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Shopping cart is empty' });
        }

        const totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        const order = new Order({
            user: req.user.id,
            items: cart.items,
            shippingInfo,
            totalPrice,
            paymentMethod: 'COD', // Default to COD as requested
            paymentStatus: 'Not paid'
        });
        await order.save();

        cart.items = [];
        await cart.save();

        res.status(201).json({ message: 'Order created successfully!', order });
    } catch (error) {
        res.status(500).json({ message: 'Error occurred while creating order' });
    }
});

// 2. Retrieve list of orders (User purchasing from others)
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error occurred while fetching orders' });
    }
});

// 3. Retrieve list of sales (Orders placed by other users for items listed by the current user)
router.get('/sales', auth, async (req, res) => {
    try {
        const orders = await Order.find({ "items.sellerId": req.user.id })
            .sort({ createdAt: -1 })
            .populate('user', 'username'); 
            
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 4. Retrieve all orders (Only for Admin to view overview)
router.get('/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'You do not have permission to view all orders' });
        const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'username');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 5. Update status (For Authors / Sellers ONLY)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // [MODIFIED] Feedback #2: Admin cannot change all statuses. 
        // ONLY the seller of the item can update the status.
        const isSeller = order.items.some(item => item.sellerId && item.sellerId.toString() === req.user.id);

        if (!isSeller) {
            return res.status(403).json({ message: 'Only the seller of this item can update its status' });
        }
        
        const { status } = req.body; 
        const validStatuses = ['pending', 'shipping', 'completed'];
        if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

        order.status = status;
        await order.save();
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;