'use client';

import React, { useState } from 'react';

// Simple component with no external dependencies
export default function WorkingMessaging({ projectId }: { projectId?: string }) {
  const [message, setMessage] = useState('');
  
  // Mock messages for demonstration
  const mockMessages = [
    { id: '1', content: 'Hello, I am interested in your project', sender: 'Contractor A', isOwn: false },
    { id: '2', content: 'Thanks for your interest! Do you have any questions?', sender: 'You', isOwn: true },
  ];
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b">
        <h2 className="text-lg font-semibold">Project Messages</h2>
        {projectId && <p className="text-sm text-gray-500">Project ID: {projectId}</p>}
      </div>
      
      {/* Messages area */}
      <div className="h-80 overflow-y-auto p-4 bg-gray-50">
        {mockMessages.map((msg) => (
          <div 
            key={msg.id} 
            className={`mb-4 flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              {!msg.isOwn && <div className="font-medium text-xs mb-1">{msg.sender}</div>}
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow p-2 border rounded"
          />
          <button
            onClick={() => {
              if (message.trim()) {
                alert('Message sent: ' + message);
                setMessage('');
              }
            }}
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
