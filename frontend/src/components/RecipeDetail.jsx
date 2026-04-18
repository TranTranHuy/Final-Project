// src/components/RecipeDetail.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // [MỚI] Import thư viện thông báo

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/recipes/${id}`);
        setRecipe(response.data);
      } catch (err) {
        console.error('Lỗi tải chi tiết:', err);
        setError('Không tìm thấy công thức hoặc có lỗi kết nối.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  // [MỚI] Hàm xử lý khi bấm nút "Thêm vào giỏ"
  const handleAddToCart = async (ing) => {
    const token = localStorage.getItem('token');
    
    // Kiểm tra đăng nhập
    if (!token) {
        Swal.fire({
            title: 'Chú ý',
            text: 'Bạn cần đăng nhập để mua nguyên liệu!',
            icon: 'warning',
            confirmButtonColor: '#ff6b00',
            confirmButtonText: 'Đăng nhập ngay'
        }).then((result) => {
            if (result.isConfirmed) navigate('/login');
        });
        return;
    }

    try {
        // Gửi thông tin nguyên liệu, giá và người bán xuống giỏ hàng
        await axios.post('http://localhost:5000/api/cart/add', {
            name: ing.name,
            price: ing.price,
            image: ing.image,
            sellerId: recipe.user?._id || null, // Lấy ID của người viết bài
            sellerName: recipe.user?.username || 'Ẩn danh',
            recipeId: recipe._id
        }, {
            headers: { 'x-auth-token': token }
        });

        // Thông báo thành công kiểu Toast (nhỏ gọn góc phải)
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500
        });
        Toast.fire({
            icon: 'success',
            title: `Đã thêm ${ing.name} vào giỏ!`
        });

    } catch (err) {
        console.error('Lỗi thêm giỏ hàng:', err);
        Swal.fire('Lỗi', 'Không thể thêm vào giỏ hàng. Vui lòng thử lại!', 'error');
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '100px', fontSize: '18px' }}>Đang tải chi tiết công thức...</p>;
  if (error) return <p style={{ textAlign: 'center', marginTop: '100px', color: 'red', fontSize: '18px' }}>{error}</p>;
  if (!recipe) return <p style={{ textAlign: 'center', marginTop: '100px', fontSize: '18px' }}>Công thức không tồn tại.</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '60px auto', padding: '30px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          background: '#f0f0f0',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#555'
        }}
      >
        ← Quay lại
      </button>

      {/* Ảnh lớn */}
      <div style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        {recipe.image ? (
            <img
            src={`http://localhost:5000${recipe.image}`}
            alt={recipe.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        ) : (
            <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                Chưa có ảnh
            </div>
        )}
      </div>

      {/* Tiêu đề */}
      <h1 style={{ textAlign: 'center', color: '#ff6b00', marginBottom: '10px', fontSize: '32px' }}>
        {recipe.title}
      </h1>

      {/* Danh mục */}
      {recipe.category && (
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px', fontSize: '16px', background: '#f9f9f9', display: 'inline-block', padding: '5px 15px', borderRadius: '20px', position: 'relative', left: '50%', transform: 'translateX(-50%)' }}>
          📂 {recipe.category}
        </p>
      )}

      {/* Grid Layout: Chia 2 cột nếu màn hình đủ rộng (Text bên trái, Chợ bên phải) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
          
          {/* CỘT TRÁI: Hướng dẫn nấu & Danh sách text */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            {/* Nguyên liệu (Dạng Text cũ) */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#333', borderLeft: '4px solid #ff6b00', paddingLeft: '10px', marginBottom: '15px' }}>
                    📝 Nguyên liệu cần chuẩn bị
                </h3>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '16px', lineHeight: '1.8', color: '#444' }}>
                {recipe.ingredients.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
                </ul>
            </div>

            {/* Hướng dẫn nấu */}
            <div>
                <h3 style={{ color: '#333', borderLeft: '4px solid #ff6b00', paddingLeft: '10px', marginBottom: '15px' }}>
                    🍳 Hướng dẫn thực hiện
                </h3>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.8', color: '#444', background: '#fcfcfc', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                {recipe.instructions}
                </div>
            </div>
          </div>

          {/* CỘT PHẢI: Chợ nguyên liệu (Extended Ingredients) */}
          {/* Chỉ hiển thị nếu có dữ liệu */}
          {recipe.extendedIngredients && recipe.extendedIngredients.length > 0 && (
              <div style={{ flex: 0.8, minWidth: '280px' }}>
                  <div style={{ background: '#fff9f5', padding: '20px', borderRadius: '12px', border: '1px solid #ffdec2' }}>
                    <h3 style={{ color: '#d95a00', marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>
                        🛒 Mua nguyên liệu ngay
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
                        {recipe.extendedIngredients.map((ing, index) => (
                            <div key={index} style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #eee', transition: 'transform 0.2s' }}>
                                {/* Ảnh nguyên liệu */}
                                <div style={{ height: '100px', background: '#eee' }}>
                                    {ing.image ? (
                                        <img 
                                            src={`http://localhost:5000${ing.image}`} 
                                            alt={ing.name} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: '12px' }}>No Img</div>
                                    )}
                                </div>
                                
                                {/* Thông tin */}
                                <div style={{ padding: '10px' }}>
                                    <p style={{ margin: '0 0 5px', fontWeight: '600', fontSize: '14px', color: '#333' }}>{ing.name}</p>
                                    <p style={{ margin: '0', color: '#ff6b00', fontWeight: 'bold', fontSize: '13px' }}>
                                        {ing.price ? parseInt(ing.price).toLocaleString() : 0} đ
                                    </p>
                                    
                                    {/* [SỬA ĐỔI] Gắn sự kiện onClick vào nút Giỏ Hàng */}
                                    <button 
                                        onClick={() => handleAddToCart(ing)}
                                        style={{ width: '100%', marginTop: '8px', padding: '5px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.target.style.background = '#ff6b00'}
                                        onMouseLeave={(e) => e.target.style.background = '#333'}
                                    >
                                        + Giỏ hàng
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default RecipeDetail;