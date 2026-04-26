// src/components/Favorites.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RecipeCard from './RecipeCard';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/recipes/favorites', {
                    headers: { 'x-auth-token': token }
                });
                setFavorites(res.data);
            } catch (error) {
                console.error("Error loading favorites list", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFavorites();
    }, []);

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading list...</p>;

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '30px', color: '#ff6b00' }}>
                ❤️ Your Favorite Recipes List
            </h2>
            
            {favorites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: '#f9f9f9', borderRadius: '12px' }}>
                    <div style={{ fontSize: '50px', marginBottom: '15px' }}>💔</div>
                    <h3 style={{ color: '#555', margin: 0 }}>No recipes yet</h3>
                    <p style={{ color: '#888' }}>Like recipes you enjoy to save them here!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {favorites.map(recipe => (
                        <RecipeCard key={recipe._id} recipe={recipe} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites;