'use client';

import React, { useState, useEffect } from 'react';

interface MinimalMessagingProps {
  projectId: string;
}

interface SimpleMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
}

export default function MinimalMessaging({ projectId }: MinimalMessagingProps) {
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial messages
  useEffect(() => {
    // For testing, create some mock messages
    const mockMessages: SimpleMessage[] = [
      {
        id: '1',
        content: 'Hello, I am interested in your project',
        sender: 'Contractor A',
        timestamp: new Date().toISOString(),
        isOwn: false
      },
      {
        id: '2',
        content: 'Thanks for your interest! Do you have any questions?',
        sender: 'You',
        timestamp: new Date().toISOString(),
        isOwn: true
      }
    ];
    
    setMessages(mockMessages);
  }, [projectId]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Create a new message
    const newMsg: SimpleMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'You',
      timestamp: new Date().toISOString(),
      isOwn: true
    };
    
    // Add to messages
    setMessages(prev => [...prev, newMsg]);
    
    // Clear input
    setNewMessage('');
  };

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return <div className="p-4 text-center">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b">
        <h2 className="text-lg font-semibold">Project Messages</h2>
        <p className="text-sm text-gray-500">Project ID: {projectId}</p>
      </div>
      
      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {!message.isOwn && (
                    <div className="font-medium text-xs mb-1">
                      {message.sender}
                    </div>
                  )}
                  <div>{message.content}</div>
                  <div className={`text-xs mt-1 ${message.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow p-2 border rounded"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
