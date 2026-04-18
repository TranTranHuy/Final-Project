// backend/models/Cart.js
const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người mua
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // [QUAN TRỌNG] Lưu ID người bán
    sellerName: { type: String }, // Tên người bán
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }, // Mua từ bài viết nào
    quantity: { type: Number, default: 1 }
  }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', CartSchema);