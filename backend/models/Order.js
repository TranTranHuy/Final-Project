// backend/models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Save the list of items when placing the order (in case the seller changes the price later)
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sellerName: { type: String },
    quantity: { type: Number, required: true }
  }],
  
  // Delivery Information
  shippingInfo: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true }
  },
  
  totalPrice: { type: Number, required: true },
  //Payment Information
  paymentMethod: { type: String, required: true, default: 'COD' },
  paymentStatus: { type: String, default: 'Not Paid' },
  
  // Order Status: pending (waiting for confirmation), shipping (in transit), completed (completed)
  status: { type: String, default: 'pending' },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);