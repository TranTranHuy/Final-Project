// backend/models/Ingredient.js
const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Does not allow duplicate names
    trim: true
  },
  image: {
    type: String, // [NEW] Add field to store image path
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ingredient', IngredientSchema);