// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/admin/stats', {
                    headers: { 'x-auth-token': token }
                });
                setStats(res.data);
            } catch (err) {
                console.error("Error fetching stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <p style={{textAlign:'center', marginTop:'50px'}}>Loading dashboard...</p>;

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ color: '#333', marginBottom: '30px' }}>📊 System Overview Dashboard</h1>
            
            {/* STATS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={cardStyle('#4e73df')}>
                    <h3>Total Users</h3>
                    <h2>{stats.summary.totalUsers}</h2>
                </div>
                <div style={cardStyle('#1cc88a')}>
                    <h3>Total Recipes</h3>
                    <h2>{stats.summary.totalRecipes}</h2>
                </div>
                <div style={cardStyle('#36b9cc')}>
                    <h3>Ingredients Sold</h3>
                    <h2>{stats.summary.totalItemsSold}</h2>
                </div>
                <div style={cardStyle('#f6c23e')}>
                    <h3>Total Revenue</h3>
                    <h2>{stats.summary.totalRevenue.toLocaleString()} đ</h2>
                </div>
            </div>

            {/* BAR CHART AREA: Top Selling Ingredients */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '20px' }}>Top Selling Ingredients</h3>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '300px', gap: '40px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {stats.chartData.length === 0 ? (
                        <p style={{ color: '#888', alignSelf: 'center' }}>No ingredients sold yet.</p>
                    ) : (
                        stats.chartData.map((data, index) => (
                            <div key={index} style={{ flex: 1, maxWidth: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <div style={{ 
                                    width: '100%', 
                                    background: '#4e73df', 
                                    height: `${(data.count / (Math.max(...stats.chartData.map(d => d.count)) || 1)) * 250}px`,
                                    borderRadius: '5px 5px 0 0',
                                    position: 'relative',
                                    minHeight: '5px'
                                }}>
                                    <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', fontWeight: 'bold' }}>{data.count}</span>
                                </div>
                                {/* Ingredient Name label */}
                                <span style={{ 
                                    fontSize: '11px', 
                                    color: '#888', 
                                    transform: 'rotate(-45deg)', 
                                    marginTop: '25px',
                                    whiteSpace: 'nowrap',
                                    width: '70px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    textAlign: 'right'
                                }}>
                                    {data._id}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const cardStyle = (color) => ({
    background: color,
    color: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
});

export default AdminDashboard;