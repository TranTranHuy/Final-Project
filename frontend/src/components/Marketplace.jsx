// src/components/Marketplace.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const Marketplace = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // [MỚI] State cho ô tìm kiếm
  const navigate = useNavigate();

  // [ĐÃ SỬA] Hàm lấy dữ liệu giờ nhận thêm từ khóa tìm kiếm
  const fetchMarketItems = async (searchQuery = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/marketplace?search=${searchQuery}`);
      setItems(res.data);
    } catch (error) {
      console.error('Lỗi tải sàn giao dịch', error);
    } finally {
      setLoading(false);
    }
  };

  // Chạy lần đầu khi vào trang
  useEffect(() => {
    fetchMarketItems();
  }, []);

  // [MỚI] Xử lý khi gõ tìm kiếm (có trễ 0.5s để đỡ gọi API liên tục)
  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          fetchMarketItems(searchTerm);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddToCart = async (item) => {
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire('Chú ý', 'Bạn cần đăng nhập để mua hàng!', 'warning');
        navigate('/login');
        return;
    }

    try {
        await axios.post('http://localhost:5000/api/cart/add', {
            name: item.name, price: item.price, image: item.image,
            sellerId: item.sellerId, sellerName: item.sellerName, recipeId: item.recipeId
        }, { headers: { 'x-auth-token': token } });

        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Đã thêm ${item.name} vào giỏ!`, showConfirmButton: false, timer: 1500 });
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể thêm vào giỏ hàng', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ textAlign: 'center', color: '#ff6b00', marginBottom: '10px' }}>🛒 Chợ Nguyên Liệu</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Mua bán nguyên liệu trực tiếp từ các đầu bếp gia đình</p>

      {/* [MỚI] THANH TÌM KIẾM */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <input 
              type="text" 
              placeholder="🔍 Tìm kiếm nguyên liệu bạn cần (VD: Thịt, Trứng...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', maxWidth: '500px', padding: '12px 20px', borderRadius: '30px', border: '1px solid #ccc', outline: 'none', fontSize: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
          />
      </div>

      {loading ? (
          <p style={{textAlign:'center', color: '#888'}}>Đang tìm kiếm...</p>
      ) : items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Không tìm thấy nguyên liệu nào phù hợp.</p>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {items.map((item, index) => (
                  <div key={index} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
                      <div style={{ height: '160px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.image ? <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#ccc' }}>No Image</span>}
                      </div>
                      <div style={{ padding: '15px' }}>
                          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>{item.name}</h3>
                          <p style={{ margin: '0 0 10px 0', color: '#ff6b00', fontWeight: 'bold', fontSize: '18px' }}>{item.price.toLocaleString()} đ</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                              <span>🧑‍🍳 {item.sellerName}</span>
                          </div>
                          <button onClick={() => handleAddToCart(item)} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Thêm vào giỏ</button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default Marketplace;