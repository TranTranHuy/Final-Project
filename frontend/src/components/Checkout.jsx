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
  
  // [NEW] State for payment method
  const [paymentMethod, setPaymentMethod] = useState('COD'); 

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
      
      // If credit card selected but no number entered, show warning
      if (paymentMethod === 'CreditCard') {
          const cardNumber = document.getElementById('cardNumber').value;
          if (!cardNumber || cardNumber.length < 10) {
              Swal.fire('Card error', 'Please enter a valid credit card number!', 'error');
              return;
          }
      }

      setSubmitting(true);

      // --- SIMULATED PAYMENT EFFECT (Create a real-feel delay) ---
      let timerInterval;
      Swal.fire({
          title: 'Processing transaction...',
          html: 'Connecting to secure payment gateway <b></b>...',
          timer: 2500, // Spin for 2.5 seconds
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

      // Wait 2.5 seconds then send API (Create real network delay)
      setTimeout(async () => {
          try {
              const token = localStorage.getItem('token');
              await axios.post('http://localhost:5000/api/orders', { 
                  shippingInfo, 
                  paymentMethod // Send this additional to DB
              }, {
                  headers: { 'x-auth-token': token }
              });

              Swal.fire({
                  title: 'Payment Successful! 🎉',
                  text: `You paid with ${paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod === 'MoMo' ? 'MoMo Wallet' : 'Credit Card'}. The seller will prepare your order soon.`,
                  icon: 'success',
                  confirmButtonColor: '#ff6b00'
              }).then(() => {
                  navigate('/my-orders'); // Navigate to Order History page
              });

          } catch (error) {
              Swal.fire('Transaction failed', error.response?.data?.message || 'The bank declined the transaction', 'error');
          } finally {
              setSubmitting(false);
          }
      }, 2500); // 2.5 giây setTimeout
  };

  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  if (loading) return <p style={{textAlign: 'center', marginTop: '50px'}}>Preparing your order...</p>;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* LEFT COLUMN: FORM FILL INFORMATION & SELECT PAYMENT */}
        <div style={{ flex: 1.5, minWidth: '350px' }}>
            <form onSubmit={handleCheckout}>
                
                {/* SHIPPING INFORMATION */}
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

                {/* [NEW] PAYMENT METHOD */}
                <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>💳 Payment Method</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Option 1: COD */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: paymentMethod === 'COD' ? '2px solid #ff6b00' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'COD' ? '#fff9f5' : '#fff' }}>
                            <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px' }} />
                            <div>
                                <strong style={{ fontSize: '16px', color: '#333' }}>Cash on Delivery (COD)</strong>
                                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>Pay cash to shipper upon delivery.</p>
                            </div>
                        </label>

                        {/* Option 2: MoMo */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: paymentMethod === 'MoMo' ? '2px solid #a50064' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'MoMo' ? '#fff0fa' : '#fff' }}>
                            <input type="radio" name="payment" value="MoMo" checked={paymentMethod === 'MoMo'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px' }} />
                            <div>
                                <strong style={{ fontSize: '16px', color: '#a50064' }}>MoMo e-wallet</strong>
                                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>Scan QR code via MoMo app.</p>
                            </div>
                        </label>

                        {/* Option 3: Credit Card */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: paymentMethod === 'CreditCard' ? '2px solid #007bff' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'CreditCard' ? '#f0f8ff' : '#fff' }}>
                            <input type="radio" name="payment" value="CreditCard" checked={paymentMethod === 'CreditCard'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px' }} />
                            <div>
                                <strong style={{ fontSize: '16px', color: '#007bff' }}>Credit/Debit Card (Visa, MasterCard)</strong>
                                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>Secure payment through secure gateway.</p>
                            </div>
                        </label>

                        {/* Simulated card entry form (Only shown when Credit Card is selected) */}
                        {paymentMethod === 'CreditCard' && (
                            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '10px' }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Card number (Simulation)</label>
                                    <input id="cardNumber" type="text" placeholder="4123 4567 8901 2345" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Expiration date</label>
                                        <input type="text" placeholder="MM/YY" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>CVV</label>
                                        <input type="password" placeholder="123" maxLength="3" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <button type="submit" disabled={submitting} style={{ width: '100%', marginTop: '20px', padding: '18px', background: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}>
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