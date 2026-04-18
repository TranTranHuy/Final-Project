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
  
  // [MỚI] State cho Phương thức thanh toán
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
            Swal.fire('Giỏ hàng trống', 'Hãy mua vài nguyên liệu trước nhé!', 'info');
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
      
      // Nếu chọn thẻ tín dụng mà ko nhập gì, hiện cảnh báo vui
      if (paymentMethod === 'CreditCard') {
          const cardNumber = document.getElementById('cardNumber').value;
          if (!cardNumber || cardNumber.length < 10) {
              Swal.fire('Lỗi thẻ', 'Vui lòng nhập số thẻ tín dụng hợp lệ!', 'error');
              return;
          }
      }

      setSubmitting(true);

      // --- HIỆU ỨNG GIẢ LẬP THANH TOÁN (Tạo cảm giác y như thật) ---
      let timerInterval;
      Swal.fire({
          title: 'Đang xử lý giao dịch...',
          html: 'Đang kết nối cổng thanh toán mã hóa an toàn <b></b>...',
          timer: 2500, // Quay trong 2.5 giây
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

      // Đợi 2.5 giây rồi mới gửi API (Tạo độ trễ như mạng thật)
      setTimeout(async () => {
          try {
              const token = localStorage.getItem('token');
              await axios.post('http://localhost:5000/api/orders', { 
                  shippingInfo, 
                  paymentMethod // Gửi thêm cái này xuống DB
              }, {
                  headers: { 'x-auth-token': token }
              });

              Swal.fire({
                  title: 'Thanh toán Thành công! 🎉',
                  text: `Bạn đã thanh toán qua ${paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : paymentMethod === 'MoMo' ? 'Ví điện tử MoMo' : 'Thẻ tín dụng'}. Người bán sẽ sớm chuẩn bị hàng.`,
                  icon: 'success',
                  confirmButtonColor: '#ff6b00'
              }).then(() => {
                  navigate('/my-orders'); // Chuyển về trang Lịch sử đơn hàng
              });

          } catch (error) {
              Swal.fire('Giao dịch thất bại', error.response?.data?.message || 'Ngân hàng từ chối giao dịch', 'error');
          } finally {
              setSubmitting(false);
          }
      }, 2500); // 2.5 giây setTimeout
  };

  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  if (loading) return <p style={{textAlign: 'center', marginTop: '50px'}}>Đang chuẩn bị đơn hàng...</p>;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN & CHỌN THANH TOÁN */}
        <div style={{ flex: 1.5, minWidth: '350px' }}>
            <form onSubmit={handleCheckout}>
                
                {/* THÔNG TIN NHẬN HÀNG */}
                <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>📍 Thông tin nhận hàng</h2>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Họ và tên người nhận</label>
                        <input type="text" name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Số điện thoại</label>
                        <input type="tel" name="phone" value={shippingInfo.phone} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Địa chỉ giao hàng chi tiết</label>
                        <textarea name="address" value={shippingInfo.address} onChange={handleInputChange} required rows="3" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}></textarea>
                    </div>
                </div>

                {/* [MỚI] PHƯƠNG THỨC THANH TOÁN */}
                <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>💳 Phương thức thanh toán</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Lựa chọn 1: COD */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: paymentMethod === 'COD' ? '2px solid #ff6b00' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'COD' ? '#fff9f5' : '#fff' }}>
                            <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px' }} />
                            <div>
                                <strong style={{ fontSize: '16px', color: '#333' }}>Thanh toán khi nhận hàng (COD)</strong>
                                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>Trả tiền mặt cho shipper khi nhận được hàng.</p>
                            </div>
                        </label>

                        {/* Lựa chọn 2: MoMo */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: paymentMethod === 'MoMo' ? '2px solid #a50064' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'MoMo' ? '#fff0fa' : '#fff' }}>
                            <input type="radio" name="payment" value="MoMo" checked={paymentMethod === 'MoMo'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px' }} />
                            <div>
                                <strong style={{ fontSize: '16px', color: '#a50064' }}>Ví điện tử MoMo</strong>
                                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>Quét mã QR qua ứng dụng MoMo.</p>
                            </div>
                        </label>

                        {/* Lựa chọn 3: Thẻ tín dụng */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: paymentMethod === 'CreditCard' ? '2px solid #007bff' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'CreditCard' ? '#f0f8ff' : '#fff' }}>
                            <input type="radio" name="payment" value="CreditCard" checked={paymentMethod === 'CreditCard'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px' }} />
                            <div>
                                <strong style={{ fontSize: '16px', color: '#007bff' }}>Thẻ Tín Dụng / Ghi Nợ (Visa, MasterCard)</strong>
                                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>Thanh toán an toàn qua cổng bảo mật.</p>
                            </div>
                        </label>

                        {/* Form giả lập nhập số thẻ (Chỉ hiện khi chọn Thẻ tín dụng) */}
                        {paymentMethod === 'CreditCard' && (
                            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '10px' }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Số thẻ (Mô phỏng)</label>
                                    <input id="cardNumber" type="text" placeholder="4123 4567 8901 2345" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Ngày hết hạn</label>
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
                    {submitting ? 'ĐANG XỬ LÝ...' : `ĐẶT HÀNG NGAY (${totalPrice.toLocaleString()} đ)`}
                </button>
            </form>
        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
        <div style={{ flex: 1, minWidth: '300px', background: '#fff9f5', padding: '25px', borderRadius: '12px', border: '1px solid #ffdec2', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#ff6b00' }}>Tóm tắt đơn hàng</h3>
            <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
                {cartItems.map(item => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px dashed #ddd', paddingBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 5px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{item.name}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>SL: {item.quantity}</p>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#555' }}>
                            {(item.price * item.quantity).toLocaleString()} đ
                        </div>
                    </div>
                ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#666', marginBottom: '10px' }}>
                <span>Phí vận chuyển:</span>
                <span>0 đ</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', borderTop: '2px solid #ffdec2', paddingTop: '15px', marginTop: '10px' }}>
                <span>Tổng cộng:</span>
                <span style={{ color: '#ff6b00' }}>{totalPrice.toLocaleString()} đ</span>
            </div>
        </div>
    </div>
  );
};

export default Checkout;