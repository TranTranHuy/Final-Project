// src/components/Cart.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Load cart
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
          navigate('/login');
          return;
      }
      const res = await axios.get('http://localhost:5000/api/cart', {
          headers: { 'x-auth-token': token }
      });
      setCartItems(res.data.items || []);
    } catch (error) {
      console.error('Cart load error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      if (user) fetchCart();
  }, [user]);

  // Increase/decrease quantity function
  const updateQuantity = async (itemId, action) => {
      try {
          const token = localStorage.getItem('token');
          const res = await axios.put('http://localhost:5000/api/cart/update', 
              { itemId, action }, 
              { headers: { 'x-auth-token': token } }
          );
          setCartItems(res.data.items);
      } catch (error) {
          Swal.fire('Error', 'Cannot update quantity', 'error');
      }
  };

  // [FIXED] Remove item function (added confirmation warning)
  const removeItem = (itemId, itemName) => {
      Swal.fire({
          title: 'Remove ingredient?',
          text: `Are you sure you want to remove "${itemName}" from your cart?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#999',
          confirmButtonText: 'Có, xóa đi',
          cancelButtonText: 'Keep it'
      }).then(async (result) => {
          if (result.isConfirmed) {
              try {
                  const token = localStorage.getItem('token');
                  const res = await axios.delete(`http://localhost:5000/api/cart/remove/${itemId}`, {
                      headers: { 'x-auth-token': token }
                  });
                  setCartItems(res.data.items);
                  
                  const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                  Toast.fire({ icon: 'success', title: 'Removed from cart' });
              } catch (error) {
                  Swal.fire('Error', 'Cannot delete', 'error');
              }
          }
      });
  };

  // Calculate the total amount
  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  if (loading) return <p style={{textAlign: 'center', marginTop:'50px'}}>Loading cart...</p>;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ color: '#ff6b00', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '30px' }}>
          🛒 Your Shopping Cart
      </h1>

      {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', background: '#f9f9f9', borderRadius: '12px' }}>
              <h3 style={{ color: '#666' }}>Your cart is empty</h3>
              <p style={{ color: '#999', marginBottom: '20px' }}>You haven't selected any ingredients yet.</p>
              <button onClick={() => navigate('/marketplace')} style={{ padding: '10px 25px', background: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Go to marketplace
              </button>
          </div>
      ) : (
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              
              {/* PRODUCT LIST */}
              <div style={{ flex: 2, minWidth: '350px' }}>
                  {cartItems.map((item) => (
                      <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '15px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                          
                          {/* Photo */}
                          <div style={{ width: '80px', height: '80px', background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden' }}>
                              {item.image ? <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                          </div>

                          {/* Information */}
                          <div style={{ flex: 1 }}>
                              <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#333' }}>{item.name}</h4>
                              <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>For sale by: <strong>{item.sellerName}</strong></p>
                              <p style={{ margin: 0, color: '#ff6b00', fontWeight: 'bold' }}>{item.price.toLocaleString()} đ</p>
                          </div>

                          {/* Increase/Decrease Quantity */}
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
                              
                              <button 
                                onClick={() => item.quantity > 1 && updateQuantity(item._id, 'decrease')} 
                                disabled={item.quantity <= 1}
                                style={{ 
                                    width: '30px', height: '30px', border: 'none', fontWeight: 'bold',
                                    background: item.quantity <= 1 ? '#f1f1f1' : '#f9f9f9', 
                                    color: item.quantity <= 1 ? '#ccc' : '#333',
                                    cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer' 
                                }}
                              >
                                -
                              </button>
                              
                              <div style={{ width: '40px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                                {item.quantity}
                              </div>
                              
                              <button 
                                onClick={() => updateQuantity(item._id, 'increase')} 
                                style={{ width: '30px', height: '30px', border: 'none', background: '#f9f9f9', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}
                              >
                                +
                              </button>
                          </div>

                          {/* Delete button */}
                        
                          <button onClick={() => removeItem(item._id, item.name)} style={{ background: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '18px' }} title="Delete item">
                              🗑️
                          </button>
                      </div>
                  ))}
              </div>

              {/* ORDER SUMMARY */}
              <div style={{ flex: 1, minWidth: '300px', background: '#fff9f5', padding: '25px', borderRadius: '12px', border: '1px solid #ffdec2', position: 'sticky', top: '100px' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Order Summary</h3>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '15px', color: '#555' }}>
                      <span>Subtotal ({cartItems.length} items):</span>
                      <span>{totalPrice.toLocaleString()} đ</span>
                  </div>
                  
                  <hr style={{ border: 'none', borderTop: '1px solid #ffdec2', margin: '15px 0' }}/>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '18px', fontWeight: 'bold' }}>
                      <span>Total:</span>
                      <span style={{ color: '#ff6b00' }}>{totalPrice.toLocaleString()} đ</span>
                  </div>

                  <button 
                    onClick={() => navigate('/checkout')} 
                    style={{ width: '100%', padding: '15px', background: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Proceed to Checkout
                </button>
              </div>

          </div>
      )}
    </div>
  );
};

export default Cart;