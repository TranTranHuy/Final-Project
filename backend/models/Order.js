// backend/models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Lưu lại danh sách món hàng lúc đặt (để đề phòng sau này người bán đổi giá)
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sellerName: { type: String },
    quantity: { type: Number, required: true }
  }],
  
  // Thông tin giao hàng
  shippingInfo: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true }
  },
  
  totalPrice: { type: Number, required: true },
  // [MỚI THÊM] Thông tin thanh toán
  paymentMethod: { type: String, required: true, default: 'COD' },
  paymentStatus: { type: String, default: 'Chưa thanh toán' },
  
  // Trạng thái đơn: pending (chờ xác nhận), shipping (đang giao), completed (hoàn thành)
  status: { type: String, default: 'pending' },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);