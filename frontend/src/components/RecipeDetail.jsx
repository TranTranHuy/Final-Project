// src/components/RecipeDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; 
import { AuthContext } from '../context/AuthContext';


const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Declare information to retrieve the logged-in user.
  const { user } = useContext(AuthContext);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New state for Like & Comment
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/recipes/${id}`);
        setRecipe(response.data);
        
        setLikes(response.data.likes || []); 
        setComments(response.data.comments || []); 
        
      } catch (err) {
        console.error('Error loading details:', err);
        setError('Recipe not found or connection error.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  // Function to handle adding ingredients to the cart
  const handleAddToCart = async (ing) => {
    const token = localStorage.getItem('token');
    
    // Check Login
    if (!token) {
        Swal.fire({
            title: 'Attention',
            text: 'You need to log in to buy ingredients!',
            icon: 'warning',
            confirmButtonColor: '#ff6b00',
            confirmButtonText: 'Log in now'
        }).then((result) => {
            if (result.isConfirmed) navigate('/login');
        });
        return;
    }

    try {
        // Send ingredient information, prices, and seller details to the shopping cart
        await axios.post('http://localhost:5000/api/cart/add', {
            name: ing.name,
            price: ing.price,
            image: ing.image,
            sellerId: recipe.user?._id || null, // Get the author's ID
            sellerName: recipe.user?.username || 'Anonymous',
            recipeId: recipe._id
        }, {
            headers: { 'x-auth-token': token }
        });

        // Toast-style success notification
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500
        });
        Toast.fire({
            icon: 'success',
            title: `Added ${ing.name} to cart!`
        });

    } catch (err) {
        console.error('Shopping cart add error:', err);
        Swal.fire('Error', 'Unable to add to cart. Please try again!', 'error');
    }
  };

  // Like Submission Function
  const handleLike = async () => {
      const token = localStorage.getItem('token');
      if (!token) return Swal.fire('Attention', 'You need to log in to like the recipe!', 'warning');
      try {
          const res = await axios.post(`http://localhost:5000/api/recipes/${recipe._id}/like`, {}, { headers: { 'x-auth-token': token } });
          setLikes(res.data); // Update the number of hearts.
      } catch (err) { console.error(err); }
  };

  // Comment Submission Function
  const handleComment = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      if (!token) return Swal.fire('Attention', 'You need to log in to comment!', 'warning');
      if (!commentText.trim()) return;

      try {
          const res = await axios.post(`http://localhost:5000/api/recipes/${recipe._id}/comment`, { text: commentText }, { headers: { 'x-auth-token': token } });
          setComments(res.data);
          setCommentText(''); 
      } catch (err) { console.error(err); }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '100px', fontSize: '18px' }}>Loading recipe details...</p>;
  if (error) return <p style={{ textAlign: 'center', marginTop: '100px', color: 'red', fontSize: '18px' }}>{error}</p>;
  if (!recipe) return <p style={{ textAlign: 'center', marginTop: '100px', fontSize: '18px' }}>The recipe doesn't exist.</p>;

  // Check if current user has liked this recipe (supporting both _id and id)
  const isLikedByMe = user && (likes?.includes(user._id) || likes?.includes(user.id));

  return (
    <div style={{ maxWidth: '900px', margin: '60px auto', padding: '30px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          background: '#f0f0f0',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#555'
        }}
      >
        ← Back
      </button>

      {/* Large image */}
      <div style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        {recipe.image ? (
            <img
            src={`http://localhost:5000${recipe.image}`}
            alt={recipe.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        ) : (
            <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                No photos available
            </div>
        )}
      </div>

      {/* Title */}
      <h1 style={{ textAlign: 'center', color: '#ff6b00', marginBottom: '10px', fontSize: '32px' }}>
        {recipe.title}
      </h1>
      
      <p style={{ textAlign: 'center', fontSize: '16px', color: '#666', marginTop: '10px', fontWeight: '500' }}>
        👤 Posted by: <span style={{ color: '#ff6b00', fontWeight: 'bold' }}>{recipe.author?.username || recipe.user?.username || 'CookWeb Chef'}</span>
      </p>

      {/* Category */}
      {recipe.category && (
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px', fontSize: '16px', background: '#f9f9f9', display: 'inline-block', padding: '5px 15px', borderRadius: '20px', position: 'relative', left: '50%', transform: 'translateX(-50%)' }}>
          📂 {recipe.category}
        </p>
      )}

      {/* Grid Layout: Split into 2 columns if the screen is wide enough. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
          
          {/* LEFT COLUMN: Cooking Instructions & Text List */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            {/* Ingredients */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#333', borderLeft: '4px solid #ff6b00', paddingLeft: '10px', marginBottom: '15px' }}>
                    📝 Ingredients needed
                </h3>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '16px', lineHeight: '1.8', color: '#444' }}>
                {recipe.ingredients.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
                </ul>
            </div>

            {/* Cooking instructions */}
            <div>
                <h3 style={{ color: '#333', borderLeft: '4px solid #ff6b00', paddingLeft: '10px', marginBottom: '15px' }}>
                    🍳 Instructions
                </h3>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.8', color: '#444', background: '#fcfcfc', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                {recipe.instructions}
                </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Ingredients Market (Extended Ingredients) */}
            {/* Display only if data is present */}
          {recipe.extendedIngredients && recipe.extendedIngredients.length > 0 && (
              <div style={{ flex: 0.8, minWidth: '280px' }}>
                  <div style={{ background: '#fff9f5', padding: '20px', borderRadius: '12px', border: '1px solid #ffdec2' }}>
                    <h3 style={{ color: '#d95a00', marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>
                        🛒 Buy ingredients now
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
                        {recipe.extendedIngredients.map((ing, index) => (
                            <div key={index} style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #eee', transition: 'transform 0.2s' }}>
                                {/* Ingredient Image */}
                                <div style={{ height: '100px', background: '#eee' }}>
                                    {ing.image ? (
                                        <img 
                                            src={`http://localhost:5000${ing.image}`} 
                                            alt={ing.name} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: '12px' }}>No Img</div>
                                    )}
                                </div>
                                
                                {/* Information */}
                                <div style={{ padding: '10px' }}>
                                    <p style={{ margin: '0 0 5px', fontWeight: '600', fontSize: '14px', color: '#333' }}>{ing.name}</p>
                                    <p style={{ margin: '0', color: '#ff6b00', fontWeight: 'bold', fontSize: '13px' }}>
                                        {ing.price ? parseInt(ing.price).toLocaleString() : 0} đ
                                    </p>
                                    
                                    {/* Attach the onClick event to the Shopping Cart button. */}
                                    <button 
                                        onClick={() => handleAddToCart(ing)}
                                        style={{ width: '100%', marginTop: '8px', padding: '5px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.target.style.background = '#ff6b00'}
                                        onMouseLeave={(e) => e.target.style.background = '#333'}
                                    >
                                        + Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
              </div>
          )}
      </div>

      {/* THE LIKE & COMMENT AREA IS LOCATED INSIDE THE MAIN DIV TAG */}
      <div style={{ marginTop: '40px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
          
          <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: isLikedByMe ? '#ffe0e0' : '#f5f5f5', color: isLikedByMe ? '#ff4d4f' : '#666', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.2s' }}>
              {isLikedByMe ? '❤️ Liked' : '🤍 Like'} ({likes?.length || 0})
          </button>

          <div style={{ marginTop: '30px' }}>
              <h3>Comments ({comments?.length || 0})</h3>
              
              <form onSubmit={handleComment} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <input 
                      type="text" 
                      value={commentText} 
                      onChange={(e) => setCommentText(e.target.value)} 
                      placeholder="Write your comment..." 
                      style={{ flex: 1, padding: '12px 20px', borderRadius: '30px', border: '1px solid #ccc', outline: 'none' }}
                  />
                  <button type="submit" style={{ padding: '0 25px', background: '#ff6b00', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {comments?.map((cmt, idx) => {
                      const avatarUrl = cmt.avatar || cmt.user?.avatar;

                      return (
                          <div key={idx} style={{ display: 'flex', gap: '15px', background: '#f9f9f9', padding: '15px', borderRadius: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', overflow: 'hidden' }}>
                                  {avatarUrl ? (
                                      <img src={`http://localhost:5000${avatarUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                      cmt.username?.charAt(0).toUpperCase()
                                  )}
                              </div>
                              <div>
                                  <b style={{ color: '#333' }}>{cmt.username}</b>
                                  <span style={{ fontSize: '12px', color: '#999', marginLeft: '10px' }}>{new Date(cmt.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                                  <p style={{ margin: '5px 0 0 0', color: '#555' }}>{cmt.text}</p>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};

export default RecipeDetail;