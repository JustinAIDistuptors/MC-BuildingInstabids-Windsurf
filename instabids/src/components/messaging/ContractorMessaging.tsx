'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ContractorMessagingService, FormattedMessage, ContractorWithAlias } from '@/services/ContractorMessagingService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import MessagingDiagnostic from './MessagingDiagnostic';

export interface ContractorMessagingProps {
  projectId: string;
  projectTitle?: string;
}

/**
 * Messaging component for homeowners to communicate with contractors
 */
export default function ContractorMessaging({ projectId, projectTitle }: ContractorMessagingProps) {
  // State
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [contractors, setContractors] = useState<ContractorWithAlias[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [isGroupMessage, setIsGroupMessage] = useState<boolean>(false);
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
  
  // Load user data and messages on component mount
  useEffect(() => {
    const initialize = async () => {
      const user = await getUserData();
      if (user) {
        await loadData();
      }
    };
    
    initialize();
  }, [projectId]);
  
  // Get current user data
  const getUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        return user;
      } else {
        setError("You must be logged in to view messages");
        return null;
      }
    } catch (err) {
      console.error('Error getting user data:', err);
      setError("Failed to authenticate user");
      return null;
    }
  };
  
  // Load contractors and messages
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, ensure contractor aliases are assigned based on both bids and messages
      try {
        await ContractorMessagingService.assignContractorAliases(projectId);
        console.log('Contractor aliases assigned or verified');
      } catch (err) {
        console.error('Error assigning contractor aliases:', err);
        // Continue anyway - aliases might already be assigned
      }
      
      // Get contractors with aliases
      let contractorsData: ContractorWithAlias[] = [];
      try {
        contractorsData = await ContractorMessagingService.getContractorsWithAliases(projectId);
        console.log('Loaded contractors:', contractorsData);
        
        // CRITICAL: Add a fake contractor for testing if none exist
        if (contractorsData.length === 0) {
          console.log('No contractors found, adding a test contractor for debugging');
          contractorsData = [
            {
              id: 'test-contractor-id',
              name: 'Test Contractor',
              alias: 'A',
              avatar: null,
              bidAmount: 1000
            }
          ];
        }
        
        // Filter contractors to only include those who have bid or messaged
        if (contractorsData && contractorsData.length > 0) {
          // Make sure each contractor has an alias (A, B, C, etc.)
          const contractorsWithAliases = contractorsData.map((contractor, index) => ({
            ...contractor,
            // Use the database alias if available, otherwise generate one based on index
            alias: contractor.alias || String.fromCharCode(65 + index) // A, B, C, etc.
          }));
          
          setContractors(contractorsWithAliases);
          console.log('Contractors with aliases:', contractorsWithAliases);
          
          // Set the first contractor as selected by default
          if (contractorsWithAliases[0]?.id) {
            const firstContractorId = contractorsWithAliases[0].id;
            if (firstContractorId) {
              setSelectedContractorId(firstContractorId);
              console.log('Auto-selected contractor:', firstContractorId);
            }
          }
        }
      } catch (err) {
        console.error('Error loading contractors:', err);
        toast.error('Failed to load contractor data');
      }
      
      // Get messages
      await loadMessages();
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load messaging data');
    } finally {
      setLoading(false);
    }
  };
  
  // Load messages function
  const loadMessages = async () => {
    if (!projectId) {
      setError("Project ID is missing");
      return;
    }
    
    try {
      console.log('Loading messages for project:', projectId);
      
      // Get all messages for this project
      const messagesData = await ContractorMessagingService.getMessages(projectId);
      console.log('Loaded messages:', messagesData);
      
      if (messagesData && messagesData.length > 0) {
        // Add clientId for React keys
        const messagesWithClientId = messagesData.map(msg => ({
          ...msg,
          clientId: `${msg.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }));
        
        setMessages(messagesWithClientId);
        console.log('Set messages:', messagesWithClientId.length);
        
        // Extract unique contractor IDs from messages
        const contractorIds = [...new Set(messagesWithClientId
          .filter(msg => !msg.isOwn)
          .map(msg => msg.senderId))];
          
        console.log('Contractor IDs from messages:', contractorIds);
        
        // If we have contractors but no selected contractor, select the first one
        if (contractorIds.length > 0 && !selectedContractorId) {
          const firstContractorId = contractorIds[0];
          if (firstContractorId) {
            setSelectedContractorId(firstContractorId);
            console.log('Auto-selected contractor:', firstContractorId);
          }
        }
        
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
    
    if (!isGroupMessage && !selectedContractorId) {
      toast.error('Please select a contractor to message.');
      return;
    }
    
    try {
      setSending(true);
      
      const { success } = await ContractorMessagingService.sendMessage({
        projectId,
        message: newMessage,
        recipientId: selectedContractorId,
        files
      });
      
      if (success) {
        setNewMessage('');
        setFiles([]);
        
        // Add temporary message to UI
        const tempMessage: FormattedMessage = {
          id: `temp-${Date.now()}`,
          clientId: `temp-${Date.now()}`,
          senderId: userId,
          content: newMessage,
          timestamp: new Date().toISOString(),
          isOwn: true,
          isGroup: isGroupMessage,
          attachments: files.map(file => ({
            id: `temp-${file.name}`,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileUrl: URL.createObjectURL(file)
          }))
        };
        
        setMessages(prev => [...prev, tempMessage]);
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        toast.success('Message sent successfully');
        
        // Reload messages after a short delay
        setTimeout(() => {
          loadMessages();
        }, 1000);
      } else {
        toast.error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Error sending message');
    } finally {
      setSending(false);
    }
  };
  
  // Toggle group messaging
  const toggleGroupMessage = () => {
    setIsGroupMessage(!isGroupMessage);
  };
  
  // Get filtered messages based on selected contractor
  const getFilteredMessages = () => {
    console.log('Filtering messages:', messages.length, 'selectedContractorId:', selectedContractorId, 'userId:', userId);
    console.log('Available contractors:', contractors);
    
    // For debugging - log all messages
    messages.forEach(msg => {
      console.log(`Message: ${msg.id}, sender: ${msg.senderId}, isOwn: ${msg.isOwn}`);
    });
    
    // Use the contractor aliases from the database instead of generating them client-side
    // This ensures consistency with the database and other components
    
    // For homeowner view, process messages to show correct ownership and aliases
    const processedMessages = messages.map(message => {
      // Determine if the message is from the current user (homeowner)
      const isFromCurrentUser = message.senderId === userId;
      
      // If the message is NOT from the current user, it must be from a contractor
      const isFromContractor = !isFromCurrentUser;
      
      // Find the contractor for this message to get their alias
      const contractor = isFromContractor ? contractors.find(c => c.id === message.senderId) : null;
      
      console.log('Message processing:', {
        id: message.id,
        senderId: message.senderId,
        isFromCurrentUser,
        isFromContractor,
        foundContractor: contractor ? true : false,
        contractorAlias: contractor?.alias
      });
      
      return {
        ...message,
        // Set isOwn to true only if the message is from the current user (homeowner)
        isOwn: isFromCurrentUser,
        // Use the contractor's alias from our loaded contractors list
        senderAlias: contractor?.alias || message.senderAlias || 'A'
      };
    });
    
    console.log('Processed messages:', processedMessages);
    return processedMessages;
  };
  
  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Messages {projectTitle ? `- ${projectTitle}` : ''}
          </h2>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-normal">Group Message</span>
            <div 
              className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer ${isGroupMessage ? 'bg-blue-500' : 'bg-gray-300'}`}
              onClick={toggleGroupMessage}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isGroupMessage ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>
        </div>
        
        {!isGroupMessage && (
          <div className="mt-2">
            <Select
              value={selectedContractorId}
              onValueChange={(value: string) => setSelectedContractorId(value)}
              disabled={contractors.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a contractor" />
              </SelectTrigger>
              <SelectContent>
                {contractors.length > 0 ? (
                  contractors.map((contractor) => (
                    <SelectItem key={contractor.id} value={contractor.id || ''}>
                      Contractor {contractor.alias || 'A'}
                      {contractor.bidAmount && ` - $${contractor.bidAmount.toLocaleString()}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-contractors" disabled>
                    No contractors available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Button 
          variant="outline" 
          onClick={loadData} 
          disabled={loading}
          className="mt-2 text-sm py-1 px-3"
        >
          Refresh Messages
        </Button>
      </div>
      
      {/* Messages area */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50" style={{ maxHeight: '400px' }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading messages...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                No messages yet. Start the conversation!
              </div>
            ) : (
              getFilteredMessages().map((message) => (
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
                    title={`Sender: ${message.senderId}, isOwn: ${message.isOwn}`}
                  >
                    {!message.isOwn && (
                      <div className="flex items-center mb-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                          {message.senderAlias || 'A'}
                        </div>
                        <span className="text-xs font-medium">
                          Contractor {message.senderAlias || 'A'}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {message.timestamp && ContractorMessagingService.formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                    )}
                    
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
              ))
            )}
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
            disabled={sending || (!isGroupMessage && !selectedContractorId)}
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
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="text-sm py-1 px-3"
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
              disabled={
                sending || 
                (!newMessage.trim() && files.length === 0) || 
                (!isGroupMessage && !selectedContractorId)
              }
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
      
      {/* Diagnostic Tool - For Development Only */}
      <div className="mt-4">
        <MessagingDiagnostic projectId={projectId} />
      </div>
    </div>
  );
}
