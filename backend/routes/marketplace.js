// backend/routes/marketplace.js
const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');

// Retrieve all ingredients currently for sale on the system (Search support)
router.get('/', async (req, res) => {
    try {
        const { search } = req.query; // Receive search keyword from Frontend
        const recipes = await Recipe.find({ status: 'approved' }).populate('user', 'username');
        
        let marketItems = [];

        recipes.forEach(recipe => {
            if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
                recipe.extendedIngredients.forEach(ing => {
                    if (ing.price && ing.price > 0) {
                        // IF there is a search keyword, check if the ingredient name contains the keyword
                        if (search && !ing.name.toLowerCase().includes(search.toLowerCase())) {
                            return; // If it doesn't contain the keyword, skip it
                        }

                        marketItems.push({
                            _id: ing._id || Math.random().toString(),
                            name: ing.name,
                            price: ing.price,
                            image: ing.image,
                            sellerId: recipe.user ? recipe.user._id : null,
                            sellerName: recipe.user ? recipe.user.username : 'Anonymous',
                            recipeId: recipe._id,
                            recipeTitle: recipe.title
                        });
                    }
                });
            }
        });

        res.json(marketItems);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;