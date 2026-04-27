// src/App.jsx - Full version with recipe management + SEARCH, FILTER & BANNER
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import RecipeCard from './components/RecipeCard';
import CreateRecipe from './components/CreateRecipe';
import ManageRecipes from './components/ManageRecipes';
import EditRecipe from './components/EditRecipe';
import RecipeDetail from './components/RecipeDetail';
import ManageCategories from './components/ManageCategories';
import Login from './components/Login';
import Register from './components/Register';
import Marketplace from "./components/Marketplace";
import AdminModeration from './components/AdminModeration';
import ManageIngredients from './components/ManageIngredients';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import MyOrders from './components/MyOrders';
import Inbox from './components/Inbox';
import UserProfile from './components/UserProfile';
import Favorites from './components/Favorites';
import ManageSales from './components/ManageSales';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import ManageUsers from './components/ManageUsers';

//Import TopBanner you just created
import TopBanner from './components/TopBanner'; 

const App = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  const location = useLocation();

  // Get list of categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Get the list of recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/recipes?search=${searchTerm}&category=${selectedCategory}`);
        setRecipes(response.data);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
        fetchRecipes();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [location.pathname, searchTerm, selectedCategory]); 

  return (
    <>
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Add Routes to the Main Container */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        <Routes>
          {/* THome page */}
          <Route
            path="/"
            element={
              <>
                {/* [IMPORTANT] PUT BANNER HERE! It will display beautifully at the top of the homepage */}
                {/* Hide Banner if user is searching to focus on results */}
                {!searchTerm && !selectedCategory && <TopBanner />}

                <h2 style={{ textAlign: 'center', margin: '40px 0 30px', color: '#333' }}>🍳 Discover Recipes</h2>

                {/* SEARCH BAR AND CATEGORY FILTER */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <input 
                        type="text" 
                        placeholder="🔍 Search recipes (e.g.: Fried chicken, Beef steak...)" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '12px 20px', borderRadius: '30px', border: '1px solid #ccc', minWidth: '350px', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    />
                    
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ padding: '12px 20px', borderRadius: '30px', border: '1px solid #ccc', cursor: 'pointer', outline: 'none', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minWidth: '200px' }}
                    >
                        <option value="">📁 All categories</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                  <p style={{ textAlign: 'center', fontSize: '18px', color: '#888' }}>Loading recipes...</p>
                ) : recipes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '18px', padding: '40px', background: '#f9f9f9', borderRadius: '12px' }}>
                    No recipes match your search. 🍳
                  </p>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '24px',
                    }}
                  >
                    {recipes.map((recipe) => (
                      <RecipeCard key={recipe._id} recipe={recipe} />
                    ))}
                  </div>
                )}
              </>
            }
          />

          <Route path="/create-recipe" element={<CreateRecipe />} />
          <Route path="/manage-recipes" element={<ManageRecipes />} />
          <Route path="/edit-recipe/:id" element={<EditRecipe />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/manage-categories" element={<ManageCategories />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
          <Route path="/admin/ingredients" element={<ManageIngredients />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/messages" element={<Inbox />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/manage-sales" element={<ManageSales />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          
        </Routes>
      </div>
      <Footer />
    </>
  );
};

export default App;