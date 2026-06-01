// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// API: Get conversation list (Left column)
router.get('/conversations', auth, async (req, res) => {
    try {
        const myId = req.user.id;

        // Find all messages involving the current user
        const messages = await Message.find({
            $or: [{ sender: myId }, { receiver: myId }]
        })
        .sort({ createdAt: -1 })
        .populate('sender receiver', 'username avatar');

        const contacts = new Map();

        messages.forEach(msg => {
            // Check if sender/receiver exists to avoid crash if a user was deleted
            if (!msg.sender || !msg.receiver) return;

            // Determine the other participant
            const otherUser = String(msg.sender._id) === String(myId) ? msg.receiver : msg.sender;
            
            if (otherUser && !contacts.has(String(otherUser._id))) {
                contacts.set(String(otherUser._id), {
                    otherUser: {
                        _id: otherUser._id,
                        username: otherUser.username,
                        avatar: otherUser.avatar
                    },
                    lastMessage: msg.text,
                    updatedAt: msg.createdAt
                });
            }
        });

        res.json(Array.from(contacts.values()));
    } catch (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).json({ message: 'Error occurred while fetching conversation list' });
    }
});

// API: Get detailed chat history between 2 users
router.get('/:user1Id/:user2Id', auth, async (req, res) => {
    try {
        const { user1Id, user2Id } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: user1Id, receiver: user2Id },
                { sender: user2Id, receiver: user1Id }
            ]
        }).sort({ createdAt: 1 });
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chat history' });
    }
});

module.exports = router;