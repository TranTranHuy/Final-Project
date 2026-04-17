// src/components/Header.jsx
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2'; 

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    setShowDropdown(false); 

    Swal.fire({
      title: 'Bạn muốn đăng xuất?',
      text: "Bạn sẽ cần đăng nhập lại để tiếp tục!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6b00', 
      cancelButtonColor: '#d33',
      confirmButtonText: 'Đăng xuất ngay',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        logout(); 
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        Toast.fire({
          icon: 'success',
          title: 'Đăng xuất thành công'
        });
      }
    });
  };

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        padding: '16px 40px',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Row 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ff6b00' }}>
              CookWeb 👩🏻‍🍳
            </h1>
          </Link>

          {/* Search Bar */}
          <div style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
            <input type="text" placeholder="Search recipes..." style={{ width: '100%', padding: '12px 20px 12px 48px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '9999px', outline: 'none' }} />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          </div>

          {/* Right Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            <Link to="/create-recipe" style={{ backgroundColor: '#ff6b00', color: 'white', padding: '10px 24px', borderRadius: '9999px', fontWeight: 'bold', textDecoration: 'none' }}>
              + Create new recipe
            </Link>

            {user ? (
              <div style={{ position: 'relative' }}>
                {/* User Toggle */}
                <div 
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ 
                    cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', border: '1px solid #ddd', borderRadius: '20px', userSelect: 'none',
                    backgroundColor: showDropdown ? '#f0f0f0' : 'transparent'
                  }}
                >
                  <span>👤 {user.username}</span> 
                  <span style={{ fontSize: '12px' }}>▼</span>
                </div>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div style={{
                    position: 'absolute', top: '120%', right: 0, width: '220px',
                    backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee', zIndex: 1100
                  }}>
                    <Link to="/profile" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#f9f9f9'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                      📂 Hồ sơ của tôi
                    </Link>
                    
                    <Link to="/manage-categories" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#f9f9f9'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                      🏷️ Quản lý danh mục
                    </Link>

                    <Link to="/manage-recipes" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#f9f9f9'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                      🍳 Quản lý công thức
                    </Link>

                    {/* CÁC CHỨC NĂNG DÀNH RIÊNG CHO ADMIN */}
                    {user?.role === 'admin' && (
                    <>
                      <Link 
                        to="/admin/moderation" 
                        onClick={() => setShowDropdown(false)}
                        style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#007bff', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}
                      >
                        🛡️ Duyệt bài đăng
                      </Link>
                      
                      {/* [MỚI] Link tới trang Kho nguyên liệu */}
                      <Link 
                        to="/admin/ingredients" 
                        onClick={() => setShowDropdown(false)}
                        style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#ff6b00', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}
                      >
                        🛒 Kho nguyên liệu gốc
                      </Link>
                    </>
                  )}

                    <div onClick={handleLogout} style={{ display: 'block', padding: '12px 16px', cursor: 'pointer', color: '#dc3545', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#fff5f5'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                      🚪 Đăng xuất
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" style={{ border: '1px solid #ddd', borderRadius: '9999px', padding: '8px 20px', color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                Login
              </Link>
            )}
          </div>
        </div>
        
        {/* Row 2: Navigation Links */}
        <nav style={{ marginTop: '16px', textAlign: 'center' }}>
          <ul style={{ display: 'inline-flex', listStyle: 'none', margin: 0, padding: 0, gap: '40px', fontSize: '15px', color: '#555', fontWeight: '500' }}>
            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.target.style.color='#ff6b00'} onMouseLeave={(e)=>e.target.style.color='#555'}>Premium</li>
            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.target.style.color='#ff6b00'} onMouseLeave={(e)=>e.target.style.color='#555'}>Challenges</li>
            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.target.style.color='#ff6b00'} onMouseLeave={(e)=>e.target.style.color='#555'}>Gifts</li>
            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.target.style.color='#ff6b00'} onMouseLeave={(e)=>e.target.style.color='#555'}>Recipe Vault</li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;