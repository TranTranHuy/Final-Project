// src/components/AdminModeration.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'; // [MỚI] Import để chuyển trang

const AdminModeration = () => {
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPending = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/recipes?status=pending');
      setPendingRecipes(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  // [MỚI] Hàm Duyệt (Accept) nguyên liệu mới
  const handleAcceptIngredient = async (recipeId, ingredientName) => {
    try {
        const token = localStorage.getItem('token');
        
        // 1. Thêm nguyên liệu vào Kho Database chung
        await axios.post('http://localhost:5000/api/ingredients', 
            { name: ingredientName }, 
            { headers: { 'x-auth-token': token } }
        );

        // 2. Xóa nguyên liệu này khỏi danh sách cảnh báo của bài viết hiện tại
        await axios.put(`http://localhost:5000/api/recipes/${recipeId}/remove-unknown-ingredient`, 
            { ingredientName }, 
            { headers: { 'x-auth-token': token } }
        );

        // 3. Cập nhật lại UI ngay lập tức (không cần load lại trang)
        setPendingRecipes(prevRecipes => 
            prevRecipes.map(recipe => {
                if (recipe._id === recipeId) {
                    return {
                        ...recipe,
                        unknownIngredients: recipe.unknownIngredients.filter(name => name !== ingredientName)
                    };
                }
                return recipe;
            })
        );

        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        Toast.fire({ icon: 'success', title: `Đã duyệt & Thêm "${ingredientName}" vào Kho!` });

    } catch (error) {
        // Nếu nguyên liệu đã có sẵn trong kho do ai đó vừa thêm, backend sẽ báo lỗi 400
        const errMsg = error.response?.data?.message || 'Không thể thêm';
        Swal.fire('Chú ý', errMsg, 'warning');
    }
  };

  // Hàm duyệt bài đăng
  const approveRecipe = async (id) => {
    try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/recipes/${id}/approve`, {}, {
            headers: { 'x-auth-token': token }
        });
        Swal.fire('Đã duyệt!', 'Bài viết đã được hiển thị công khai.', 'success');
        setPendingRecipes(pendingRecipes.filter(r => r._id !== id));
    } catch (error) {
        console.error('Chi tiết lỗi duyệt bài:', error);
        
        // [ĐÃ SỬA] Bắt chính xác lỗi từ Backend trả về
        const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi duyệt bài!';
        Swal.fire('Lỗi', errorMsg, 'error');
    }
  };

  // Hàm Từ chối / Xóa bài đăng
  const rejectRecipe = (id) => {
      Swal.fire({
          title: 'Từ chối bài đăng này?',
          text: 'Bài viết sẽ bị xóa khỏi hệ thống.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Xóa ngay'
      }).then(async (result) => {
          if (result.isConfirmed) {
              try {
                  const token = localStorage.getItem('token');
                  await axios.delete(`http://localhost:5000/api/recipes/${id}`, { headers: { 'x-auth-token': token } });
                  setPendingRecipes(pendingRecipes.filter(r => r._id !== id));
                  Swal.fire('Đã xóa', 'Bài đăng đã bị từ chối.', 'success');
              } catch (err) {
                  Swal.fire('Lỗi', 'Không thể xóa', 'error');
              }
          }
      });
  };

  if (loading) return <p style={{textAlign:'center', marginTop:'50px'}}>Đang tải bài viết chờ duyệt...</p>;

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#dc3545', marginBottom: '30px' }}>
          🛡️ Quản lý phê duyệt bài viết ({pendingRecipes.length})
      </h2>
      
      {pendingRecipes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>🎉 Không có bài viết nào cần duyệt!</p>
      ) : (
          <div style={{ display: 'grid', gap: '30px' }}>
              {pendingRecipes.map(recipe => (
                  <div key={recipe._id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '22px' }}>{recipe.title}</h3>
                            {/* [MỚI] Hiển thị tên người đăng thay vì ID */}
                            <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '15px' }}>
                                👤 Người đăng: <strong style={{ color: '#007bff' }}>{recipe.user?.username || 'Unknown'}</strong>
                            </p>
                            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '14px', color: '#888' }}>
                                📂 Danh mục: {recipe.category || 'Không có'}
                            </p>
                          </div>
                          {recipe.image && (
                              <img src={`http://localhost:5000${recipe.image}`} alt="Preview" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                          )}
                      </div>

                      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                      {/* KHU VỰC CẢNH BÁO NGUYÊN LIỆU LẠ */}
                      {recipe.unknownIngredients && recipe.unknownIngredients.length > 0 ? (
                          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
                              <h4 style={{ margin: '0 0 10px 0', color: '#856404', display:'flex', alignItems:'center', gap:'8px' }}>
                                  ⚠️ Có nguyên liệu mới cần duyệt
                              </h4>
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                  {recipe.unknownIngredients.map((name, idx) => (
                                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ffdf7e' }}>
                                          <span style={{ fontWeight: 'bold', color: '#333' }}>{name}</span>
                                          {/* [MỚI] Nút Accept nguyên liệu */}
                                          <button 
                                            onClick={() => handleAcceptIngredient(recipe._id, name)}
                                            style={{ background: '#28a745', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(40,167,69,0.3)' }}
                                          >
                                            ✓ Accept
                                          </button>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      ) : (
                          <div style={{ background: '#d4edda', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                              <p style={{ color: '#155724', margin: 0, fontSize: '14px', fontWeight: 'bold' }}>✅ Tất cả nguyên liệu đều nằm trong kho dữ liệu chuẩn.</p>
                          </div>
                      )}

                      {/* KHU VỰC NÚT ĐIỀU KHIỂN */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
                          {/* [MỚI] Nút Xem chi tiết */}
                          <button 
                            onClick={() => navigate(`/recipe/${recipe._id}`)}
                            style={{ padding: '10px 20px', background: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            👁️ Xem chi tiết
                          </button>
                          
                          <button 
                            onClick={() => rejectRecipe(recipe._id)}
                            style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Từ chối
                          </button>
                          
                          <button 
                            onClick={() => approveRecipe(recipe._id)}
                            style={{ padding: '10px 25px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                          >
                            Duyệt bài đăng
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default AdminModeration;