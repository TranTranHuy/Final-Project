// backend/app.js
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import http and socket.io
const http = require('http'); 
const { Server } = require('socket.io'); 
const Message = require('./models/Message');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json()); 

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// ==========================================
// REGISTER ALL ROUTES HERE
// ==========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/ingredients', require('./routes/ingredients')); 
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));

// ==========================================
// HTTP & SOCKET.IO SERVER CONFIGURATION
// ==========================================
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// HANDLE CHAT CONNECTION EVENTS
io.on('connection', (socket) => {
    console.log('⚡ New Socket connection:', socket.id);

    // 1. Add user to a secure private room
    socket.on('setup', (userId) => {
        if (!userId) return;
        socket.join(String(userId));
        console.log(`✅ User [${userId}] joined the message room`);
    });

    // 2. Receive message and forward it
    socket.on('sendMessage', async (data) => {
        try {
            const { senderId, receiverId, text } = data;
            console.log(`📩 Message from ${senderId} to ${receiverId}`);

            // Save to DB
            const newMessage = new Message({ sender: senderId, receiver: receiverId, text });
            await newMessage.save();

            // [IMPORTANT] Convert all values to static Strings before sending via Socket
            const plainMsg = {
                _id: newMessage._id,
                sender: String(newMessage.sender),
                receiver: String(newMessage.receiver),
                text: newMessage.text,
                createdAt: newMessage.createdAt
            };

            // Emit directly to receiver room
            socket.to(String(receiverId)).emit('receiveMessage', plainMsg);
            console.log(`📤 Message sent to room [${receiverId}] successfully!`);
        } catch (error) {
            console.error("❌ Backend error when sending message:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ A user disconnected');
    });
});

// ==========================================
// START SYNCHRONOUS SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server & Socket.io running on port ${PORT}`);
});