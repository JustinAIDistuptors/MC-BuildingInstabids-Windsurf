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
 * A simplified messaging component for contractors to communicate with project owners
 */
export default function ContractorBidMessaging({ projectId, projectTitle }: ContractorBidMessagingProps) {
  // State
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [homeownerId, setHomeownerId] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Supabase client
  const supabase = createClientComponentClient<Database>();
  
  // Load user data and messages on component mount
  useEffect(() => {
    const initialize = async () => {
      const user = await getUserData();
      if (user) {
        await getHomeownerData();
        await loadMessages();
      }
    };
    
    initialize();
  }, [projectId]);
  
  // Get current user data
  const getUserData = async () => {
    try {
      setLoading(true);
      
      // Try to get the authenticated user
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Authentication error:", error.message);
        setError("Authentication error: " + error.message);
        return null;
      }
      
      if (data?.user) {
        console.log("User authenticated:", data.user.id);
        setUserId(data.user.id);
        return data.user.id;
      } else {
        console.warn("No authenticated user found");
        
        // For development only - use a test user ID if needed
        if (process.env.NODE_ENV === 'development') {
          const urlParams = new URLSearchParams(window.location.search);
          const testContractorId = urlParams.get('contractor_id') || 
                                  localStorage.getItem('dev_user_id') || 
                                  '00000000-0000-0000-0000-000000000000';
          
          console.log("Using test contractor ID:", testContractorId);
          setUserId(testContractorId);
          return testContractorId;
        } else {
          setError("You must be logged in to view messages");
          return null;
        }
      }
    } catch (err) {
      console.error("Error getting authenticated user:", err);
      setError("Error authenticating user");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Get homeowner data for the project
  const getHomeownerData = async () => {
    if (!projectId) return;
    
    try {
      // First try to get project details to find the homeowner
      const { data, error } = await supabase
        .from('projects')
        .select('owner_id, created_by')
        .eq('id', projectId)
        .single();
      
      if (error) {
        console.error('Error getting project owner:', error);
        return;
      }
      
      if (data?.owner_id) {
        setHomeownerId(data.owner_id);
      } else if (data?.created_by) {
        setHomeownerId(data.created_by);
      } else {
        console.warn('No owner found for project');
      }
    } catch (err) {
      console.error('Error getting homeowner:', err);
    }
  };
  
  // Load messages function
  const loadMessages = async () => {
    if (!projectId) {
      setError("Project ID is missing");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading messages for project:', projectId);
      
      // Get all messages for this project
      const messagesData = await ContractorMessagingService.getMessages(projectId);
      console.log('Loaded messages:', messagesData);
      
      if (messagesData && messagesData.length > 0) {
        // Add clientId for React keys
        const messagesWithClientId = messagesData.map(msg => ({
          ...msg,
          clientId: `${msg.id}-${Date.now()}`
        }));
        
        setMessages(messagesWithClientId);
        
        // Scroll to bottom after loading messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setMessages([]);
        console.log('No messages found for project');
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && files.length === 0) {
      toast.error('Please enter a message or attach a file.');
      return;
    }
    
    if (!userId) {
      toast.error('You must be logged in to send messages.');
      return;
    }
    
    if (!homeownerId) {
      toast.error('Cannot determine message recipient.');
      return;
    }
    
    try {
      setSending(true);
      
      const { success } = await ContractorMessagingService.sendMessage({
        projectId,
        message: newMessage,
        recipientId: homeownerId,
        files
      });
      
      if (success) {
        setNewMessage('');
        setFiles([]);
        toast.success('Message sent successfully!');
        
        // Reload messages to show the new message
        await loadMessages();
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
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            onClick={loadMessages} 
            disabled={loading}
            className="text-xs px-2 py-1 h-auto"
          >
            {loading ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></span>
                Loading...
              </span>
            ) : (
              <span>Refresh Messages</span>
            )}
          </Button>
        </div>
        
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
                className={`flex ${
                  message.isOwn ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleString()}
                  </p>
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2">
                      {message.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs underline mt-1"
                        >
                          {attachment.fileName || `Attachment ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input area */}
      <div className="p-4 border-t bg-white">
        <div className="flex flex-col space-y-2">
          <Textarea
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="resize-none"
            rows={3}
            disabled={sending}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
              >
                Attach Files
              </Button>
              
              {files.length > 0 && (
                <span className="text-xs text-gray-500">
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={sending || (!newMessage.trim() && files.length === 0)}
            >
              {sending ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></span>
                  Sending...
                </span>
              ) : (
                'Send Message'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
