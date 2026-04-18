// src/components/ChatBox.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// [MỚI] Nhận socket thông qua props
const ChatBox = ({ socket, receiverId, receiverName, onClose }) => {
    const { user } = useContext(AuthContext); 
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const messagesEndRef = useRef(null); 
    const myId = user?._id || user?.id; // Lấy ID an toàn

    // 1. Tải lịch sử chat
    useEffect(() => {
        if (!user || !receiverId) return;

        const fetchMessages = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`http://localhost:5000/api/messages/${user._id}/${receiverId}`, {
                    headers: { 'x-auth-token': token }
                });
                setMessages(res.data);
            } catch (err) {
                console.error('Lỗi tải tin nhắn', err);
            }
        };
        fetchMessages();
    }, [user, receiverId]);

    // 2. Lắng nghe tin nhắn MỚI
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMsg = (newMessage) => {
            // [QUAN TRỌNG] Phải bọc String() để đối chiếu ObjectId của Mongo
            if (String(newMessage.sender) === String(receiverId) || String(newMessage.receiver) === String(receiverId)) {
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        socket.on('receiveMessage', handleReceiveMsg);
        return () => socket.off('receiveMessage', handleReceiveMsg);
    }, [receiverId, socket]);

    // 3. Tự động cuộn xuống cuối
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 4. Hàm Gửi tin nhắn
    const sendMessage = async () => {
        if (currentMessage.trim() === '') return;

        const messageData = {
            senderId: myId,
            receiverId: receiverId,
            text: currentMessage,
            createdAt: new Date().toISOString()
        };

        // Hiện tin nhắn lên màn hình của mình ngay lập tức
        setMessages((prev) => [...prev, {
            sender: myId,
            receiver: receiverId,
            text: currentMessage,
            createdAt: messageData.createdAt
        }]);

        setCurrentMessage(''); 

        // Bắn dữ liệu lên Server
        socket.emit('sendMessage', messageData);
    };

    return (
        <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ background: '#ff6b00', padding: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>💬 Chat với {receiverName}</h4>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>✖</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((msg, index) => {
                    const isMe = msg.sender === user._id;
                    return (
                        <div key={index} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                            <div style={{ background: isMe ? '#ff6b00' : '#e4e6eb', color: isMe ? 'white' : 'black', padding: '10px 15px', borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0', fontSize: '14px', wordWrap: 'break-word' }}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', background: '#fff' }}>
                <input 
                    type="text" 
                    value={currentMessage} 
                    onChange={(e) => setCurrentMessage(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                    placeholder="Nhập tin nhắn..." 
                    style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none' }}
                />
                <button onClick={sendMessage} style={{ background: '#ff6b00', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ➤
                </button>
            </div>
        </div>
    );
};

export default ChatBox;