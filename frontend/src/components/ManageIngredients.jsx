// src/components/ManageIngredients.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManageIngredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for add/edit form
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    } else if (user) {
      fetchIngredients();
    }
  }, [user, navigate]);

  const fetchIngredients = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/ingredients');
      setIngredients(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Submit button used for both create and update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formData = new FormData();
    formData.append('name', name);
    if (imageFile) formData.append('image', imageFile);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/ingredients/${editingId}`, formData, { headers });
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Updated successfully', showConfirmButton: false, timer: 1500 });
      } else {
        await axios.post('http://localhost:5000/api/ingredients', formData, { headers });
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Added successfully', showConfirmButton: false, timer: 1500 });
      }
      
      cancelEdit();
      fetchIngredients();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'An error occurred', 'error');
    }
  };

  const startEdit = (ing) => {
      setEditingId(ing._id);
      setName(ing.name);
      setImageFile(null);
      setPreview(ing.image ? `http://localhost:5000${ing.image}` : null);
      window.scrollTo(0, 0); // Scroll to top
  };

  const cancelEdit = () => {
      setEditingId(null);
      setName('');
      setImageFile(null);
      setPreview(null);
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: `Delete "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Delete now'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/ingredients/${id}`, { headers: { 'x-auth-token': token } });
          setIngredients(ingredients.filter(ing => ing._id !== id));
          Swal.fire('Deleted!', '', 'success');
        } catch (error) {
          Swal.fire('Error', 'Cannot delete', 'error');
        }
      }
    });
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '30px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', color: '#ff6b00', marginBottom: '30px' }}>🛒 Ingredient Inventory Management</h2>

      {/* Add/edit form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', marginBottom: '40px', background: '#f9f9f9', padding: '20px', borderRadius: '12px', flexWrap: 'wrap' }}>
        
        <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display:'block', marginBottom:'8px', fontWeight:'bold' }}>Ingredient Name</label>
            <input type="text" placeholder="E.g. Beef" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
        </div>

        <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display:'block', marginBottom:'8px', fontWeight:'bold' }}>Illustration Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'block', marginBottom: '10px' }} />
            {preview && <img src={preview} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignSelf: 'center', marginTop: '20px' }}>
            <button type="submit" style={{ padding: '12px 25px', background: editingId ? '#007bff' : '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editingId ? 'Update' : '+ Add New'}
            </button>
            {editingId && (
                <button type="button" onClick={cancelEdit} style={{ padding: '8px 25px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            )}
        </div>
      </form>

      {/* Current list */}
      <h4 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        Current inventory ({ingredients.length})
      </h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {ingredients.map(ing => (
          <div key={ing._id} style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ height: '120px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ing.image ? (
                    <img src={`http://localhost:5000${ing.image}`} alt={ing.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <span style={{ color: '#aaa', fontSize: '12px' }}>No image available</span>
                )}
            </div>
            <div style={{ padding: '15px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 15px', color: '#333' }}>{ing.name}</h4>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button onClick={() => startEdit(ing)} style={{ padding: '5px 15px', background: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#333' }}>Edit</button>
                    <button onClick={() => handleDelete(ing._id, ing.name)} style={{ padding: '5px 15px', background: '#ffeded', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#dc3545' }}>Delete</button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageIngredients;