// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Authentication Middleware

// 1. Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long and include uppercase, lowercase, number, and special character.' 
            });
        }
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already exists' });

    user = new User({ username, email, password });
    
    // Password encryption
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create Token
    const payload = {
      user: {
        id: user.id,
        role: user.role //Add role to token
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 2. Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email or password is incorrect' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Email or password is incorrect' });

    // create Token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        avatar: user.avatar //Add role to token
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      // Returns user information for the frontend to use
      res.json({ 
        token, 
        user: { 
          id: user.id,   // Frontend needs this to compare owners.
          username: user.username, 
          email: user.email,
          role: user.role, 
          avatar: user.avatar
        } 
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 3. Get current user information.
router.get('/', auth, async (req, res) => {
    try {
        // Find user by ID from the token and return all information (except password)
        const user = await User.findById(req.user.id).select('-password');
        res.json(user); 
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;