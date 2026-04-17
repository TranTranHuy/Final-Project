// src/App.jsx - Phiên bản đầy đủ với quản lý công thức (edit/delete)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, useLocation } from 'react-router-dom'; // Chỉ import Routes + Route + useLocation
import Header from './components/Header';
import RecipeCard from './components/RecipeCard';
import CreateRecipe from './components/CreateRecipe';
import ManageRecipes from './components/ManageRecipes';
import EditRecipe from './components/EditRecipe';
import RecipeDetail from './components/RecipeDetail';
import ManageCategories from './components/ManageCategories';
import Login from './components/Login';
import Register from './components/Register';
// [MỚI] Import trang duyệt bài Admin
import AdminModeration from './components/AdminModeration';
import ManageIngredients from './components/ManageIngredients'; // [MỚI] Import trang này

const App = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/recipes');
        setRecipes(response.data);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, [location.pathname]); // Fetch lại mỗi khi route thay đổi (tự cập nhật sau tạo/sửa/xóa)

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
                <h2 style={{ textAlign: 'center', margin: '40px 0 30px' }}>Featured Recipes</h2>

                {loading ? (
                  <p style={{ textAlign: 'center', fontSize: '18px' }}>Đang tải công thức...</p>
                ) : recipes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>
                    Chưa có công thức nào. Hãy tạo mới nhé! 🍳
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

          {/* Trang tạo công thức mới */}
          <Route path="/create-recipe" element={<CreateRecipe />} />

          {/* Trang quản lý công thức (edit/delete) */}
          <Route path="/manage-recipes" element={<ManageRecipes />} />

          {/* Trang sửa công thức */}
          <Route path="/edit-recipe/:id" element={<EditRecipe />} />

          {/* Trang chi tiết công thức */}
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          {/* Trang quản lý danh mục */}
          <Route path="/manage-categories" element={<ManageCategories />} />
          {/* Trang đăng nhập */}
          <Route path="/login" element={<Login />} />
          {/* Trang đăng ký */}
          <Route path="/register" element={<Register />} />
          {/* [MỚI] Thêm Route cho Admin */}
          <Route path="/admin/moderation" element={<AdminModeration />} />
          {/* [MỚI] Route Quản lý Kho nguyên liệu */}
          <Route path="/admin/ingredients" element={<ManageIngredients />} />
        </Routes>
      </div>
    </>
  );
};

export default App;