// src/components/RecipeCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecipeCard = ({ recipe }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/recipe/${recipe._id}`);
  };

  return (
    <div
      className="recipe-card"
      onClick={handleClick}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', overflow: 'hidden', height: '180px' }}>
        <img
          src={recipe.image ? `http://localhost:5000${recipe.image}` : 'https://via.placeholder.com/300x180?text=No+Image'}
          alt={recipe.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '16px', flex: 1 }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 8px',
          color: '#222',
          lineHeight: '1.4',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {recipe.title}
        </h3>

        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 5px 0' }}>
          📁 {recipe.category || 'Dish'}
        </p>
        
        {/* [MODIFIED] Show author name */}
        <p style={{ fontSize: '13px', color: '#888', margin: 0, fontWeight: '500' }}>
          👤 By: {recipe.author?.username || recipe.user?.username || 'CookWeb Chef'}
        </p>
      </div>
    </div>
  );
};

export default RecipeCard;