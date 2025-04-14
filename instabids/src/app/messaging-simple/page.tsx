'use client';

import React, { useState } from 'react';

export default function SimpleMessagingPage() {
  const [messages, setMessages] = useState([
    { id: '1', content: 'Hello, I am interested in your project', isOwn: false, senderAlias: 'A', timestamp: new Date().toISOString() },
    { id: '2', content: 'Thanks for your interest! Do you have any questions?', isOwn: true, timestamp: new Date().toISOString() },
    { id: '3', content: 'Yes, what is the timeline for this project?', isOwn: false, senderAlias: 'A', timestamp: new Date().toISOString() },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isGroupMessage, setIsGroupMessage] = useState(false);
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      content: newMessage,
      isOwn: true,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };
  
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Simple Contractor Messaging</h1>
      
      <div className="mb-4 flex items-center">
        <span className="mr-2">Group Message:</span>
        <input 
          type="checkbox" 
          checked={isGroupMessage}
          onChange={() => setIsGroupMessage(!isGroupMessage)}
          className="h-4 w-4"
        />
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        {/* Messages */}
        <div className="p-4 h-80 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isOwn
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {!message.isOwn && (
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs mr-2">
                      {message.senderAlias}
                    </div>
                    <span className="text-xs font-medium">
                      Contractor {message.senderAlias}
                    </span>
                  </div>
                )}
                
                <div>
                  {message.content}
                </div>
                
                <div className={`text-xs mt-1 ${message.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Input */}
        <div className="border-t p-4 flex">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow border rounded-l-lg p-2 resize-none"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-4 rounded-r-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
