// src/components/ManageCategories.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext'; // Import Context

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null); // ID of the category being edited
  const { user } = useContext(AuthContext); // Get user info

  // Load categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/categories');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Create or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      if (editingId) {
        // Update
        await axios.put(`http://localhost:5000/api/categories/${editingId}`, { name }, {
            headers: { 'x-auth-token': token }
        });
        Swal.fire('Success', 'Category updated', 'success');
      } else {
        // Create
        await axios.post('http://localhost:5000/api/categories', { name }, {
            headers: { 'x-auth-token': token }
        });
        Swal.fire('Success', 'New category added', 'success');
      }
      
      setName('');
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'No permission to perform this action', 'error');
    }
  };

  
  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    Swal.fire({
        title: 'Are you sure?',
        text: "This cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:5000/api/categories/${id}`, {
                    headers: { 'x-auth-token': token }
                });
                Swal.fire('Deleted!', 'The category has been deleted.', 'success');
                fetchCategories();
            } catch (error) {
                Swal.fire('Error', 'You do not have permission to delete this category', 'error');
            }
        }
    });
  };

  // Edit select function
  const handleEdit = (cat) => {
    setName(cat.name);
    setEditingId(cat._id);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#ff6b00' }}>Category Management</h2>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Category name (E.g: Vegetarian dishes)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: editingId ? '#ffc107' : '#ff6b00', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          {editingId ? 'Update' : 'Add new'}
        </button>
        {editingId && (
            <button type="button" onClick={() => { setName(''); setEditingId(null); }} style={{ padding: '10px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
        )}
      </form>

      {/* List */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {categories.map((cat) => {
            // DISPLAY BUTTON LOGIC
            const currentUserId = user?.id || user?._id;
            const isOwner = cat.user === currentUserId;
            const isAdmin = user?.role === 'admin';
            const canEdit = isOwner || isAdmin;

            return (
                <li key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>{cat.name}</span>
                    
                    {/* Only show buttons if authorized */}
                    {canEdit && (
                        <div>
                            <button onClick={() => handleEdit(cat)} style={{ marginRight: '10px', background: 'transparent', border: '1px solid #ffc107', color: '#ffc107', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => handleDelete(cat._id)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                        </div>
                    )}
                </li>
            );
        })}
      </ul>
    </div>
  );
};

export default ManageCategories;