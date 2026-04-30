// backend/models/Cart.js
const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Buyer
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Save the seller ID
    sellerName: { type: String }, // Seller's name
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }, // Purchase from which recipe
    quantity: { type: Number, default: 1 }
  }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', CartSchema);
