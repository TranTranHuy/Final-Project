// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Lấy token từ header 'x-auth-token' (frontend sẽ gửi token này khi gọi API)
  const token = req.header('x-auth-token');

  // Nếu không có token → từ chối truy cập
  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Thay 'your_jwt_secret' bằng secret thật (nên dùng process.env.JWT_SECRET)
    req.user = decoded.user; // Lưu thông tin user vào req để dùng sau (ví dụ: req.user.id, req.user.role)
    next(); // Cho phép đi tiếp
  } catch (err) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};