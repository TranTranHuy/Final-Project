// src/components/CreateRecipe.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const CreateRecipe = () => {
  // State cho món ăn chính
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState(''); 
  const [instructions, setInstructions] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State cho phần thêm nguyên liệu chi tiết (Cột phải)
  const [ingName, setIngName] = useState('');
  const [ingPrice, setIngPrice] = useState('');
  const [ingImageFile, setIngImageFile] = useState(null);
  const [addedIngredients, setAddedIngredients] = useState([]); 

  // State cho Gợi ý (Suggestions)
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Lỗi tải danh mục:', error);
      }
    };
    fetchCategories();
  }, []);

  // Hàm xử lý khi nhập tên nguyên liệu -> Gọi API tìm kiếm
  const handleNameChange = async (e) => {
    const value = e.target.value;
    setIngName(value);

    if (value.length > 0) {
        try {
            const res = await axios.get(`http://localhost:5000/api/ingredients?query=${value}`);
            setSuggestions(res.data);
            setShowSuggestions(true);
        } catch (error) {
            console.error(error);
        }
    } else {
        setSuggestions([]);
        setShowSuggestions(false);
    }
  };

  // Khi chọn 1 gợi ý
  const selectSuggestion = (name) => {
      setIngName(name);
      setSuggestions([]);
      setShowSuggestions(false);
  };

  // Hàm thêm nguyên liệu vào danh sách tạm
  const handleAddIngredient = () => {
    if (!ingName || !ingPrice) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập tên và giá nguyên liệu', 'warning');
      return;
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
    
    // Tự động thêm tên vào textarea bên trái để đồng bộ
    const newText = ingredients ? `${ingredients}, ${ingName}` : ingName;
    setIngredients(newText);

    // Reset form nhỏ
    setIngName('');
    setIngPrice('');
    setIngImageFile(null);
    setSuggestions([]);
  };

  const removeIngredient = (id) => {
    setAddedIngredients(addedIngredients.filter(item => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('ingredients', ingredients);
    formData.append('instructions', instructions);
    formData.append('category', selectedCategory);
    if (imageFile) formData.append('image', imageFile);

    // Gửi danh sách nguyên liệu chi tiết
    const ingredientsData = addedIngredients.map(ing => ({
        name: ing.name,
        price: ing.price,
        hasImage: ing.hasImage
    }));
    formData.append('extendedIngredients', JSON.stringify(ingredientsData));

    // Gửi file ảnh nguyên liệu
    addedIngredients.forEach(ing => {
        if (ing.file) {
            formData.append('ingredientImages', ing.file);
        }
    });

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/recipes', formData, {
        headers: { 
            'Content-Type': 'multipart/form-data',
            'x-auth-token': token
        },
      });

      // Thành công
      Swal.fire({
        title: 'Đã gửi bài!',
        text: 'Bài viết đang chờ Admin phê duyệt. Cảm ơn bạn!',
        icon: 'info',
        confirmButtonColor: '#ff6b00'
      }).then(() => navigate('/'));

    } catch (error) {
      console.error('Lỗi chi tiết:', error);
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra không xác định!';
      
      Swal.fire({ 
        icon: 'error', 
        title: 'Thất bại', 
        text: errorMsg 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ textAlign: 'center', color: '#ff6b00', marginBottom: '40px' }}>Tạo công thức mới</h1>
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* CỘT TRÁI */}
        <div style={{ flex: 2, minWidth: '400px', background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
             <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label>Tiêu đề *</label>
                  <input type="text" value={title} onChange={e=>setTitle(e.target.value)} required style={{width:'100%', padding:'10px'}}/>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label>Nguyên liệu (Text) *</label>
                  <textarea value={ingredients} onChange={e=>setIngredients(e.target.value)} required rows={3} style={{width:'100%', padding:'10px'}}/>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label>Hướng dẫn *</label>
                  <textarea value={instructions} onChange={e=>setInstructions(e.target.value)} required rows={6} style={{width:'100%', padding:'10px'}}/>
                </div>
                
                <div style={{ display:'flex', gap:'20px', marginBottom:'20px' }}>
                    <div style={{flex:1}}>
                      <label>Danh mục</label>
                      <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} style={{width:'100%', padding:'10px'}}>
                        <option value="">Chọn</option>
                        {categories.map(c=><option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>

                    <div style={{flex:1}}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Ảnh chính</label>
                      <input type="file" accept="image/*" onChange={e=>setImageFile(e.target.files[0])}/>
                      {/* [ĐÃ THÊM] Preview ảnh chính */}
                      {imageFile && (
                        <div style={{ marginTop: '10px' }}>
                            <img 
                              src={URL.createObjectURL(imageFile)} 
                              alt="preview main" 
                              style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} 
                            />
                        </div>
                      )}
                    </div>
                </div>

                <button type="submit" disabled={loading} style={{width:'100%', padding:'15px', background:'#ff6b00', color:'white', border:'none', fontWeight:'bold', cursor:'pointer', borderRadius: '8px'}}>
                  {loading ? 'Đang gửi...' : 'Đăng bài'}
                </button>
            </form>
        </div>

        {/* CỘT PHẢI */}
        <div style={{ flex: 1.2, minWidth: '350px', background: '#fff9f5', padding: '25px', borderRadius: '16px', border: '1px solid #ffdec2' }}>
          <h3 style={{ color: '#ff6b00', borderBottom: '2px solid #ffdec2', paddingBottom: '10px' }}>🛒 Thêm nguyên liệu</h3>

          <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            
            {/* INPUT TÊN VỚI GỢI Ý */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Nhập tên (VD: Chữ C...)" 
                    value={ingName} 
                    onChange={handleNameChange}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                    onFocus={() => ingName && setShowSuggestions(true)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} 
                />
                
                {/* DANH SÁCH GỢI Ý */}
                {showSuggestions && suggestions.length > 0 && (
                    <ul style={{ 
                        position: 'absolute', top: '100%', left: 0, right: 0, 
                        background: 'white', listStyle: 'none', padding: 0, margin: 0, 
                        border: '1px solid #ddd', borderRadius: '0 0 6px 6px', zIndex: 100, 
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto'
                    }}>
                        {suggestions.map((item) => (
                            <li 
                                key={item._id} 
                                onClick={() => selectSuggestion(item.name)}
                                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                onMouseEnter={(e) => e.target.style.background = '#f9f9f9'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                                {item.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input type="number" placeholder="Giá (VNĐ)" value={ingPrice} onChange={(e) => setIngPrice(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <input type="file" accept="image/*" onChange={(e) => setIngImageFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                {/* [ĐÃ THÊM] Preview ảnh nguyên liệu */}
                {ingImageFile && (
                    <div style={{ marginTop: '8px' }}>
                        <img 
                          src={URL.createObjectURL(ingImageFile)} 
                          alt="ing-preview" 
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }} 
                        />
                    </div>
                )}
            </div>

            <button type="button" onClick={handleAddIngredient} style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ Thêm vào danh sách</button>
          </div>

          {/* LIST NGUYÊN LIỆU ĐÃ THÊM */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
            {addedIngredients.map((item) => (
                <div key={item.id} style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'relative' }}>
                    <div style={{ height: '80px', backgroundColor: '#eee' }}>{item.preview && <img src={item.preview} alt="preview" style={{width:'100%', height:'100%', objectFit:'cover'}}/>}</div>
                    <div style={{ padding: '8px' }}>
                        <h4 style={{ margin: '0', fontSize: '13px' }}>{item.name}</h4>
                        <p style={{ margin: '0', fontSize: '12px', color: '#ff6b00', fontWeight: 'bold' }}>{item.price} đ</p>
                    </div>
                    <button onClick={() => removeIngredient(item.id)} style={{ position: 'absolute', top: 0, right: 0, color: 'red', border: 'none', background: 'transparent', fontWeight:'bold', cursor:'pointer' }}>×</button>
                </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateRecipe;