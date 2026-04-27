// src/components/ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { 'x-auth-token': token }
            });
            setUsers(res.data);
        } catch (error) {
            console.error("Error fetching users", error);
            Swal.fire('Error', 'Could not load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Function to toggle user role
    const handleRoleChange = async (userId, currentRole) => {
        const actionText = currentRole === 'admin' ? 'remove Admin rights from' : 'grant Admin rights to';
        
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to ${actionText} this user?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, change it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token');
                    await axios.put(`http://localhost:5000/api/admin/users/${userId}/role`, {}, {
                        headers: { 'x-auth-token': token }
                    });
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Role updated!', showConfirmButton: false, timer: 1500 });
                    fetchUsers(); // Reload list
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'Could not update role', 'error');
                }
            }
        });
    };

    // Function to delete user
    const handleDeleteUser = async (userId) => {
        Swal.fire({
            title: 'Delete this user?',
            text: "You won't be able to revert this! All their recipes might be affected.",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete user!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token');
                    await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
                        headers: { 'x-auth-token': token }
                    });
                    Swal.fire('Deleted!', 'User has been deleted.', 'success');
                    fetchUsers(); // Reload list
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'Could not delete user', 'error');
                }
            }
        });
    };

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading users...</p>;

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                👥 Manage Users
            </h1>

            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '15px' }}>Avatar</th>
                            <th style={{ padding: '15px' }}>Username</th>
                            <th style={{ padding: '15px' }}>Email</th>
                            <th style={{ padding: '15px' }}>Role</th>
                            <th style={{ padding: '15px' }}>Joined Date</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px' }}>
                                    {u.avatar ? (
                                        <img src={`http://localhost:5000${u.avatar}`} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ccc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '15px', fontWeight: 'bold', color: '#333' }}>{u.username}</td>
                                <td style={{ padding: '15px', color: '#666' }}>{u.email}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{ 
                                        padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                                        background: u.role === 'admin' ? '#cce5ff' : '#e2e3e5',
                                        color: u.role === 'admin' ? '#004085' : '#383d41'
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '15px', color: '#888', fontSize: '14px' }}>
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button 
                                        onClick={() => handleRoleChange(u._id, u.role)}
                                        style={{ padding: '8px 12px', background: u.role === 'admin' ? '#ffc107' : '#17a2b8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                    >
                                        {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(u._id)}
                                        style={{ padding: '8px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageUsers;