// src/components/Inbox.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ChatBox from './ChatBox';
import io from 'socket.io-client';

// [MỚI] Khởi tạo Socket ở đây để dùng chung
const socket = io.connect('http://localhost:5000');

const Inbox = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const { user } = useContext(AuthContext);

  // Hàm tải danh sách người đã chat
  const fetchConversations = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/messages/conversations', {
            headers: { 'x-auth-token': token }
        });
        setConversations(res.data);
    } catch (err) {
        console.error(err);
    }
  };

  // [ĐÃ SỬA] Đăng ký User với Socket an toàn tuyệt đối
  useEffect(() => {
      if (!user) return;
      
      // Đảm bảo lấy đúng ID kể cả khi trường bị lệch tên
      const myId = user._id || user.id;

      // Đăng ký ngay lần đầu
      socket.emit('setup', myId);
      fetchConversations();

      // Bắt sự kiện tự động đăng ký lại nếu mạng bị rớt
      const handleReconnect = () => {
          socket.emit('setup', myId);
      };
      
      socket.on('connect', handleReconnect);
      return () => socket.off('connect', handleReconnect);
  }, [user]);

  // [MỚI] Lắng nghe tin nhắn mới để tự động cập nhật danh sách bên trái
  useEffect(() => {
      const handleNewMessage = () => {
          fetchConversations(); // Tải lại danh sách chat ngay lập tức
      };
      socket.on('receiveMessage', handleNewMessage);
      return () => socket.off('receiveMessage', handleNewMessage);
  }, []);

  // Tìm kiếm người dùng mới
  useEffect(() => {
      const searchUsers = async () => {
          if (!searchQuery.trim()) {
              setSearchResults([]);
              return;
          }
          try {
              const token = localStorage.getItem('token');
              const res = await axios.get(`http://localhost:5000/api/users/search?q=${searchQuery}`, {
                  headers: { 'x-auth-token': token }
              });
              setSearchResults(res.data);
          } catch (err) {
              console.error(err);
          }
      };

      const timerId = setTimeout(() => searchUsers(), 300);
      return () => clearTimeout(timerId);
  }, [searchQuery]);

  const handleStartNewChat = (newUser) => {
      setSelectedUser(newUser);
      setSearchQuery('');       
      setSearchResults([]);     

      const exists = conversations.find(c => c.otherUser._id === newUser._id);
      if (!exists) {
          setConversations([{ otherUser: newUser, lastMessage: 'Bắt đầu trò chuyện...' }, ...conversations]);
      }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', display: 'flex', gap: '20px', height: '80vh' }}>
        
        {/* CỘT TRÁI: TÌM KIẾM & DANH SÁCH CHAT */}
        <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: '#fcfcfc', borderRadius: '12px 12px 0 0' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>Hộp thư đến</h3>
                <input 
                    type="text" 
                    placeholder="🔍 Tìm người dùng..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none' }}
                />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, position: 'relative' }}>
                {searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#fff', zIndex: 10 }}>
                        <p style={{ margin: 0, padding: '10px 20px', fontSize: '12px', background: '#f5f5f5' }}>KẾT QUẢ TÌM KIẾM</p>
                        {searchResults.map((su) => (
                            <div key={su._id} onClick={() => handleStartNewChat(su)} style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', gap: '10px' }}>
                                <b>{su.username}</b>
                            </div>
                        ))}
                    </div>
                )}

                {conversations.length === 0 && searchResults.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', marginTop: '30px' }}>Hộp thư trống</p>
                ) : (
                    conversations.map((conv) => (
                        <div 
                            key={conv.otherUser._id} 
                            onClick={() => setSelectedUser(conv.otherUser)}
                            style={{ 
                                padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: '15px', alignItems: 'center',
                                background: selectedUser?._id === conv.otherUser._id ? '#fff9f5' : 'transparent',
                                borderLeft: selectedUser?._id === conv.otherUser._id ? '4px solid #ff6b00' : '4px solid transparent'
                            }}
                        >
                            <span style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {conv.otherUser.username.charAt(0).toUpperCase()}
                            </span>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 'bold' }}>{conv.otherUser.username}</div>
                                <div style={{ fontSize: '13px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {conv.lastMessage}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* CỘT PHẢI: KHUNG CHAT (Truyền socket qua props) */}
        <div style={{ flex: 2, background: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {selectedUser ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                     {/* [QUAN TRỌNG] Truyền socket từ Inbox sang ChatBox */}
                     <ChatBox 
                        key={selectedUser._id} 
                        socket={socket} 
                        receiverId={selectedUser._id} 
                        receiverName={selectedUser.username} 
                        onClose={() => setSelectedUser(null)} 
                     />
                </div>
            ) : (
                <div style={{ textAlign: 'center', color: '#999' }}>
                    <div style={{ fontSize: '50px', marginBottom: '10px' }}>💬</div>
                    <p>Chọn cuộc trò chuyện để bắt đầu</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Inbox;