// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// API: Tìm kiếm người dùng theo tên
router.get('/search', auth, async (req, res) => {
    try {
        const keyword = req.query.q;
        if (!keyword) return res.json([]);

        // Tìm user có username chứa từ khóa (không phân biệt hoa thường)
        // VÀ _id không phải là người đang đăng nhập ($ne: not equal)
        const users = await User.find({
            username: { $regex: keyword, $options: 'i' },
            _id: { $ne: req.user.id }
        }).select('username _id'); // Chỉ lấy ID và Tên để bảo mật

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;