// src/components/Inbox.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ChatBox from './ChatBox';
import { io } from 'socket.io-client';

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
        if (!token) return;
        const res = await axios.get('http://localhost:5000/api/messages/conversations', {
            headers: { 'x-auth-token': token }
        });
        setConversations(res.data);
    } catch (err) {
        console.error('Error fetching conversations:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch when component mounts or page reloads
    fetchConversations();

    const myId = String(user._id || user.id);
    socket.emit('setup', myId);

    // Refresh list when a new message is received
    const handleReceiveMessage = () => {
        fetchConversations(); 
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
        socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [user]);

  // User search logic
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
              console.error('Search error:', err);
          }
      };
      const timerId = setTimeout(() => searchUsers(), 300);
      return () => clearTimeout(timerId);
  }, [searchQuery]);

  const handleStartNewChat = (newUser) => {
      setSelectedUser(newUser);
      setSearchQuery('');      
      setSearchResults([]);     

      const exists = conversations.find(c => String(c.otherUser._id) === String(newUser._id));
      if (!exists) {
          setConversations([{ otherUser: newUser, lastMessage: 'Start a conversation...' }, ...conversations]);
      }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', display: 'flex', gap: '20px', height: '80vh' }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: '#fcfcfc', borderRadius: '12px 12px 0 0' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>Inbox</h3>
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none' }}
                />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, position: 'relative' }}>
                {searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#fff', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        {searchResults.map((su) => (
                            <div key={su._id} onClick={() => handleStartNewChat(su)} style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                <b>{su.username}</b>
                            </div>
                        ))}
                    </div>
                )}

                {conversations.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', marginTop: '30px' }}>No conversations yet</p>
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
                                <img src={`http://localhost:5000${conv.otherUser.avatar}`} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {conv.otherUser.username?.charAt(0).toUpperCase()}
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
                    <p>Select a user to start chatting</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Inbox;