// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// 1. Retrieve list of conversations (Displayed in the left column)
// NOTE: Fixed route (/conversations) must be placed BEFORE dynamic parameter routes
router.get('/conversations', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        // Find all messages related to this User
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
       }).sort({ createdAt: -1 }).populate('sender receiver', 'username avatar');

        // Filter out duplicate chat partners
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
        res.status(500).json({ message: 'Error occurred while fetching conversation list' });
    }
});

// 2. Retrieve detailed chat history between 2 users (Displayed in the right chat panel)
router.get('/:user1Id/:user2Id', auth, async (req, res) => {
    try {
        const { user1Id, user2Id } = req.params;
        
        // Find all messages sent between these two IDs
        const messages = await Message.find({
            $or: [
                { sender: user1Id, receiver: user2Id },
                { sender: user2Id, receiver: user1Id }
            ]
        }).sort({ createdAt: 1 }); // Sort by creation time ascending (oldest at the top)
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error occurred while fetching detailed chat history' });
    }
});

module.exports = router;