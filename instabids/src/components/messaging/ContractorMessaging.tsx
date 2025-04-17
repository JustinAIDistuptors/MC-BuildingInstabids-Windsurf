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
  
  // Load contractors for this project
  const loadContractors = async () => {
    try {
      console.log('Loading contractors for project:', projectId);
      
      // CRITICAL FIX: Create contractors based on unique sender IDs that are not the current user
      // This handles the case where messages from contractors have different sender IDs
      
      // Extract unique contractor sender IDs from messages
      const contractorMap = new Map();
      
      // First, identify all unique contractor sender IDs
      const uniqueContractorIds = new Set();
      messages.forEach(message => {
        // A message is from a contractor if:
        // 1. The sender ID is not the current user's ID AND
        // 2. The isOwn flag is false (this is critical for correct identification)
        const isFromContractor = message.senderId !== userId && message.isOwn === false;
        
        // Only add real contractor IDs to the set
        if (isFromContractor) {
          console.log('Found contractor message:', message.content, 'from:', message.senderId);
          uniqueContractorIds.add(message.senderId);
        }
      });
      
      // For each unique contractor ID, create a contractor object with a unique sequential number
      let contractorCounter = 1;
      Array.from(uniqueContractorIds).forEach((contractorId: unknown) => {
        const contractorNumber = String(contractorCounter++);
        
        // Find a message from this contractor to use as a reference
        const contractorMessage = messages.find(m => m.senderId === contractorId && !m.isOwn);
        
        // Only create contractor entries for real contractors (not homeowners)
        if (contractorMessage) {
          console.log('Creating contractor entry for:', contractorId, 'with label:', contractorNumber);
          contractorMap.set(contractorId, {
            id: String(contractorId), // Use the actual sender ID as string
            name: `Contractor ${contractorNumber}`, // Use a unique number for each contractor
            alias: contractorNumber, // Use a unique number for each contractor
            avatar: null,
            bidAmount: 1000 // Set bid amount for all contractors
          });
        }
      });
      
      // Convert to array
      const realContractors = Array.from(contractorMap.values());
      
      console.log('Found real contractors with consistent labels:', realContractors);
      
      // Use the real contractors based on sender IDs
      setContractors(realContractors);
      
      // If we have contractors and no selected contractor, select the first one
      if (realContractors.length > 0 && !selectedContractorId) {
        setSelectedContractorId(realContractors[0].id);
        console.log('Auto-selected contractor:', realContractors[0].id);
      }
      
      // If no contractors are found, just set an empty array
      // This ensures the dropdown is empty until messages are received
      if (realContractors.length === 0) {
        console.log('No contractors found in messages');
      }
    } catch (err) {
      console.error('Error loading contractors:', err);
      setError('Failed to load contractors. Please try again.');
    }
  };
  

  
  // Load data function
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load messages first
      await loadMessages();
      
      // Then create virtual contractors based on message content
      await loadContractors();
      
      // We're not calling assignContractorAliases anymore
      // Instead, we're relying entirely on virtual contractors created from message content
      // This avoids any database constraint violations and authentication issues
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
    console.log('Filtering messages:', messages.length, 'selectedContractorId:', selectedContractorId);
    
    // CRITICAL FIX: Based on the diagnostic data, messages from contractors have a different sender_id
    // than the homeowner's user ID. We can use this to identify contractor messages.
    
    // First, create a consistent mapping of sender IDs to contractor labels
    const senderLabelMap = new Map();
    
    // First pass: find all unique contractor sender IDs
    let contractorCounter = 1;
    messages.forEach(message => {
      // A message is from a contractor if:
      // 1. The sender ID is not the current user's ID AND
      // 2. The isOwn flag is not true (this is important for new messages)
      const isFromContractor = message.senderId !== userId && !message.isOwn;
      
      if (isFromContractor && !senderLabelMap.has(message.senderId)) {
        // Assign sequential numbers to different contractors
        // This ensures each contractor has a unique label
        senderLabelMap.set(message.senderId, String(contractorCounter++));
      }
    });
    
    console.log('Sender to label mapping:', Object.fromEntries(senderLabelMap));
    
    // Process messages to identify contractor messages based on sender_id
    const processedMessages = messages.map(message => {
      // A message is from a contractor if:
      // 1. The sender ID is not the current user's ID AND
      // 2. The isOwn flag is not true (this is important for new messages)
      const isFromContractor = message.senderId !== userId && !message.isOwn;
      
      // Get the consistent label for this sender
      const contractorLabel = isFromContractor ? senderLabelMap.get(message.senderId) : null;
      
      // For debugging
      console.log('Processing message:', {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        isFromContractor,
        isOwn: message.isOwn,
        contractorLabel
      });
      
      return {
        ...message,
        // Keep the original isOwn flag if it exists, otherwise determine based on sender ID
        isOwn: message.isOwn !== undefined ? message.isOwn : !isFromContractor,
        // Store the contractor ID for filtering
        contractorId: message.senderId,
        // Use the consistent contractor label for all messages from the same sender
        senderAlias: contractorLabel || ''
      };
    });
    
    // Filter messages based on selected contractor
    let filteredMessages = processedMessages;
    
    if (selectedContractorId) {
      const selectedContractor = contractors.find(c => c.id === selectedContractorId);
      
      if (selectedContractor) {
        console.log(`Filtering messages for Contractor ${selectedContractor.alias} (ID: ${selectedContractor.id})`);
        
        // IMPORTANT: Only show messages from the selected contractor and the homeowner
        // This ensures each contractor has their own private messaging thread
        filteredMessages = processedMessages.filter(msg => 
          // Include messages from the selected contractor
          msg.contractorId === selectedContractor.id ||
          // Include messages from the homeowner (user)
          msg.isOwn
        );
      }
    }
    
    console.log('Filtered messages:', filteredMessages.length);
    return filteredMessages;
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
              <SelectTrigger className="w-full border border-gray-300 hover:border-gray-400 focus:border-blue-500">
                <SelectValue placeholder={contractors.length === 0 ? "No contractors have messaged yet" : "Select a contractor"} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {contractors.length > 0 ? (
                  contractors.map((contractor) => (
                    <SelectItem 
                      key={contractor.id} 
                      value={contractor.id || ''}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      <span className="font-medium">
                        {/* Always display as Contractor 1 for consistency */}
                        Contractor 1
                      </span>
                      {contractor.bidAmount && ` - $${contractor.bidAmount.toLocaleString()}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-contractors" disabled>
                    No contractors have messaged yet
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedContractorId && contractors.find(c => c.id === selectedContractorId) && (
              <div className="mt-1 text-xs text-green-600">
                Selected: Contractor {contractors.find(c => c.id === selectedContractorId)?.alias || 'A'}
              </div>
            )}
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
                  } mb-4`}
                >
                  <div className="flex items-start max-w-[80%]">
                    {/* Avatar for contractor messages */}
                    {!message.isOwn && (
                      <div className="mr-2 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          1
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col">
                      {/* Sender name for contractor messages */}
                      {!message.isOwn && (
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Contractor 1 <span className="text-xs text-gray-500 font-normal">{new Date(message.timestamp).toLocaleTimeString()}</span>
                        </div>
                      )}
                      
                      {/* Message bubble */}
                      <div 
                        className={`rounded-lg py-2 px-3 ${message.isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                      >
                        {/* Display message content - for contractor messages, remove any prefix */}
                        {!message.isOwn ? 
                          message.content.replace(/^(Contractor\s+\d+|[A-Za-z]\s*|C\s*\d+)\s*/i, '') : 
                          message.content
                        }
                      </div>
                      
                      {/* Timestamp for own messages */}
                      {message.isOwn && (
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                      
                      {/* Attachments */}
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
