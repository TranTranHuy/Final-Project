// src/components/ManageRecipes.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';

const ManageRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/recipes');
        
        // --- LOGIC PHÂN QUYỀN (ĐÃ SỬA) ---
        if (user && user.role === 'admin') {
          // Admin thấy tất cả
          setRecipes(response.data);
        } else if (user) {
          // [QUAN TRỌNG] Lấy ID chuẩn của user hiện tại
          const currentUserId = user.id || user._id;

          // Lọc bài viết: Chỉ lấy bài có ID người tạo trùng với ID user hiện tại
          const myRecipes = response.data.filter(r => {
             // Kiểm tra nếu bài viết không có người tạo (bài cũ) thì bỏ qua
             if (!r.user) return false;

             // Xử lý trường hợp r.user là object (nếu backend populate) hoặc string
             const recipeCreatorId = (typeof r.user === 'object') ? r.user._id : r.user;
             
             // So sánh dạng chuỗi để đảm bảo chính xác
             return recipeCreatorId.toString() === currentUserId.toString();
          });
          
          setRecipes(myRecipes);
        }
      } catch (error) {
        console.error('Lỗi tải danh sách:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchRecipes();
  }, [user]);

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Bạn chắc chắn muốn xóa?',
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Xóa ngay'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Gửi kèm token để backend xác thực
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/recipes/${id}`, {
            headers: { 'x-auth-token': token }
          });
          
          setRecipes(recipes.filter(recipe => recipe._id !== id));
          Swal.fire('Đã xóa!', 'Bài viết đã bị xóa.', 'success');
        } catch (error) {
          console.error("Chi tiết lỗi:", error);
          
          // [ĐÃ SỬA] Lấy chính xác thông báo lỗi từ Backend
          const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi xóa!';
          Swal.fire('Thất bại', errorMsg, 'error');
        }
      }
    });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#ff6b00' }}>
        {user?.role === 'admin' ? 'Quản lý toàn bộ công thức (Admin)' : 'Công thức của tôi'}
      </h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : recipes.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>Bạn chưa đăng công thức nào.</p>
          <button 
            onClick={() => navigate('/create-recipe')}
            style={{ marginTop: '15px', padding: '10px 20px', background: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
          >
            + Tạo công thức ngay
          </button>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Tiêu đề</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Danh mục</th>
              {/* Cột người tạo chỉ Admin mới cần xem */}
              {user?.role === 'admin' && (
                 <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>ID Người tạo</th>
              )}
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((recipe) => (
              <tr key={recipe._id}>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{recipe.title}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{recipe.category || '-'}</td>
                
                {user?.role === 'admin' && (
                  <td style={{ border: '1px solid #ddd', padding: '12px', fontSize: '12px', color: '#666' }}>
                    {typeof recipe.user === 'object' ? recipe.user._id : recipe.user || 'Ẩn danh'}
                  </td>
                )}

                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                  <button 
                    onClick={() => navigate(`/edit-recipe/${recipe._id}`)} 
                    style={{ background: '#ffc107', border: 'none', padding: '6px 12px', marginRight: '8px', borderRadius: '4px', cursor: 'pointer', color: '#333', fontWeight: 'bold' }}
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(recipe._id)} 
                    style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageRecipes;