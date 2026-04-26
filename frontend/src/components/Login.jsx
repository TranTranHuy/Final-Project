// src/components/Login.jsx
import React, { useState, useContext } from 'react'; // Import useContext
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Import Context
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  // Get login function from Context
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      // Assume Backend returns: { token: "...", user: { username: "Huy", email: "..." } }
      // If your Backend doesn't return user yet, you need to fix backend file routes/auth.js
      // Temporarily for testing, we'll create user object from email if backend lacks it
      const userData = res.data.user || { username: email.split('@')[0], email: email }; 
      
      login(userData, res.data.token); // Call login function of Context
      
      setMessage('Login successful!');
      setTimeout(() => {
                navigate('/');
            }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    // ... (Keep your JSX interface as is)
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#ff6b00' }}>Login to CookWeb</h2>
      {message && <p style={{ textAlign: 'center', color: 'red' }}>{message}</p>}
      
      <form onSubmit={handleSubmit}>
         {/* ... Keep inputs as is ... */}
         <div style={{ marginBottom: '15px' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>Login</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px' }}>Don't have an account? <Link to="/register" style={{ color: '#ff6b00' }}>Register now</Link></p>
    </div>
  );
};

export default Login;