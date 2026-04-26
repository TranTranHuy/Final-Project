// src/components/Inbox.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ChatBox from './ChatBox';
import { io } from 'socket.io-client'; // [FIXED] Import correctly

// Initialize Socket
const socket = io('http://localhost:5000', {
    autoConnect: true,
    reconnection: true
});

const Inbox = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const { user } = useContext(AuthContext);

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

  // [MOST IMPORTANT] CONNECTION AND SAFE IDENTIFICATION LOGIC
  useEffect(() => {
      if (!user) return;
      const myId = String(user._id || user.id);

      // Handler when Socket connects successfully
      const handleConnect = () => {
          console.log("🟢 Frontend Socket connected successfully!", socket.id);
          socket.emit('setup', myId); // Identify into room
      };

      // If already connected, call immediately
      if (socket.connected) {
          handleConnect();
      }

      // Listen for (re)connection events
      socket.on('connect', handleConnect);

      // Listen for new messages to reset left list
      const handleReceiveMessage = (msg) => {
          console.log("📥 Inbox received message signal from Server:", msg);
          fetchConversations();
      };
      socket.on('receiveMessage', handleReceiveMessage);

      // Call first time to get list
      fetchConversations();

      return () => {
          socket.off('connect', handleConnect);
          socket.off('receiveMessage', handleReceiveMessage);
      };
  }, [user]);

  // Search
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
          setConversations([{ otherUser: newUser, lastMessage: 'Start conversation...' }, ...conversations]);
      }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', display: 'flex', gap: '20px', height: '80vh' }}>
        {/* LEFT COLUMN */}
        <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: '#fcfcfc', borderRadius: '12px 12px 0 0' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>Inbox</h3>
                <input 
                    type="text" 
                    placeholder="🔍 Search users..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none' }}
                />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, position: 'relative' }}>
                {searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#fff', zIndex: 10 }}>
                        <p style={{ margin: 0, padding: '10px 20px', fontSize: '12px', background: '#f5f5f5' }}>SEARCH RESULTS</p>
                        {searchResults.map((su) => (
                            <div key={su._id} onClick={() => handleStartNewChat(su)} style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', gap: '10px' }}>
                                <b>{su.username}</b>
                            </div>
                        ))}
                    </div>
                )}

                {conversations.length === 0 && searchResults.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', marginTop: '30px' }}>Inbox empty</p>
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
                            {conv.otherUser.avatar ? (
                                <img 
                                    src={`http://localhost:5000${conv.otherUser.avatar}`} 
                                    alt="avatar" 
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                                />
                            ) : (
                                <span style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {conv.otherUser.username.charAt(0).toUpperCase()}
                                </span>
                            )}
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

        {/* RIGHT COLUMN */}
        <div style={{ flex: 2, background: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {selectedUser ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
                    <p>Select a conversation to start</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Inbox;