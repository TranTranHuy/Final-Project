// src/components/Checkout.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({
      fullName: user?.username || '',
      phone: '',
      address: ''
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        
        const res = await axios.get('http://localhost:5000/api/cart', { headers: { 'x-auth-token': token } });
        
        if (!res.data.items || res.data.items.length === 0) {
            Swal.fire('Empty cart', 'Please buy some ingredients first!', 'info');
            navigate('/marketplace');
        } else {
            setCartItems(res.data.items);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchCart();
  }, [user, navigate]);

  const handleInputChange = (e) => {
      setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e) => {
      e.preventDefault();
      setSubmitting(true);

      let timerInterval;
      Swal.fire({
          title: 'Processing order...',
          html: 'Finalizing your order <b></b>...',
          timer: 1500, 
          timerProgressBar: true,
          allowOutsideClick: false,
          didOpen: () => {
              Swal.showLoading();
              const b = Swal.getHtmlContainer().querySelector('b');
              timerInterval = setInterval(() => {
                  b.textContent = Swal.getTimerLeft();
              }, 100);
          },
          willClose: () => { clearInterval(timerInterval); }
      });

      setTimeout(async () => {
          try {
              const token = localStorage.getItem('token');
              // [MODIFIED] Removed paymentMethod payload
              await axios.post('http://localhost:5000/api/orders', { shippingInfo }, {
                  headers: { 'x-auth-token': token }
              });

              Swal.fire({
                  title: 'Order Placed Successfully! 🎉',
                  text: 'Your order has been sent to the seller. You will pay via Cash on Delivery (COD).',
                  icon: 'success',
                  confirmButtonColor: '#ff6b00'
              }).then(() => {
                  navigate('/my-orders'); 
              });

          } catch (error) {
              Swal.fire('Order failed', error.response?.data?.message || 'Something went wrong', 'error');
          } finally {
              setSubmitting(false);
          }
      }, 1500); 
  };

  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  if (loading) return <p style={{textAlign: 'center', marginTop: '50px'}}>Preparing your order...</p>;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* LEFT COLUMN: SHIPPING INFO */}
        <div style={{ flex: 1.5, minWidth: '350px' }}>
            <form onSubmit={handleCheckout}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>📍 Shipping Information</h2>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Recipient's full name</label>
                        <input type="text" name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone number</label>
                        <input type="tel" name="phone" value={shippingInfo.phone} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Detailed shipping address</label>
                        <textarea name="address" value={shippingInfo.address} onChange={handleInputChange} required rows="3" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}></textarea>
                    </div>
                </div>

                <button type="submit" disabled={submitting} style={{ width: '100%', padding: '18px', background: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'PROCESSING...' : `PLACE ORDER NOW (${totalPrice.toLocaleString()} đ)`}
                </button>
            </form>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div style={{ flex: 1, minWidth: '300px', background: '#fff9f5', padding: '25px', borderRadius: '12px', border: '1px solid #ffdec2', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#ff6b00' }}>Order Summary</h3>
            <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
                {cartItems.map(item => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px dashed #ddd', paddingBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 5px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{item.name}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Qty: {item.quantity}</p>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#555' }}>
                            {(item.price * item.quantity).toLocaleString()} đ
                        </div>
                    </div>
                ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#666', marginBottom: '10px' }}>
                <span>Shipping fee:</span>
                <span>0 đ</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', borderTop: '2px solid #ffdec2', paddingTop: '15px', marginTop: '10px' }}>
                <span>Total:</span>
                <span style={{ color: '#ff6b00' }}>{totalPrice.toLocaleString()} đ</span>
            </div>
        </div>
    </div>
  );
};

export default Checkout;