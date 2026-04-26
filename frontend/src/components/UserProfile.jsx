// src/components/UserProfile.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import RecipeCard from './RecipeCard';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';

const UserProfile = () => {
    const { id } = useParams(); 
    const { user: currentUser, setUser } = useContext(AuthContext);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    //  This is where you attach the reference to hide the <input file> tag.
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/users/profile/${id}`);
                setProfileData(res.data);
            } catch (error) {
                console.error("Error fetching profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    // Handling when the user selects an image.
const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/users/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token }
            });

            // 1. Change the profile picture on the Profile interface.
            setProfileData({ ...profileData, user: res.data });
            
            // 2.Update AuthContext and LocalStorage for the Header.
            if (setUser) {
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data)); 
            }

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Profile picture has been changed.!', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire('Error', 'Could not upload image', 'error');
        }
    };

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading profile...</p>;
    if (!profileData) return <p style={{ textAlign: 'center', marginTop: '50px' }}>User does not exist.</p>;

    const { user, recipeCount, recipes } = profileData;
   const isMyProfile = currentUser && String(currentUser._id || currentUser.id) === String(user._id || user.id);

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
                
                {/* Avatar */}
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                    {user.avatar ? (
                        <img src={`http://localhost:5000${user.avatar}`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #ff9a44 0%, #fc6076 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255, 107, 0, 0.3)' }}>
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {/* UPLOAD Button */}
                    {isMyProfile && (
                        <>
                            <div 
                                onClick={() => fileInputRef.current.click()}
                                style={{ position: 'absolute', bottom: 0, right: 0, background: '#333', color: '#fff', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid #fff', transition: '0.2s', zIndex: 2 }}
                                title="Change profile picture"
                            >
                                📷
                            </div>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} />
                        </>
                    )}
                </div>

                <div>
                    <h1 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '32px' }}>{user.username}</h1>
                    <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '16px' }}>📧 {user.email}</p>
                    
                    <div style={{ display: 'inline-block', background: '#fff0e6', color: '#ff6b00', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>
                        🍳 Posted: {recipeCount} recipes
                    </div>
                </div>
            </div>

            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Recipes by {user.username}</h2>
            
            {recipes.length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '12px' }}>This user has not posted any recipes yet.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {recipes.map(recipe => (
                         <RecipeCard key={recipe._id} recipe={recipe} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserProfile;