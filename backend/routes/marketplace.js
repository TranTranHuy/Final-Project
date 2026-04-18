// backend/routes/marketplace.js
const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');

// Lấy tất cả nguyên liệu đang bán trên hệ thống (Hỗ trợ tìm kiếm)
router.get('/', async (req, res) => {
    try {
        const { search } = req.query; // Nhận từ khóa tìm kiếm từ Frontend
        const recipes = await Recipe.find({ status: 'approved' }).populate('user', 'username');
        
        let marketItems = [];

        recipes.forEach(recipe => {
            if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
                recipe.extendedIngredients.forEach(ing => {
                    if (ing.price && ing.price > 0) {
                        // NẾU có từ khóa tìm kiếm, kiểm tra xem tên nguyên liệu có chứa từ khóa không
                        if (search && !ing.name.toLowerCase().includes(search.toLowerCase())) {
                            return; // Nếu không chứa thì bỏ qua, không push vào mảng
                        }

                        marketItems.push({
                            _id: ing._id || Math.random().toString(),
                            name: ing.name,
                            price: ing.price,
                            image: ing.image,
                            sellerId: recipe.user ? recipe.user._id : null,
                            sellerName: recipe.user ? recipe.user.username : 'Ẩn danh',
                            recipeId: recipe._id,
                            recipeTitle: recipe.title
                        });
                    }
                });
            }
        });

        res.json(marketItems);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;