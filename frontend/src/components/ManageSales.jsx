// src/components/ManageSales.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';

const ManageSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchSales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      
      const res = await axios.get('http://localhost:5000/api/orders/sales', { 
          headers: { 'x-auth-token': token } 
      });
      setSales(res.data);
    } catch (error) {
      console.error('Sales loading error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSales();
  }, [user, navigate]);

  const updateOrderStatus = async (orderId, newStatus) => {
      try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, 
              { status: newStatus }, 
              { headers: { 'x-auth-token': token } }
          );
          
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Status updated!', showConfirmButton: false, timer: 1500 });
          fetchSales(); 
      } catch (error) {
          Swal.fire('Error', error.response?.data?.message || 'Cannot update order status', 'error');
      }
  };

  if (loading && sales.length === 0) return <p style={{textAlign: 'center', marginTop: '50px'}}>Loading customer orders...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ color: '#007bff', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          🏪 Store Orders (To be processed)
      </h1>

      {sales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', background: '#f9f9f9', borderRadius: '12px' }}>
              <h3 style={{ color: '#666' }}>No one has purchased your ingredients yet.</h3>
          </div>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {sales.map(order => (
                  <div key={order._id} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '13px' }}>Order ID: <strong>{order._id}</strong></p>
                              <p style={{ margin: '0 0 5px 0', color: '#007bff', fontSize: '15px', fontWeight: 'bold' }}>👤 Buyer: {order.user?.username}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                              <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', 
                                  background: order.status === 'completed' ? '#d4edda' : order.status === 'shipping' ? '#cce5ff' : '#fff3cd',
                                  color: order.status === 'completed' ? '#155724' : order.status === 'shipping' ? '#004085' : '#856404'
                              }}>
                                  Status: {order.status.toUpperCase()}
                              </span>
                          </div>
                      </div>

                      <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                          {/* Filter to only show items that THIS user is selling in this order */}
                          {order.items.filter(item => item.sellerId === user._id).map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                  <span><span style={{color:'#ff6b00', fontWeight:'bold'}}>{item.quantity}x</span> {item.name}</span>
                                  <span style={{ color: '#555' }}>{(item.price * item.quantity).toLocaleString()} đ</span>
                              </div>
                          ))}
                      </div>

                      <div style={{ borderTop: '2px dashed #eee', paddingTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => updateOrderStatus(order._id, 'pending')} style={{ padding: '8px 15px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Bring back to Waiting</button>
                          <button onClick={() => updateOrderStatus(order._id, 'shipping')} style={{ padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🚚 Start delivery</button>
                          <button onClick={() => updateOrderStatus(order._id, 'completed')} style={{ padding: '8px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✅ Complete</button>
                      </div>

                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default ManageSales;