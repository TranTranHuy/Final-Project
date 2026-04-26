// src/components/AdminModeration.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'; // [NEW] Import to navigate

const AdminModeration = () => {
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPending = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/recipes?status=pending');
      setPendingRecipes(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  // [NEW] Approve new ingredient function
  const handleAcceptIngredient = async (recipeId, ingredientName) => {
    try {
        const token = localStorage.getItem('token');
        
        // 1. Add ingredient to the shared database store
        await axios.post('http://localhost:5000/api/ingredients', 
            { name: ingredientName }, 
            { headers: { 'x-auth-token': token } }
        );

        // 2. Remove this ingredient from the recipe's alert list
        await axios.put(`http://localhost:5000/api/recipes/${recipeId}/remove-unknown-ingredient`, 
            { ingredientName }, 
            { headers: { 'x-auth-token': token } }
        );

        // 3. Update the UI immediately (no page reload required)
        setPendingRecipes(prevRecipes => 
            prevRecipes.map(recipe => {
                if (recipe._id === recipeId) {
                    return {
                        ...recipe,
                        unknownIngredients: recipe.unknownIngredients.filter(name => name !== ingredientName)
                    };
                }
                return recipe;
            })
        );

        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        Toast.fire({ icon: 'success', title: `Approved & added "${ingredientName}" to Store!` });

    } catch (error) {
        // If the ingredient already exists in the store because someone else added it, the backend returns 400
        const errMsg = error.response?.data?.message || 'Cannot add';
        Swal.fire('Notice', errMsg, 'warning');
    }
  };

  // Approve recipe
  const approveRecipe = async (id) => {
    try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/recipes/${id}/approve`, {}, {
            headers: { 'x-auth-token': token }
        });
        Swal.fire('Approved!', 'The recipe is now public.', 'success');
        setPendingRecipes(pendingRecipes.filter(r => r._id !== id));
    } catch (error) {
        console.error('Recipe approval error details:', error);
        
        // [FIXED] Capture the exact error returned from the backend
        const errorMsg = error.response?.data?.message || 'An error occurred while approving the recipe!';
        Swal.fire('Error', errorMsg, 'error');
    }
  };

  // Reject / delete recipe
  const rejectRecipe = (id) => {
      Swal.fire({
          title: 'Reject this recipe?',
          text: 'The post will be deleted from the system.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Delete now'
      }).then(async (result) => {
          if (result.isConfirmed) {
              try {
                  const token = localStorage.getItem('token');
                  await axios.delete(`http://localhost:5000/api/recipes/${id}`, { headers: { 'x-auth-token': token } });
                  setPendingRecipes(pendingRecipes.filter(r => r._id !== id));
                  Swal.fire('Deleted', 'The recipe has been rejected.', 'success');
              } catch (err) {
                  Swal.fire('Error', 'Cannot delete', 'error');
              }
          }
      });
  };

  if (loading) return <p style={{textAlign:'center', marginTop:'50px'}}>Loading pending recipes...</p>;

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#dc3545', marginBottom: '30px' }}>
          🛡️ Admin approves the post ({pendingRecipes.length})
      </h2>
      
      {pendingRecipes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>🎉 No articles need to be reviewed!</p>
      ) : (
          <div style={{ display: 'grid', gap: '30px' }}>
              {pendingRecipes.map(recipe => (
                  <div key={recipe._id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '22px' }}>{recipe.title}</h3>
                            {/* [NEW] Show publisher name instead of ID */}
                            <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '15px' }}>
                                👤 Posted by: <strong style={{ color: '#007bff' }}>{recipe.user?.username || 'Unknown'}</strong>
                            </p>
                            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '14px', color: '#888' }}>
                                📂 Category: {recipe.category || 'No category'}
                            </p>
                          </div>
                          {recipe.image && (
                              <img src={`http://localhost:5000${recipe.image}`} alt="Preview" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                          )}
                      </div>

                      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                      {/* UNKNOWN INGREDIENT ALERT AREA */}
                      {recipe.unknownIngredients && recipe.unknownIngredients.length > 0 ? (
                          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
                              <h4 style={{ margin: '0 0 10px 0', color: '#856404', display:'flex', alignItems:'center', gap:'8px' }}>
                                  ⚠️ There are new ingredients that need review
                              </h4>
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                  {recipe.unknownIngredients.map((name, idx) => (
                                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ffdf7e' }}>
                                          <span style={{ fontWeight: 'bold', color: '#333' }}>{name}</span>
                                          {/* Accept ingredient button */}
                                          <button 
                                            onClick={() => handleAcceptIngredient(recipe._id, name)}
                                            style={{ background: '#28a745', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(40,167,69,0.3)' }}
                                          >
                                            ✓ Accept
                                          </button>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      ) : (
                          <div style={{ background: '#d4edda', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                              <p style={{ color: '#155724', margin: 0, fontSize: '14px', fontWeight: 'bold' }}>✅ All ingredients are in the standard database.</p>
                          </div>
                      )}

                      {/* CONTROL AREA */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
                          {/* View Details button */}
                          <button 
                            onClick={() => navigate(`/recipe/${recipe._id}`)}
                            style={{ padding: '10px 20px', background: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            👁️ View details
                          </button>
                          
                          <button 
                            onClick={() => rejectRecipe(recipe._id)}
                            style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Decline
                          </button>
                          
                          <button 
                            onClick={() => approveRecipe(recipe._id)}
                            style={{ padding: '10px 25px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                          >
                            Approve Post
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default AdminModeration;