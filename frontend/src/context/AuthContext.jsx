// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // user sẽ chứa object { id, username, email, role... }
  const navigate = useNavigate();

  // Kiểm tra đăng nhập khi vừa vào trang (F5 không bị mất login)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Hàm đăng nhập (Lưu thông tin và cập nhật State)
  const login = (userData, token) => {
    localStorage.setItem('token', token);

    // [QUAN TRỌNG] Chuẩn hóa ID người dùng
    // Backend MongoDB trả về '_id', nhưng đôi khi frontend dùng 'id'
    // Ta tạo một object mới đảm bảo luôn có trường 'id' để dễ so sánh
    const userToSave = {
      ...userData, 
      id: userData.id || userData._id // Ưu tiên lấy id, nếu không có thì lấy _id
    };

    localStorage.setItem('user', JSON.stringify(userToSave));
    setUser(userToSave);
    
    navigate('/'); // Chuyển về trang chủ
  };

  // Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};