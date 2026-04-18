// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const auth = require('../middleware/auth');

// 1. Tạo đơn hàng mới (Checkout)
router.post('/', auth, async (req, res) => {
    try {
        // [ĐÃ SỬA] Nhận thêm paymentMethod từ Frontend
        const { shippingInfo, paymentMethod } = req.body;
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Giỏ hàng trống' });
        }

        const totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        // [MỚI] Gắn trạng thái thanh toán dựa trên phương thức
        let paymentStatus = 'Chưa thanh toán';
        if (paymentMethod === 'CreditCard' || paymentMethod === 'MoMo') {
            paymentStatus = 'Đã thanh toán'; // Nếu thanh toán online thì coi như đã trả tiền
        }

        const order = new Order({
            user: req.user.id,
            items: cart.items,
            shippingInfo,
            totalPrice,
            paymentMethod, // Lưu vào DB
            paymentStatus  // Lưu vào DB
        });
        await order.save();

        cart.items = [];
        await cart.save();

        res.status(201).json({ message: 'Đặt hàng thành công!', order });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo đơn hàng' });
    }
});

// 2. Lấy danh sách ĐƠN MUA (User đi mua của người khác)
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 3. [MỚI] Lấy danh sách ĐƠN BÁN (Người khác mua hàng do User này đăng)
router.get('/sales', auth, async (req, res) => {
    try {
        // Tìm các đơn hàng mà trong danh sách items có chứa sellerId là ID của User hiện tại
        const orders = await Order.find({ "items.sellerId": req.user.id })
            .sort({ createdAt: -1 })
            .populate('user', 'username'); // Lấy tên người mua
            
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 4. [MỚI] Lấy TẤT CẢ đơn hàng (Chỉ dành cho Admin xem tổng quát)
router.get('/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
        const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'username');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 5. [ĐÃ SỬA] Cập nhật trạng thái (Dành cho Tác giả / Người bán)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

        // KIỂM TRA QUYỀN: Xem User hiện tại có phải là người bán của món nào trong đơn này không
        const isSeller = order.items.some(item => item.sellerId && item.sellerId.toString() === req.user.id);
        const isAdmin = req.user.role === 'admin';

        if (!isSeller && !isAdmin) {
            return res.status(403).json({ message: 'Chỉ người bán nguyên liệu này mới được đổi trạng thái' });
        }
        
        const { status } = req.body; 
        const validStatuses = ['pending', 'shipping', 'completed'];
        if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

        order.status = status;
        await order.save();
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;