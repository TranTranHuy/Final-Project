// src/components/Header.jsx
import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2'; 

const Header = ({ searchTerm, setSearchTerm }) => {
  // Get user info and logout function from AuthContext
  const { user, logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Function to handle logout with confirmation
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

  /**
   * [NEW LOGIC] Function to check authentication before navigating
   * If user is not logged in, show a warning alert.
   * If logged in, proceed to the target path.
   */
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

  // Sync search bar input with the Global Search state
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
        padding: '16px 40px',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Row 1: Logo, Search and Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          
          {/* Brand Logo */}
          <Link to="/" style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ff6b00' }}>
              CookWeb 👩🏻‍🍳
            </h1>
          </Link>

          {/* Global Search Input */}
          <div style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
            <input 
                type="text" 
                placeholder="Search recipes..." 
                value={searchTerm || ''}
                onChange={handleSearchChange}
                style={{ width: '100%', padding: '12px 20px 12px 48px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '9999px', outline: 'none' }} 
            />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          </div>

          {/* Navigation and User Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Create Recipe Button (Also Protected) */}
            <button 
              onClick={() => handleProtectedNavigation('/create-recipe', 'Create Recipe')}
              style={{ backgroundColor: '#ff6b00', color: 'white', padding: '10px 24px', borderRadius: '9999px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              + Create new recipe
            </button>

             <Link to="/marketplace" style={{ backgroundColor: '#ff6b00', color: 'white', padding: '10px 24px', borderRadius: '9999px', fontWeight: 'bold', textDecoration: 'none' }}>
              Marketplace
            </Link>

            {/* Cart Icon (Protected) */}
            <div 
                onClick={() => handleProtectedNavigation('/cart', 'Cart')}
                style={{ cursor: 'pointer', fontSize: '22px', marginRight: '15px', position: 'relative' }}
                title="Shopping Cart"
            >
                🛒
            </div>

            {/* Chat/Message Icon (Protected) */}
            <div 
                onClick={() => handleProtectedNavigation('/messages', 'Chat')}
                style={{ cursor: 'pointer', fontSize: '22px', position: 'relative' }}
                title="Messages"
            >
                💬
            </div>

            {user ? (
              <div style={{ position: 'relative' }}>
                {/* User Dropdown Toggle */}
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
                  <span>{user.username}</span> 
                  <span style={{ fontSize: '12px' }}>▼</span>
                </div>

                {/* Dropdown Menu Items */}
                {showDropdown && (
                  <div style={{
                    position: 'absolute', top: '120%', right: 0, width: '220px',
                    backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee', zIndex: 1100
                  }}>
                    <Link 
                        to={`/user/${user?._id || user?.id}`} 
                        onClick={() => setShowDropdown(false)} 
                        style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }} 
                        onMouseEnter={(e) => e.target.style.background = '#f9f9f9'} 
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                    >
                        📂 My Profile
                    </Link>
                    <Link to="/favorites" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#ff4d4f', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }} onMouseEnter={(e) => e.target.style.background = '#f9f9f9'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                        ❤️ My Favorites
                    </Link>

                    <Link to="/my-orders" style={{ display: 'block', padding: '10px 15px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }} onClick={() => setShowDropdown(false)}>
                      📦 My Orders
                    </Link>
                    
                    <Link to="/manage-categories" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#f9f9f9'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                      🏷️ Manage Categories
                    </Link>

                    <Link to="/manage-recipes" onClick={() => setShowDropdown(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#f9f9f9'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                      🍳 Manage Recipes
                    </Link>

                    {user?.role === 'admin' && (
                    <>
                      <Link 
                        to="/admin/moderation" 
                        onClick={() => setShowDropdown(false)}
                        style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#007bff', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}
                      >
                        🛡️ Moderate Posts
                      </Link>
                      
                      <Link 
                        to="/admin/ingredients" 
                        onClick={() => setShowDropdown(false)}
                        style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#ff6b00', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}
                      >
                        🛒 Base Ingredients Inventory
                      </Link>
                    </>
                  )}

                    <div onClick={handleLogout} style={{ display: 'block', padding: '12px 16px', cursor: 'pointer', color: '#dc3545', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#fff5f5'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                      🚪 Logout
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
      </div>
    </header>
  );
};

export default Header;