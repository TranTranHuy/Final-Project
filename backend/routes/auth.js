// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Middleware xác thực

// 1. Đăng ký (Register)
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email đã tồn tại' });

    user = new User({ username, email, password });
    
    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Tạo Token
    const payload = {
      user: {
        id: user.id,
        role: user.role // [QUAN TRỌNG] Nạp role vào token
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// 2. Đăng nhập (Login)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Thông tin đăng nhập không đúng' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Thông tin đăng nhập không đúng' });

    // Tạo Token
    const payload = {
      user: {
        id: user.id,
        role: user.role // [QUAN TRỌNG] Nạp role vào token
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      // [QUAN TRỌNG] Trả về thông tin user để Frontend dùng
      res.json({ 
        token, 
        user: { 
          id: user.id,   // Frontend cần cái này để so sánh owner
          username: user.username, 
          email: user.email,
          role: user.role 
        } 
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// 3. Lấy thông tin User hiện tại (Me)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

module.exports = router;