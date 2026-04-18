// src/components/MyOrders.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]); // [MỚI] State lưu đơn hàng sau khi lọc
  const [loading, setLoading] = useState(true);
  
  // Mặc định tab là 'buying'
  const [viewMode, setViewMode] = useState('buying'); 
  
  // [MỚI] State cho bộ lọc ở tab Tất cả
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      
      let url = 'http://localhost:5000/api/orders/my-orders'; // Mặc định: Đơn mua
      
      if (viewMode === 'selling') {
          url = 'http://localhost:5000/api/orders/sales'; // Đơn bán
      } else if (viewMode === 'all' && user?.role === 'admin') {
          url = 'http://localhost:5000/api/orders/all'; // Tất cả đơn (Chỉ admin)
      }

      const res = await axios.get(url, { headers: { 'x-auth-token': token } });
      setOrders(res.data);
    } catch (error) {
      console.error('Lỗi tải đơn hàng', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        // Mỗi khi đổi Tab, reset lại bộ lọc và gọi lại API
        setSearchTerm('');
        setFilterStatus('all');
        fetchOrders();
    }
  }, [user, navigate, viewMode]); 

  // [MỚI] Logic Lọc & Tìm kiếm ở phía Client
  useEffect(() => {
      let result = orders;
      
      // Chỉ áp dụng lọc nếu đang ở Tab 'Tất cả'
      if (viewMode === 'all') {
          if (filterStatus !== 'all') {
              result = result.filter(o => o.status === filterStatus);
          }
          if (searchTerm.trim() !== '') {
              const lowerSearch = searchTerm.toLowerCase();
              result = result.filter(o => 
                  o._id.toLowerCase().includes(lowerSearch) || 
                  (o.user?.username && o.user.username.toLowerCase().includes(lowerSearch))
              );
          }
      }
      setFilteredOrders(result);
  }, [orders, searchTerm, filterStatus, viewMode]);

  // Hàm cập nhật trạng thái
  const updateOrderStatus = async (orderId, newStatus) => {
      try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, 
              { status: newStatus }, 
              { headers: { 'x-auth-token': token } }
          );
          
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Đã cập nhật trạng thái!', showConfirmButton: false, timer: 1500 });
          fetchOrders(); 
      } catch (error) {
          Swal.fire('Lỗi', error.response?.data?.message || 'Không thể cập nhật trạng thái', 'error');
      }
  };

  const stages = ['pending', 'shipping', 'completed'];
  const stageLabels = ['Chờ xác nhận', 'Đang giao hàng', 'Đã giao hàng'];

  if (loading && orders.length === 0) return <p style={{textAlign: 'center', marginTop: '50px'}}>Đang tải dữ liệu...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ color: '#ff6b00', marginBottom: '20px' }}>
          📦 Quản lý Đơn hàng
      </h1>

      {/* TABS CHUYỂN ĐỔI (Dành cho mọi người, Admin có thêm Tab ALL) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px', flexWrap: 'wrap' }}>
          <button 
              onClick={() => setViewMode('buying')}
              style={{ padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', background: viewMode === 'buying' ? '#ff6b00' : '#f0f0f0', color: viewMode === 'buying' ? 'white' : '#666', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}
          >
              🛒 Đơn tôi mua
          </button>
          
          <button 
              onClick={() => setViewMode('selling')}
              style={{ padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', background: viewMode === 'selling' ? '#007bff' : '#f0f0f0', color: viewMode === 'selling' ? 'white' : '#666', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}
          >
              🏪 Đơn khách đặt (Cần xử lý)
          </button>

          {/* Tab hiển thị riêng cho Admin */}
          {user?.role === 'admin' && (
              <button 
                  onClick={() => setViewMode('all')}
                  style={{ padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', background: viewMode === 'all' ? '#28a745' : '#f0f0f0', color: viewMode === 'all' ? 'white' : '#666', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}
              >
                  🌐 Tất cả hệ thống (Admin)
              </button>
          )}
      </div>

      {/* THANH TÌM KIẾM VÀ LỌC (Chỉ hiện ở Tab "Tất cả hệ thống") */}
      {viewMode === 'all' && (
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', background: '#f8f9fa', padding: '15px', borderRadius: '10px', border: '1px solid #eee', flexWrap: 'wrap' }}>
              <input 
                  type="text" 
                  placeholder="🔍 Tìm mã đơn hàng hoặc tên khách hàng..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 2, minWidth: '250px', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }}
              />
              <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ flex: 1, minWidth: '150px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', cursor: 'pointer' }}
              >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="shipping">Đang giao hàng</option>
                  <option value="completed">Đã giao hàng</option>
              </select>
          </div>
      )}

      {/* DANH SÁCH ĐƠN HÀNG */}
      {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', background: '#f9f9f9', borderRadius: '12px' }}>
              <h3 style={{ color: '#666' }}>Không có đơn hàng nào khớp với mục này</h3>
              {viewMode === 'buying' && (
                  <button onClick={() => navigate('/marketplace')} style={{ marginTop: '15px', padding: '10px 25px', background: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Đi mua sắm</button>
              )}
          </div>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {filteredOrders.map(order => {
                  const currentStageIndex = stages.indexOf(order.status);
                  
                  return (
                      <div key={order._id} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                          
                          {/* THÔNG TIN HEADER */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                  <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '13px' }}>Mã đơn: <strong>{order._id}</strong></p>
                                  <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '13px' }}>Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                                  {(viewMode === 'selling' || viewMode === 'all') && order.user && (
                                      <p style={{ margin: 0, color: '#007bff', fontSize: '14px', fontWeight: 'bold' }}>👤 Khách hàng: {order.user.username}</p>
                                  )}
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                  <p style={{ margin: '0 0 5px 0', color: '#333' }}>Tổng tiền:</p>
                                  <h3 style={{ margin: 0, color: '#ff6b00' }}>{order.totalPrice.toLocaleString()} đ</h3>
                              </div>
                          </div>

                          {/* THANH TIẾN TRÌNH */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', position: 'relative' }}>
                              <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '4px', background: '#eee', zIndex: 0 }}></div>
                              <div style={{ position: 'absolute', top: '15px', left: '10%', height: '4px', background: '#ff6b00', zIndex: 1, width: `${(currentStageIndex / (stages.length - 1)) * 80}%`, transition: 'width 0.4s ease' }}></div>

                              {stages.map((stage, idx) => {
                                  const isActive = idx <= currentStageIndex;
                                  return (
                                      <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '33%' }}>
                                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? '#ff6b00' : '#eee', color: isActive ? '#fff' : '#999', fontWeight: 'bold', border: `3px solid ${isActive ? '#ff6b00' : '#ddd'}`, transition: 'all 0.3s' }}>
                                              {isActive ? '✓' : idx + 1}
                                          </div>
                                          <p style={{ margin: '10px 0 0 0', fontSize: '13px', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#ff6b00' : '#999', textAlign: 'center' }}>
                                              {stageLabels[idx]}
                                          </p>
                                      </div>
                                  );
                              })}
                          </div>

                          {/* CHI TIẾT SẢN PHẨM */}
                          <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                              {order.items.map((item, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx !== order.items.length - 1 ? '1px dashed #ddd' : 'none' }}>
                                      <span><span style={{color:'#ff6b00', fontWeight:'bold'}}>{item.quantity}x</span> {item.name} <span style={{fontSize: '12px', color: '#888'}}> (Bán bởi: {item.sellerName})</span></span>
                                      <span style={{ color: '#555' }}>{(item.price * item.quantity).toLocaleString()} đ</span>
                                  </div>
                              ))}
                          </div>

                          {/* NÚT QUẢN LÝ (HIỆN Ở TAB ĐƠN BÁN, HOẶC TAB TẤT CẢ CỦA ADMIN) */}
                          {(viewMode === 'selling' || viewMode === 'all') && (
                              <div style={{ borderTop: '2px dashed #eee', paddingTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                  <button onClick={() => updateOrderStatus(order._id, 'pending')} style={{ padding: '8px 15px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đưa về Chờ</button>
                                  <button onClick={() => updateOrderStatus(order._id, 'shipping')} style={{ padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🚚 Bắt đầu giao</button>
                                  <button onClick={() => updateOrderStatus(order._id, 'completed')} style={{ padding: '8px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✅ Hoàn thành</button>
                              </div>
                          )}

                      </div>
                  );
              })}
          </div>
      )}
    </div>
  );
};

export default MyOrders;