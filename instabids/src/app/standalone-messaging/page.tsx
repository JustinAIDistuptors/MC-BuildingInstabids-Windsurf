'use client';

import React, { useState, useEffect } from 'react';

// Simple types for our messaging system
type Contractor = {
  id: string;
  name: string;
  alias: string;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  isOwn: boolean;
  timestamp: string;
};

export default function StandaloneMessaging() {
  // State
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [isGroupMessage, setIsGroupMessage] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize data
  useEffect(() => {
    try {
      // Mock contractors
      const mockContractors: Contractor[] = [
        { id: '1', name: 'John Smith', alias: 'A' },
        { id: '2', name: 'Jane Doe', alias: 'B' },
        { id: '3', name: 'Bob Johnson', alias: 'C' },
      ];
      
      setContractors(mockContractors);
      setSelectedContractorId(mockContractors[0].id);
      
      // Mock messages
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Hello, I have a question about your bid',
          senderId: 'homeowner',
          isOwn: true,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          content: 'I would be happy to answer any questions you have',
          senderId: '1',
          isOwn: false,
          timestamp: new Date(Date.now() - 3000000).toISOString(),
        },
      ];
      
      setMessages(mockMessages);
      setLoading(false);
    } catch (err) {
      console.error('Error initializing:', err);
      setError('Failed to initialize messaging. Please try again.');
      setLoading(false);
    }
  }, []);

  // Send a message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    try {
      // Create new message
      const newMsg: Message = {
        id: Date.now().toString(),
        content: newMessage,
        senderId: 'homeowner',
        isOwn: true,
        timestamp: new Date().toISOString(),
      };
      
      // Add to messages
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // Simulate response
      setTimeout(() => {
        const responseMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: isGroupMessage 
            ? 'This is a response to your group message' 
            : `This is a response from Contractor ${contractors.find(c => c.id === selectedContractorId)?.alias || 'Unknown'}`,
          senderId: isGroupMessage ? 'group' : selectedContractorId,
          isOwn: false,
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, responseMsg]);
      }, 1000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Get contractor alias
  const getContractorAlias = (contractorId: string): string => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor ? contractor.alias : 'Unknown';
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '20px', 
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center'
      }}>
        <p>Loading messaging system...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px', 
      fontFamily: 'system-ui, sans-serif' 
    }}>
      <h1 style={{ marginBottom: '20px' }}>Standalone Contractor Messaging</h1>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffdddd', 
          color: '#d8000c', 
          padding: '10px', 
          margin: '10px 0', 
          borderRadius: '4px' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ 
        border: '1px solid #ccc',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '15px', 
          borderBottom: '1px solid #ccc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            {isGroupMessage ? 'Group Message' : `Message to Contractor ${getContractorAlias(selectedContractorId)}`}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>Group Message</span>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
              <input 
                type="checkbox" 
                checked={isGroupMessage}
                onChange={() => setIsGroupMessage(!isGroupMessage)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{ 
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isGroupMessage ? '#2196F3' : '#ccc',
                borderRadius: '34px',
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '22px',
                  width: '22px',
                  left: isGroupMessage ? '34px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s'
                }}></span>
              </span>
            </label>
          </div>
        </div>
        
        {/* Contractor selection (only shown for individual messages) */}
        {!isGroupMessage && (
          <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Select Contractor:</label>
            <select 
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
              style={{ 
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              {contractors.map(c => (
                <option key={c.id} value={c.id}>
                  Contractor {c.alias} ({c.name})
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Messages area */}
        <div style={{ 
          height: '400px', 
          padding: '15px', 
          overflowY: 'auto',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: msg.isOwn ? 'flex-end' : 'flex-start',
              marginBottom: '10px'
            }}>
              <div style={{
                maxWidth: '70%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: msg.isOwn ? '#0070f3' : 'white',
                color: msg.isOwn ? 'white' : 'black',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                {!msg.isOwn && (
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>
                    {msg.senderId === 'group' 
                      ? 'All Contractors' 
                      : `Contractor ${getContractorAlias(msg.senderId)}`}
                  </div>
                )}
                <div>{msg.content}</div>
                <div style={{
                  fontSize: '12px',
                  marginTop: '5px',
                  opacity: 0.7,
                  textAlign: 'right'
                }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Message input */}
        <div style={{ 
          padding: '15px', 
          borderTop: '1px solid #ccc',
          backgroundColor: 'white'
        }}>
          <textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Type a message to ${isGroupMessage ? 'all contractors' : `Contractor ${getContractorAlias(selectedContractorId)}`}`}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              minHeight: '80px',
              resize: 'vertical',
              marginBottom: '10px',
              fontFamily: 'inherit'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: newMessage.trim() ? '#0070f3' : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: newMessage.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <p>This is a standalone implementation that doesn't rely on any UI libraries.</p>
        <p>If this page renders correctly but others don't, the issue is likely with UI component dependencies.</p>
      </div>
    </div>
  );
}
