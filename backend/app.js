// backend/app.js
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import http và socket.io
const http = require('http'); 
const { Server } = require('socket.io'); 
const Message = require('./models/Message');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json()); 

// Phục vụ ảnh tĩnh
app.use('/uploads', express.static('uploads'));

// ==========================================
// ĐĂNG KÝ TẤT CẢ CÁC ROUTES TẠI ĐÂY
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

// ==========================================
// CẤU HÌNH SERVER HTTP & SOCKET.IO
// ==========================================
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// XỬ LÝ SỰ KIỆN KẾT NỐI CHAT
io.on('connection', (socket) => {
    console.log('⚡ Kết nối Socket mới:', socket.id);

    // 1. Cho người dùng vào phòng cá nhân an toàn
    socket.on('setup', (userId) => {
        if (!userId) return;
        socket.join(String(userId));
        console.log(`✅ User [${userId}] đã tham gia phòng nhận tin`);
    });

    // 2. Nhận tin và gửi đi
    socket.on('sendMessage', async (data) => {
        try {
            const { senderId, receiverId, text } = data;
            console.log(`📩 Có tin nhắn gửi từ ${senderId} tới ${receiverId}`);

            // Lưu vào DB
            const newMessage = new Message({ sender: senderId, receiver: receiverId, text });
            await newMessage.save();

            // [QUAN TRỌNG] Ép kiểu toàn bộ về String tĩnh trước khi bắn qua Socket
            const plainMsg = {
                _id: newMessage._id,
                sender: String(newMessage.sender),
                receiver: String(newMessage.receiver),
                text: newMessage.text,
                createdAt: newMessage.createdAt
            };

            // Gửi trực tiếp vào phòng người nhận
            socket.to(String(receiverId)).emit('receiveMessage', plainMsg);
            console.log(`📤 Đã bắn tin nhắn tới phòng [${receiverId}] thành công!`);
        } catch (error) {
            console.error("❌ Lỗi Backend khi gửi tin nhắn:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Một người dùng đã ngắt kết nối');
    });
});

// ==========================================
// KHỞI ĐỘNG SERVER ĐỒNG NHẤT
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server & Socket.io đang chạy tại port ${PORT}`);
});