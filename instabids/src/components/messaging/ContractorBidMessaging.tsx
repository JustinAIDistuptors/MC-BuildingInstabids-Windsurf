'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ContractorMessagingService, FormattedMessage } from '@/services/ContractorMessagingService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export interface ContractorBidMessagingProps {
  projectId: string;
  projectTitle?: string;
}

/**
 * A specialized messaging component for contractors to communicate with project owners
 * Simplified interface that removes contractor selection and group messaging options
 * Following the Magic MCP Integration pattern
 */
export default function ContractorBidMessaging({ projectId, projectTitle }: ContractorBidMessagingProps) {
  // State
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Supabase client
  const supabase = createClientComponentClient<Database>();
  
  // Get current user
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    }
    
    getUser();
  }, [supabase]);
  
  // Load messages on mount
  useEffect(() => {
    async function loadMessages() {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Get messages between contractor and homeowner only
        const messagesData = await ContractorMessagingService.getMessages(projectId, userId);
        
        // Add clientId for React keys
        const messagesWithClientId = messagesData.map(msg => ({
          ...msg,
          clientId: `${msg.id}-${Date.now()}`
        }));
        
        setMessages(messagesWithClientId);
        setError(null);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (projectId && userId) {
      loadMessages();
    }
  }, [projectId, userId]);
  
  // Subscribe to new messages
  useEffect(() => {
    if (!projectId || !userId) return;
    
    const unsubscribe = ContractorMessagingService.subscribeToMessages(
      projectId,
      userId,
      (newMessage) => {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          // Add clientId for React keys
          const messageWithClientId = {
            ...newMessage,
            clientId: `${newMessage.id}-${Date.now()}`
          };
          
          return [...prev, messageWithClientId];
        });
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [projectId, userId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  // Handle file button click
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && files.length === 0) return;
    if (!userId) return;
    
    try {
      setSending(true);
      
      // Send message to project owner (homeowner)
      const success = await ContractorMessagingService.sendMessage(
        projectId,
        newMessage,
        "individual", // Message type: individual (not group)
        null, // No specific recipient ID needed, system will determine homeowner
        files // Optional files to attach
      );
      
      if (success) {
        setNewMessage('');
        setFiles([]);
        
        // Refresh messages to ensure we have the latest
        const refreshedMessages = await ContractorMessagingService.getMessages(projectId, userId);
        
        // Add clientId for React keys
        const messagesWithClientId = refreshedMessages.map(msg => ({
          ...msg,
          clientId: `${msg.id}-${Date.now()}`
        }));
        
        setMessages(messagesWithClientId);
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[300px] min-h-[200px] bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
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
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="text-xs mb-1">
                    {message.isOwn ? 'You' : 'Project Owner'}
                  </div>
                  <div className="break-words">{message.content}</div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs underline"
                        >
                          {attachment.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="border-t p-3 bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message to Project Owner"
              className="min-h-[80px] resize-none"
              disabled={sending}
            />
            {files.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  {files.length} file(s) selected
                </p>
                <ul className="mt-1 text-xs">
                  {Array.from(files).map((file, index) => (
                    <li key={index} className="truncate">
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleFileButtonClick}
              disabled={sending}
              className="h-10 w-10 p-0"
            >
              <span className="sr-only">Attach files</span>
              📎
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />
            <Button
              type="submit"
              disabled={(!newMessage.trim() && files.length === 0) || sending}
              className="h-10 w-10 p-0"
            >
              <span className="sr-only">Send message</span>
              📤
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
