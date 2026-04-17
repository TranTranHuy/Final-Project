// src/components/EditRecipe.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  const [oldImage, setOldImage] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  const [ingName, setIngName] = useState('');
  const [ingPrice, setIngPrice] = useState('');
  const [ingImageFile, setIngImageFile] = useState(null);
  const [addedIngredients, setAddedIngredients] = useState([]);

  // State Gợi ý
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await axios.get('http://localhost:5000/api/categories');
        setCategories(catRes.data);

        const recipeRes = await axios.get(`http://localhost:5000/api/recipes/${id}`);
        const recipe = recipeRes.data;

        setTitle(recipe.title);
        setIngredients(recipe.ingredients.join(', '));
        setInstructions(recipe.instructions);
        setSelectedCategory(recipe.category || '');
        setOldImage(recipe.image || '');
        setPreviewImage(recipe.image ? `http://localhost:5000${recipe.image}` : '');

        if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
            const formattedIngs = recipe.extendedIngredients.map(ing => ({
                id: ing._id || Date.now() + Math.random(),
                name: ing.name,
                price: ing.price,
                image: ing.image, 
                preview: ing.image ? `http://localhost:5000${ing.image}` : null,
                hasImage: false 
            }));
            setAddedIngredients(formattedIngs);
        }
      } catch (error) {
        Swal.fire('Lỗi', 'Không tìm thấy công thức.', 'error');
        navigate('/manage-recipes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Hàm Gợi ý tên
  const handleNameChange = async (e) => {
    const value = e.target.value;
    setIngName(value);
    if (value.length > 0) {
        try {
            const res = await axios.get(`http://localhost:5000/api/ingredients?query=${value}`);
            setSuggestions(res.data);
            setShowSuggestions(true);
        } catch (error) { console.error(error); }
    } else {
        setSuggestions([]);
        setShowSuggestions(false);
    }
  };

  const selectSuggestion = (name) => {
      setIngName(name);
      setSuggestions([]);
      setShowSuggestions(false);
  };

  const handleAddIngredient = () => {
    if (!ingName || !ingPrice) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập tên và giá', 'warning'); return;
    }
    const newIng = {
      id: Date.now(),
      name: ingName,
      price: ingPrice,
      file: ingImageFile,
      preview: ingImageFile ? URL.createObjectURL(ingImageFile) : null,
      hasImage: !!ingImageFile
    };
    setAddedIngredients([...addedIngredients, newIng]);
    const newText = ingredients ? `${ingredients}, ${ingName}` : ingName;
    setIngredients(newText);
    
    setIngName(''); setIngPrice(''); setIngImageFile(null); setSuggestions([]);
  };

  const removeIngredient = (idToRemove) => {
    setAddedIngredients(addedIngredients.filter(item => item.id !== idToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('ingredients', ingredients);
    formData.append('instructions', instructions);
    formData.append('category', selectedCategory);
    if (newImageFile) formData.append('image', newImageFile);

    const ingredientsData = addedIngredients.map(ing => ({
        name: ing.name,
        price: ing.price,
        image: ing.image, 
        hasImage: !!ing.file 
    }));
    formData.append('extendedIngredients', JSON.stringify(ingredientsData));

    addedIngredients.forEach(ing => {
        if (ing.file) formData.append('ingredientImages', ing.file);
    });

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/recipes/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token },
      });

      Swal.fire({
        title: 'Cập nhật thành công!', icon: 'success', confirmButtonColor: '#ff6b00', timer: 1500, showConfirmButton: false
      }).then(() => navigate('/manage-recipes'));

    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      // [ĐÃ SỬA] Bắt lỗi thật sự từ Backend
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.';
      Swal.fire('Thất bại', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ textAlign: 'center', color: '#ff6b00', marginBottom: '30px' }}>Sửa công thức</h1>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* CỘT TRÁI */}
        <div style={{ flex: 2, minWidth: '400px', background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label>Tiêu đề món ăn *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '10px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Nguyên liệu (Text) *</label>
              <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} required rows={3} style={{ width: '100%', padding: '10px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Hướng dẫn nấu *</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} required rows={6} style={{ width: '100%', padding: '10px' }} />
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                    <label>Danh mục</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: '10px' }}>
                        <option value="">-- Chọn --</option>
                        {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                    </select>
                </div>
            </div>
            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Ảnh minh họa hiện tại / Chọn ảnh mới</label>
                {previewImage && <img src={previewImage} alt="Preview" style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
                <input type="file" accept="image/*" onChange={handleMainImageChange} style={{ display: 'block' }}/>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Đang lưu...' : 'Cập nhật Công thức'}
            </button>
          </form>
        </div>

        {/* CỘT PHẢI */}
        <div style={{ flex: 1.2, minWidth: '350px', background: '#fff9f5', padding: '25px', borderRadius: '16px', border: '1px solid #ffdec2' }}>
          <h3 style={{ color: '#ff6b00', borderBottom: '2px solid #ffdec2', paddingBottom: '10px', marginBottom: '20px' }}>🛒 Sửa/Thêm nguyên liệu</h3>

          <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
                <input type="text" placeholder="Tên nguyên liệu" value={ingName} onChange={handleNameChange} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} onFocus={() => ingName && setShowSuggestions(true)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                {showSuggestions && suggestions.length > 0 && (
                    <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', listStyle: 'none', padding: 0, margin: 0, border: '1px solid #ddd', borderRadius: '0 0 6px 6px', zIndex: 100, boxShadow: '0 4px 10px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                        {suggestions.map((item) => (
                            <li key={item._id} onClick={() => selectSuggestion(item.name)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }} onMouseEnter={(e) => e.target.style.background = '#f9f9f9'} onMouseLeave={(e) => e.target.style.background = 'white'}>{item.name}</li>
                        ))}
                    </ul>
                )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input type="number" placeholder="Giá" value={ingPrice} onChange={(e) => setIngPrice(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
                <input type="file" accept="image/*" onChange={(e) => setIngImageFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                {ingImageFile && <div style={{marginTop: '5px'}}><img src={URL.createObjectURL(ingImageFile)} alt="preview" style={{width:'60px', height:'60px', objectFit:'cover', borderRadius:'4px'}}/></div>}
            </div>
            <button type="button" onClick={handleAddIngredient} style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Thêm</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
            {addedIngredients.map((item) => (
                <div key={item.id} style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'relative' }}>
                    <div style={{ height: '80px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.preview ? <img src={item.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#999', fontSize: '12px' }}>No Img</span>}
                    </div>
                    <div style={{ padding: '8px' }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '13px' }}>{item.name}</h4>
                        <p style={{ margin: '0', fontSize: '12px', color: '#ff6b00', fontWeight: 'bold' }}>{item.price ? parseInt(item.price).toLocaleString() : 0} đ</p>
                    </div>
                    <button onClick={() => removeIngredient(item.id)} style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', color: 'red', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
                </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default EditRecipe;