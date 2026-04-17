// backend/models/Recipe.js
const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    ingredients: [{ type: String }],
    extendedIngredients: [{
        name: String,
        price: Number,
        image: String
    }],
    instructions: { type: String, required: true },
    image: { type: String },
    category: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // [MỚI] Trạng thái bài viết: 'pending' (chờ duyệt), 'approved' (đã duyệt), 'rejected' (từ chối)
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    
    // [MỚI] Lưu tên các nguyên liệu mà user nhập nhưng chưa có trong kho Admin
    unknownIngredients: [{ type: String }],

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recipe', RecipeSchema);