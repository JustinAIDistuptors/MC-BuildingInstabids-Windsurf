'use client';

import React, { useState } from 'react';

export default function MinimalMessaging() {
  // Basic state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello, I have a question about your bid', isOwn: true },
    { id: 2, text: 'I would be happy to answer your questions', isOwn: false }
  ]);
  const [error, setError] = useState(null);

  // Handle sending a message
  const handleSend = () => {
    if (!message.trim()) return;
    
    try {
      // Add user message
      setMessages([
        ...messages, 
        { id: Date.now(), text: message, isOwn: true }
      ]);
      setMessage('');
      
      // Simulate response
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { id: Date.now() + 1, text: 'This is a response from the contractor', isOwn: false }
        ]);
      }, 1000);
    } catch (err) {
      setError(`Error: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Minimal Messaging Test</h1>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '5px',
        height: '300px',
        overflowY: 'auto',
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#f5f5f5'
      }}>
        {messages.map(msg => (
          <div 
            key={msg.id}
            style={{
              textAlign: msg.isOwn ? 'right' : 'left',
              marginBottom: '10px'
            }}
          >
            <span style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: msg.isOwn ? '#0070f3' : 'white',
              color: msg.isOwn ? 'white' : 'black',
              maxWidth: '80%'
            }}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ 
            flexGrow: 1, 
            padding: '8px', 
            borderRadius: '4px 0 0 4px',
            border: '1px solid #ccc',
            borderRight: 'none'
          }}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '0 4px 4px 0',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <p>This is a minimal test page to identify React rendering issues.</p>
        <p>If this page renders correctly but others don't, the issue is likely with UI component libraries or dependencies.</p>
      </div>
    </div>
  );
}
