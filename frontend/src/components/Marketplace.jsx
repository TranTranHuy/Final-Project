// src/components/Marketplace.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const Marketplace = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // [NEW] State for search input
  const navigate = useNavigate();

  // [FIXED] Function to fetch data now accepts search keyword
  const fetchMarketItems = async (searchQuery = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/marketplace?search=${searchQuery}`);
      setItems(res.data);
    } catch (error) {
      console.error('Marketplace load error', error);
    } finally {
      setLoading(false);
    }
  };

  // Run on first page load
  useEffect(() => {
    fetchMarketItems();
  }, []);

  // [NEW] Handle search input (with 0.5s delay to avoid frequent API calls)
  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          fetchMarketItems(searchTerm);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddToCart = async (item) => {
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire('Notice', 'You need to log in to purchase!', 'warning');
        navigate('/login');
        return;
    }

    try {
        await axios.post('http://localhost:5000/api/cart/add', {
            name: item.name, price: item.price, image: item.image,
            sellerId: item.sellerId, sellerName: item.sellerName, recipeId: item.recipeId
        }, { headers: { 'x-auth-token': token } });

        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Added ${item.name} to cart!`, showConfirmButton: false, timer: 1500 });
    } catch (error) {
        Swal.fire('Error', 'Cannot add to cart', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ textAlign: 'center', color: '#ff6b00', marginBottom: '10px' }}>🛒 Ingredient Marketplace</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Buy and sell ingredients directly from home chefs</p>

      {/* [NEW] SEARCH BAR */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <input 
              type="text" 
              placeholder="🔍 Search for ingredients you need (E.g. Meat, Eggs...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', maxWidth: '500px', padding: '12px 20px', borderRadius: '30px', border: '1px solid #ccc', outline: 'none', fontSize: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
          />
      </div>

      {loading ? (
          <p style={{textAlign:'center', color: '#888'}}>Searching...</p>
      ) : items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No matching ingredients found.</p>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {items.map((item, index) => (
                  <div key={index} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
                      <div style={{ height: '160px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.image ? <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#ccc' }}>No Image</span>}
                      </div>
                      <div style={{ padding: '15px' }}>
                          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>{item.name}</h3>
                          <p style={{ margin: '0 0 10px 0', color: '#ff6b00', fontWeight: 'bold', fontSize: '18px' }}>{item.price.toLocaleString()} đ</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                              <span>🧑‍🍳 {item.sellerName}</span>
                          </div>
                          <button onClick={() => handleAddToCart(item)} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add to cart</button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default Marketplace;