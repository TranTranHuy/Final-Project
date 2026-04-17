// backend/routes/categories.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth'); // Middleware xác thực

// 1. Lấy tất cả danh mục (Ai cũng xem được)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// 2. Thêm danh mục mới (Cần đăng nhập)
router.post('/', auth, async (req, res) => {
  const { name, image } = req.body;
  try {
    let category = await Category.findOne({ name });
    if (category) return res.status(400).json({ message: 'Danh mục đã tồn tại' });

    category = new Category({
      name,
      image,
      user: req.user.id // [QUAN TRỌNG] Lưu ID người tạo
    });

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).send('Lỗi Server');
  }
});

// 3. Sửa danh mục (Phân quyền)
router.put('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Không tìm thấy' });

    // --- KIỂM TRA QUYỀN ---
    const isOwner = category.user && category.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Nếu không phải chủ sở hữu VÀ không phải Admin -> Chặn
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa danh mục này' });
    }
    // ---------------------

    category.name = req.body.name || category.name;
    category.image = req.body.image || category.image;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).send('Lỗi Server');
  }
});

// 4. Xóa danh mục (Phân quyền)
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Không tìm thấy' });

    // --- KIỂM TRA QUYỀN ---
    const isOwner = category.user && category.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa danh mục này' });
    }
    // ---------------------

    await category.deleteOne();
    res.json({ message: 'Đã xóa danh mục' });
  } catch (err) {
    res.status(500).send('Lỗi Server');
  }
});

module.exports = router;