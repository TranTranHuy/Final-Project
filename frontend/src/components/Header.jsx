// src/components/Header.jsx
import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2'; 

const Header = ({ searchTerm, setSearchTerm }) => {
  const { user, logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setShowDropdown(false); 

    Swal.fire({
      title: 'Do you want to log out?',
      text: "You will need to log in again to continue!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6b00', 
      cancelButtonColor: '#d33',
      confirmButtonText: 'Log out now',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        logout(); 
        navigate('/'); 

        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        Toast.fire({
          icon: 'success',
          title: 'Logged out successfully'
        });
      }
    });
  };

  const handleProtectedNavigation = (path, featureName) => {
    if (!user) {
      Swal.fire({
        title: 'Login Required',
        text: `Please log in to access the ${featureName} feature.`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#ff6b00',
        confirmButtonText: 'Log in now',
        cancelButtonText: 'Later'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
    } else {
      navigate(path);
    }
  };

  const handleSearchChange = (e) => {
      const value = e.target.value;
      if (setSearchTerm) {
          setSearchTerm(value);
      }
      if (location.pathname !== '/') {
          navigate('/');
      }
  };

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        padding: '16px 20px', // Giảm padding 2 bên để thân thiện với mobile
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* [MODIFIED] Added className "header-row-1" for responsiveness */}
        <div className="header-row-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          
          {/* Brand Logo */}
          <div className="header-logo">
              <Link to="/" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ff6b00' }}>
                  CookWeb 👩🏻‍🍳
                </h1>
              </Link>
          </div>

          {/* Global Search Input */}
          <div className="header-search" style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
            <input 
                type="text" 
                placeholder="Search recipes..." 
                value={searchTerm || ''}
                onChange={handleSearchChange}
                style={{ width: '100%', padding: '12px 20px 12px 48px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '9999px', outline: 'none', boxSizing: 'border-box' }} 
            />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          </div>

          {/* Navigation and User Icons */}
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            <button 
              onClick={() => handleProtectedNavigation('/create-recipe', 'Create Recipe')}
              style={{ backgroundColor: '#ff6b00', color: 'white', padding: '10px 20px', borderRadius: '9999px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              <span className="hide-text-mobile">+ Create new</span><span style={{ display: 'none' }} className="show-on-mobile">+</span>
            </button>

             <Link to="/marketplace" style={{ backgroundColor: '#ff6b00', color: 'white', padding: '10px 20px', borderRadius: '9999px', fontWeight: 'bold', textDecoration: 'none' }}>
              Market
            </Link>

            <div 
                onClick={() => handleProtectedNavigation('/cart', 'Cart')}
                style={{ cursor: 'pointer', fontSize: '22px', position: 'relative' }}
                title="Shopping Cart"
            >
                🛒
            </div>

            <div 
                onClick={() => handleProtectedNavigation('/messages', 'Chat')}
                style={{ cursor: 'pointer', fontSize: '22px', position: 'relative' }}
                title="Messages"
            >
                💬
            </div>

            {user ? (
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ 
                    cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 12px', border: '1px solid #ddd', borderRadius: '20px', userSelect: 'none',
                    backgroundColor: showDropdown ? '#f0f0f0' : 'transparent'
                  }}
                >
                  {user.avatar ? (
                      <img src={`http://localhost:5000${user.avatar}?t=${new Date().getTime()}`} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ff6b00', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                          {user.username?.charAt(0).toUpperCase()}
                      </div>
                  )}
                  <span className="hide-text-mobile">{user.username}</span> 
                  <span style={{ fontSize: '12px' }}>▼</span>
                </div>

                {/* Dropdown Menu Items */}
                {showDropdown && (
                  <div style={{
                    position: 'absolute', top: '120%', right: 0, width: '220px',
                    backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee', zIndex: 1100
                  }}>
                    <Link to={`/user/${user?._id || user?.id}`} onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0' }}>📂 My Profile</Link>
                    <Link to="/favorites" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#ff4d4f', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>❤️ My Favorites</Link>
                    <Link to="/my-orders" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '10px 15px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>📦 My Orders</Link>
                    <Link to="/manage-sales" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '10px 15px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>🏪 Store Sales</Link>
                    <Link to="/manage-categories" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0' }}>🏷️ Manage Categories</Link>
                    <Link to="/manage-recipes" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0' }}>🍳 Manage Recipes</Link>

                    {user?.role === 'admin' && (
                    <>
                      <Link to="/admin/dashboard" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#28a745', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>📊 Admin Dashboard</Link>
                      <Link to="/admin/users" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#6f42c1', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>👥 Manage Users</Link>
                      <Link to="/admin/moderation" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#007bff', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>🛡️ Moderate Posts</Link>
                      <Link to="/admin/ingredients" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#ff6b00', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>🛒 Base Ingredients</Link>
                    </>
                  )}

                    <div onClick={handleLogout} style={{ display: 'block', padding: '12px 16px', cursor: 'pointer', color: '#dc3545', fontWeight: 'bold' }}>🚪 Logout</div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" style={{ border: '1px solid #ddd', borderRadius: '9999px', padding: '8px 20px', color: '#333', textDecoration: 'none', fontWeight: '500' }}>Login</Link>
            )}
          </div>
        </div>
        
        {/* Row 2: Secondary Navigation Links */}
       
      </div>
    </header>
  );
};

export default Header;