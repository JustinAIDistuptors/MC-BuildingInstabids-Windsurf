'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ContractorMessagingService, 
  ContractorWithAlias, 
  FormattedMessage 
} from '@/services/ContractorMessagingService';

interface MagicMessagingProps {
  projectId?: string;
}

export default function MagicMessaging({ projectId }: MagicMessagingProps) {
  // State
  const [contractors, setContractors] = useState<ContractorWithAlias[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [isGroupMessage, setIsGroupMessage] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>('');
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load data on mount
  useEffect(() => {
    async function loadData() {
      if (!projectId) {
        setError('Project ID is required');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Get contractors with aliases
        const contractorsData = await ContractorMessagingService.getContractorsWithAliases(projectId);
        setContractors(contractorsData || []);
        
        if (contractorsData && contractorsData.length > 0 && contractorsData[0]?.id) {
          setSelectedContractorId(contractorsData[0].id);
        }
        
        // Get messages
        const messagesData = await ContractorMessagingService.getMessages(projectId);
        
        // Ensure each message has a unique clientId for React keys
        const messagesWithClientIds = messagesData.map(message => ({
          ...message,
          clientId: `msg-${message.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }));
        
        setMessages(messagesWithClientIds || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    }
    
    loadData();
    
    // Subscribe to new messages
    if (projectId) {
      const unsubscribe = ContractorMessagingService.subscribeToMessages(
        projectId,
        null, // Get all messages
        (newMessage) => {
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            
            // Add clientId to new message for React key
            const messageWithClientId = {
              ...newMessage,
              clientId: `msg-${newMessage.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            };
            
            return [...prev, messageWithClientId];
          });
        }
      );
      
      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };
    }
    
    return undefined; // Add return for TypeScript
  }, [projectId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Send a message
  const handleSendMessage = async () => {
    if (!projectId) {
      setError('Project ID is required');
      return;
    }
    
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      
      // Send message
      const success = await ContractorMessagingService.sendMessage(
        projectId,
        newMessage,
        isGroupMessage ? 'group' : 'individual',
        isGroupMessage ? null : selectedContractorId,
        []
      );
      
      if (success) {
        // Clear input
        setNewMessage('');
        
        // Refresh messages
        const refreshedMessages = await ContractorMessagingService.getMessages(projectId);
        
        // Ensure each message has a unique clientId for React keys
        const messagesWithClientIds = refreshedMessages.map(message => ({
          ...message,
          clientId: `msg-${message.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }));
        
        setMessages(messagesWithClientIds);
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(`Failed to send message: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSending(false);
    }
  };
  
  // Toggle message type
  const toggleMessageType = () => {
    setIsGroupMessage(!isGroupMessage);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Get contractor alias
  const getContractorAlias = (contractorId: string): string => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor ? contractor.alias : '';
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin text-2xl">⏳</div>
      </div>
    );
  }
  
  if (error && !contractors.length) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
        <div className="font-bold">Error</div>
        <div>{error}</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {isGroupMessage ? 'Group Message' : `Message to Contractor ${getContractorAlias(selectedContractorId)}`}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Group Message</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isGroupMessage}
                onChange={toggleMessageType}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
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
                key={message.clientId || message.id}
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
                      {message.isGroup ? 'All Contractors' : `Contractor ${message.senderAlias || ''}`}
                    </div>
                  )}
                  <div>{message.content}</div>
                  
                  <div className={`text-xs mt-1 ${message.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-red-600 text-sm flex items-center">
            ⚠️ {error}
          </p>
        </div>
      )}
      
      {/* Input */}
      <div className="p-4 border-t bg-white">
        {!isGroupMessage && contractors.length > 0 && (
          <select
            className="w-full mb-2 p-2 border rounded"
            value={selectedContractorId}
            onChange={(e) => setSelectedContractorId(e.target.value)}
            disabled={sending}
          >
            {contractors.map((contractor) => (
              <option key={contractor.id} value={contractor.id}>
                Contractor {contractor.alias}
              </option>
            ))}
          </select>
        )}
        
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow p-2 border rounded"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? '⏳' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
