// src/App.jsx - Phiên bản đầy đủ với quản lý công thức (edit/delete) + TÌM KIẾM & LỌC
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

const App = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // [MỚI] State cho Tìm kiếm và Lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  const location = useLocation();

  // [MỚI] Lấy danh sách danh mục (để đưa vào ô Select)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      }
    };
    fetchCategories();
  }, []);

  // Lấy danh sách công thức (Có áp dụng tìm kiếm và lọc)
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        // [ĐÃ SỬA] Gắn thêm searchTerm và selectedCategory vào URL
        const response = await axios.get(`http://localhost:5000/api/recipes?search=${searchTerm}&category=${selectedCategory}`);
        setRecipes(response.data);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    // Dùng setTimeout để đợi người dùng gõ xong mới gọi API (chống lag)
    const delayDebounceFn = setTimeout(() => {
        fetchRecipes();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [location.pathname, searchTerm, selectedCategory]); 

  return (
    <>
      <Header />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        <Routes>
          {/* Trang chủ - hiển thị danh sách recipes */}
          <Route
            path="/"
            element={
              <>
                <h2 style={{ textAlign: 'center', margin: '40px 0 30px', color: '#333' }}>🍳 Khám phá Công thức</h2>

                {/* [MỚI] THANH TÌM KIẾM VÀ LỌC DANH MỤC */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {/* Ô tìm kiếm */}
                    <input 
                        type="text" 
                        placeholder="🔍 Tìm công thức nấu ăn (VD: Gà rán, Bò né...)" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '12px 20px', borderRadius: '30px', border: '1px solid #ccc', minWidth: '350px', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    />
                    
                    {/* Bộ lọc danh mục */}
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ padding: '12px 20px', borderRadius: '30px', border: '1px solid #ccc', cursor: 'pointer', outline: 'none', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minWidth: '200px' }}
                    >
                        <option value="">📁 Tất cả danh mục</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                  <p style={{ textAlign: 'center', fontSize: '18px', color: '#888' }}>Đang tải công thức...</p>
                ) : recipes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '18px', padding: '40px', background: '#f9f9f9', borderRadius: '12px' }}>
                    Không tìm thấy công thức nào phù hợp. 🍳
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
        </Routes>
      </div>
    </>
  );
};

export default App;