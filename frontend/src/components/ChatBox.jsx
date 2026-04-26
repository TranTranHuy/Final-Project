// src/components/ChatBox.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ChatBox = ({ socket, receiverId, receiverName, onClose }) => {
    const { user } = useContext(AuthContext); 
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const messagesEndRef = useRef(null); 

    // Normalize ID as String for exact comparison
    const myId = String(user?._id || user?.id);

    // 1. Load chat history
    useEffect(() => {
        if (!user || !receiverId) return;

        const fetchMessages = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`http://localhost:5000/api/messages/${myId}/${receiverId}`, {
                    headers: { 'x-auth-token': token }
                });
                setMessages(res.data);
            } catch (err) {
                console.error('Error loading messages', err);
            }
        };
        fetchMessages();
    }, [user, receiverId, myId]);

    // 2. Listen for NEW messages
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMsg = (newMessage) => {
            if (String(newMessage.sender) === String(receiverId) || String(newMessage.receiver) === String(receiverId)) {
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        socket.on('receiveMessage', handleReceiveMsg);
        return () => socket.off('receiveMessage', handleReceiveMsg);
    }, [receiverId, socket]);

    // 3. Auto-scroll to the bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 4. Send message function
    const sendMessage = async () => {
        if (currentMessage.trim() === '') return;

        const messageData = {
            senderId: myId,
            receiverId: String(receiverId),
            text: currentMessage,
            createdAt: new Date().toISOString()
        };

        // Display the message locally immediately
        setMessages((prev) => [...prev, {
            sender: myId,
            receiver: receiverId,
            text: currentMessage,
            createdAt: messageData.createdAt
        }]);

        setCurrentMessage(''); 

        // Send data to the Server
        socket.emit('sendMessage', messageData);
    };

    return (
        <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Header Chat */}
            <div style={{ background: '#ff6b00', padding: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '35px', height: '35px', background: '#fff', color: '#ff6b00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {receiverName.charAt(0).toUpperCase()}
                    </div>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>{receiverName}</h4>
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>✖</button>
            </div>

            {/* Message display area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg, index) => {
                    // [FIXED] Compare using String for accuracy
                    const isMe = String(msg.sender) === myId;
                    
                    return (
                        <div key={index} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: isMe ? 'flex-end' : 'flex-start' // Mine to the right, theirs to the left
                        }}>
                            <div style={{ 
                                maxWidth: '75%',
                                // Color scheme similar to Messenger: mine blue, theirs gray
                                background: isMe ? '#0084ff' : '#e4e6eb', 
                                color: isMe ? 'white' : 'black', 
                                padding: '10px 16px', 
                                // Rounded corners: my bubble points lower-right, theirs lower-left
                                borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                                fontSize: '15px', 
                                wordWrap: 'break-word',
                                lineHeight: '1.4'
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input area */}
            <div style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', background: '#fff' }}>
                <input 
                    type="text" 
                    value={currentMessage} 
                    onChange={(e) => setCurrentMessage(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                    placeholder="Type a message..." 
                    style={{ flex: 1, padding: '12px 20px', borderRadius: '30px', border: '1px solid #ddd', outline: 'none', background: '#f5f5f5', fontSize: '15px' }}
                />
                <button onClick={sendMessage} style={{ background: '#ff6b00', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: '0.2s' }}>
                    ➤
                </button>
            </div>
        </div>
    );
};

export default ChatBox;