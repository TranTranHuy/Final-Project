// src/components/ManageRecipes.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';

const ManageRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/recipes');
        
        // --- AUTHORIZATION LOGIC (FIXED) ---
        if (user && user.role === 'admin') {
          // Admin sees all
          setRecipes(response.data);
        } else if (user) {
          // [IMPORTANT] Grab the current user's normalized ID
          const currentUserId = user.id || user._id;

          // Filter recipes: only keep those created by the current user
          const myRecipes = response.data.filter(r => {
             // Skip entries without a creator (legacy data)
             if (!r.user) return false;

             // Handle case where r.user is an object (backend populated) or a string
             const recipeCreatorId = (typeof r.user === 'object') ? r.user._id : r.user;
             
             // Compare as strings to ensure accuracy
             return recipeCreatorId.toString() === currentUserId.toString();
          });
          
          setRecipes(myRecipes);
        }
      } catch (error) {
        console.error('Failed to load list:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchRecipes();
  }, [user]);

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure you want to delete?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete now'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Include token for backend authentication
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/recipes/${id}`, {
            headers: { 'x-auth-token': token }
          });
          
          setRecipes(recipes.filter(recipe => recipe._id !== id));
          Swal.fire('Deleted!', 'The recipe has been deleted.', 'success');
        } catch (error) {
          console.error("Error details:", error);
          
          // [FIXED] Get the exact error message from the backend
          const errorMsg = error.response?.data?.message || 'An error occurred while deleting!';
          Swal.fire('Failed', errorMsg, 'error');
        }
      }
    });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#ff6b00' }}>
        {user?.role === 'admin' ? 'Admin Recipe Management' : 'My Recipes'}
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : recipes.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>You have not posted any recipes yet.</p>
          <button 
            onClick={() => navigate('/create-recipe')}
            style={{ marginTop: '15px', padding: '10px 20px', background: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
          >
            + Create recipe now
          </button>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Title</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Category</th>
              {/* Creator column is visible only to admin */}
              {user?.role === 'admin' && (
                 <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Creator ID</th>
              )}
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((recipe) => (
              <tr key={recipe._id}>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{recipe.title}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{recipe.category || '-'}</td>
                
                {user?.role === 'admin' && (
                  <td style={{ border: '1px solid #ddd', padding: '12px', fontSize: '12px', color: '#666' }}>
                    {typeof recipe.user === 'object' ? recipe.user._id : recipe.user || 'Anonymous'}
                  </td>
                )}

                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                  <button 
                    onClick={() => navigate(`/edit-recipe/${recipe._id}`)} 
                    style={{ background: '#ffc107', border: 'none', padding: '6px 12px', marginRight: '8px', borderRadius: '4px', cursor: 'pointer', color: '#333', fontWeight: 'bold' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(recipe._id)} 
                    style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageRecipes;