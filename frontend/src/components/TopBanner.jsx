// src/components/TopBanner.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TopBanner = () => {
    const [topRecipes, setTopRecipes] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTop = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/recipes/top');
                setTopRecipes(res.data);
            } catch (err) {
                console.error("Error fetching Top Banner", err);
            }
        };
        fetchTop();
    }, []);

    // Auto-change slide every 5 seconds
    useEffect(() => {
        if (topRecipes.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev === topRecipes.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [topRecipes.length]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === topRecipes.length - 1 ? 0 : prev + 1));
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? topRecipes.length - 1 : prev - 1));
    };

    if (topRecipes.length === 0) return null; // If no posts yet, don't show Banner

    const currentRecipe = topRecipes[currentIndex];
    // Get safe image link
    const imageUrl = currentRecipe.image 
        ? `http://localhost:5000${currentRecipe.image}` 
        : 'https://via.placeholder.com/1200x500?text=No+Image';

    return (
        <div style={{ position: 'relative', width: '100%', height: '500px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '40px' }}>
            
            {/* Background image */}
            <img 
                src={imageUrl} 
                alt={currentRecipe.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: 'opacity 0.5s ease' }} 
            />

            {/* Gradient overlay (Cinematic Dark Effect like movie) */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)' }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%', background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)' }}></div>

            {/* Banner content (Prominent text) */}
            <div style={{ position: 'absolute', top: '50%', left: '5%', transform: 'translateY(-50%)', maxWidth: '600px', color: '#fff', zIndex: 10 }}>
                <div style={{ display: 'inline-block', background: '#ff6b00', color: '#fff', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' }}>
                    🔥 TOP {currentIndex + 1} TRENDING
                </div>
                
                <h1 style={{ fontSize: '48px', margin: '0 0 15px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                    {currentRecipe.title}
                </h1>
                
                {/* Show category or some ingredients as short description */}
                <p style={{ fontSize: '16px', color: '#ccc', lineHeight: '1.6', marginBottom: '30px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {currentRecipe.category && <span style={{ color: '#fff', fontWeight: 'bold' }}>Category: {currentRecipe.category} <br/></span>}
                    Likes: {currentRecipe.likesCount || currentRecipe.likes?.length || 0} ❤️
                </p>

                <button 
                    onClick={() => navigate(`/recipe/${currentRecipe._id}`)}
                    style={{ background: '#ff6b00', color: '#fff', border: 'none', padding: '15px 35px', fontSize: '18px', fontWeight: 'bold', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(255,107,0,0.4)' }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                    ▶ View Details
                </button>
            </div>

            {/* Left / Right buttons */}
            <button onClick={handlePrev} style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', fontSize: '24px', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(5px)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.4)'} onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}>❮</button>
            <button onClick={handleNext} style={{ position: 'absolute', top: '50%', right: '20px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', fontSize: '24px', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(5px)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.4)'} onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}>❯</button>

            {/* Dot indicators for slide position */}
            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 }}>
                {topRecipes.map((_, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setCurrentIndex(idx)}
                        style={{ width: currentIndex === idx ? '30px' : '10px', height: '10px', borderRadius: '5px', background: currentIndex === idx ? '#ff6b00' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'width 0.3s ease, background 0.3s ease' }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default TopBanner;