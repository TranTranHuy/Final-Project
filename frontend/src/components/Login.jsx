// src/components/Login.jsx
import React, { useState, useContext } from 'react'; // Import useContext
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Import Context

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  
  // Lấy hàm login từ Context
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      // Giả sử Backend trả về: { token: "...", user: { username: "Huy", email: "..." } }
      // Nếu Backend của bạn chưa trả về user, bạn cần sửa backend file routes/auth.js
      // Tạm thời để test, mình sẽ tự tạo object user từ email nếu backend thiếu
      const userData = res.data.user || { username: email.split('@')[0], email: email }; 
      
      login(userData, res.data.token); // Gọi hàm login của Context
      
      setMessage('Đăng nhập thành công!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    // ... (Giữ nguyên phần giao diện JSX của bạn)
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#ff6b00' }}>Đăng nhập vào CookWeb</h2>
      {message && <p style={{ textAlign: 'center', color: 'red' }}>{message}</p>}
      
      <form onSubmit={handleSubmit}>
         {/* ... Giữ nguyên các input ... */}
         <div style={{ marginBottom: '15px' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>Đăng nhập</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px' }}>Chưa có tài khoản? <Link to="/register" style={{ color: '#ff6b00' }}>Đăng ký ngay</Link></p>
    </div>
  );
};

export default Login;