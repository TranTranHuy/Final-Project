// src/components/MyOrders.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        
        // [MODIFIED] Only fetch purchases. Removed Tabs logic.
        const res = await axios.get('http://localhost:5000/api/orders/my-orders', { 
            headers: { 'x-auth-token': token } 
        });
        setOrders(res.data);
      } catch (error) {
        console.error('Order loading error', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchOrders();
  }, [user, navigate]); 

  const stages = ['pending', 'shipping', 'completed'];
  const stageLabels = ['Awaiting confirmation', 'Shipping', 'Completed'];

  if (loading && orders.length === 0) return <p style={{textAlign: 'center', marginTop: '50px'}}>Loading your orders...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ color: '#ff6b00', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          🛒 My Purchase History
      </h1>

      {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', background: '#f9f9f9', borderRadius: '12px' }}>
              <h3 style={{ color: '#666' }}>You haven't bought anything yet.</h3>
              <button onClick={() => navigate('/marketplace')} style={{ marginTop: '15px', padding: '10px 25px', background: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Go to Marketplace</button>
          </div>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {orders.map(order => {
                  const currentStageIndex = stages.indexOf(order.status);
                  
                  return (
                      <div key={order._id} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                  <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '13px' }}>Order ID: <strong>{order._id}</strong></p>
                                  <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '13px' }}>Order Date: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                  <p style={{ margin: '0 0 5px 0', color: '#333' }}>Total amount:</p>
                                  <h3 style={{ margin: 0, color: '#ff6b00' }}>{order.totalPrice.toLocaleString()} đ</h3>
                              </div>
                          </div>

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

                          <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                              {order.items.map((item, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx !== order.items.length - 1 ? '1px dashed #ddd' : 'none' }}>
                                      <span><span style={{color:'#ff6b00', fontWeight:'bold'}}>{item.quantity}x</span> {item.name} <span style={{fontSize: '12px', color: '#888'}}> (Seller: {item.sellerName})</span></span>
                                      <span style={{ color: '#555' }}>{(item.price * item.quantity).toLocaleString()} đ</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  );
              })}
          </div>
      )}
    </div>
  );
};

export default MyOrders;