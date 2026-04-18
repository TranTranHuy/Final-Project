// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Lấy lịch sử chat giữa 2 người
router.get('/conversations', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        // Tìm tất cả tin nhắn liên quan đến User này, sau đó nhóm theo người gửi/nhận
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).sort({ createdAt: -1 }).populate('sender receiver', 'username');

        // Logic để lọc ra danh sách Unique Users (những người đã chat cùng)
        const chatPartners = [];
        const seenIds = new Set();

        messages.forEach(msg => {
            const partner = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
            if (!seenIds.has(partner._id.toString())) {
                seenIds.add(partner._id.toString());
                chatPartners.push({
                    otherUser: partner,
                    lastMessage: msg.text
                });
            }
        });

        res.json(chatPartners);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;