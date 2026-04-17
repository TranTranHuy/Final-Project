// backend/app.js
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const bodyParser = require('body-parser');
const recipeRoutes = require('./routes/recipes');


const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json()); // Chỉ dùng cho JSON, không ảnh hưởng multipart

// Phục vụ ảnh tĩnh
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/recipes', recipeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use('/api/categories', require('./routes/categories'));

app.use('/api/auth', require('./routes/auth'));

app.use('/api/ingredients', require('./routes/ingredients')); // Thêm dòng này
app.use('/api/recipes', require('./routes/recipes'));