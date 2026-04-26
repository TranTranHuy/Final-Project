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
    
    // Post status: 'pending', 'approved', 'rejected'
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    
    //Save the names of ingredients that the user enters but are not in the Admin inventory
    unknownIngredients: [{ type: String }],

    createdAt: { type: Date, default: Date.now },

    //List of users who liked the post (save user IDs)
  likes: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
  }],

  // List of comments
  comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
  }],
});

module.exports = mongoose.model('Recipe', RecipeSchema);