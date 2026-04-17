// backend/models/Ingredient.js
const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Không trùng tên
    trim: true
  },
  image: {
    type: String, // [MỚI] Thêm trường lưu đường dẫn ảnh
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ingredient', IngredientSchema);