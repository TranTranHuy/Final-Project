// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const auth = require('../middleware/auth');

// 1. Lấy thông tin giỏ hàng
router.get('/', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        res.json(cart || { items: [] });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 2. Thêm sản phẩm vào giỏ hàng
router.post('/add', auth, async (req, res) => {
    try {
        const { name, price, image, sellerId, sellerName, recipeId } = req.body;
        
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => 
            item.name === name && item.sellerId?.toString() === sellerId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += 1;
        } else {
            cart.items.push({ name, price, image, sellerId, sellerName, recipeId, quantity: 1 });
        }

        await cart.save();
        res.json({ message: 'Đã thêm vào giỏ hàng', cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. [MỚI] Cập nhật số lượng (Tăng / Giảm)
router.put('/update', auth, async (req, res) => {
    try {
        const { itemId, action } = req.body; // action sẽ là 'increase' hoặc 'decrease'
        let cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống' });

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex > -1) {
            if (action === 'increase') {
                cart.items[itemIndex].quantity += 1;
            } else if (action === 'decrease') {
                cart.items[itemIndex].quantity -= 1;
                // Nếu giảm xuống 0 thì xóa luôn khỏi giỏ
                if (cart.items[itemIndex].quantity <= 0) {
                    cart.items.splice(itemIndex, 1);
                }
            }
            await cart.save();
            res.json(cart);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. [MỚI] Xóa hẳn 1 sản phẩm khỏi giỏ
router.delete('/remove/:itemId', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống' });

        cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
        await cart.save();
        
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;