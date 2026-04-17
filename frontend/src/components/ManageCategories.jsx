// src/components/ManageCategories.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext'; // Import Context

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null); // ID danh mục đang sửa
  const { user } = useContext(AuthContext); // Lấy thông tin user

  // Tải danh mục
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/categories');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Thêm hoặc Cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      if (editingId) {
        // Update
        await axios.put(`http://localhost:5000/api/categories/${editingId}`, { name }, {
            headers: { 'x-auth-token': token }
        });
        Swal.fire('Thành công', 'Đã cập nhật danh mục', 'success');
      } else {
        // Create
        await axios.post('http://localhost:5000/api/categories', { name }, {
            headers: { 'x-auth-token': token }
        });
        Swal.fire('Thành công', 'Đã thêm danh mục mới', 'success');
      }
      
      setName('');
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      Swal.fire('Lỗi', error.response?.data?.message || 'Không có quyền thực hiện', 'error');
    }
  };

  
  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    Swal.fire({
        title: 'Bạn chắc chứ?',
        text: "Không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:5000/api/categories/${id}`, {
                    headers: { 'x-auth-token': token }
                });
                Swal.fire('Đã xóa!', 'Danh mục đã bị xóa.', 'success');
                fetchCategories();
            } catch (error) {
                Swal.fire('Lỗi', 'Bạn không có quyền xóa danh mục này', 'error');
            }
        }
    });
  };

  // Hàm chọn sửa
  const handleEdit = (cat) => {
    setName(cat.name);
    setEditingId(cat._id);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#ff6b00' }}>Quản lý Danh mục</h2>
      
      {/* Form nhập liệu */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Tên danh mục (VD: Món chay)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: editingId ? '#ffc107' : '#ff6b00', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          {editingId ? 'Cập nhật' : 'Thêm mới'}
        </button>
        {editingId && (
            <button type="button" onClick={() => { setName(''); setEditingId(null); }} style={{ padding: '10px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Hủy</button>
        )}
      </form>

      {/* Danh sách */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {categories.map((cat) => {
            // LOGIC HIỂN THỊ NÚT
            const currentUserId = user?.id || user?._id;
            const isOwner = cat.user === currentUserId;
            const isAdmin = user?.role === 'admin';
            const canEdit = isOwner || isAdmin;

            return (
                <li key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>{cat.name}</span>
                    
                    {/* Chỉ hiện nút nếu có quyền */}
                    {canEdit && (
                        <div>
                            <button onClick={() => handleEdit(cat)} style={{ marginRight: '10px', background: 'transparent', border: '1px solid #ffc107', color: '#ffc107', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Sửa</button>
                            <button onClick={() => handleDelete(cat._id)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
                        </div>
                    )}
                </li>
            );
        })}
      </ul>
    </div>
  );
};

export default ManageCategories;