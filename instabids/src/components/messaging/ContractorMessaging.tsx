'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { 
  ContractorMessagingService, 
  ContractorWithAlias, 
  FormattedMessage 
} from '@/services/ContractorMessagingService';

interface ContractorMessagingProps {
  projectId: string;
  projectTitle?: string;
}

/**
 * ContractorMessaging component for homeowners to message contractors
 * Supports both individual and group messaging with file attachments
 */
export default function ContractorMessaging({ projectId, projectTitle }: ContractorMessagingProps) {
  // Basic state
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [contractors, setContractors] = useState<ContractorWithAlias[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [isGroupMessage, setIsGroupMessage] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  
  // File handling
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // First ensure authentication is set up
        await ContractorMessagingService.ensureAuthentication();
        
        // Get contractors with aliases
        const contractorsData = await ContractorMessagingService.getContractorsWithAliases(projectId);
        
        if (contractorsData && contractorsData.length > 0) {
          setContractors(contractorsData);
          // Set the first contractor as selected by default
          if (contractorsData[0]?.id) {
            setSelectedContractorId(contractorsData[0].id);
          }
        } else {
          // Handle case where no contractors are found
          console.log('No contractors found for this project');
        }
        
        // Get messages
        const messagesData = await ContractorMessagingService.getMessages(projectId);
        
        if (messagesData) {
          // Add unique client IDs to messages for React keys
          const messagesWithClientIds = messagesData.map(message => ({
            ...message,
            clientId: `msg-${message.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          }));
          
          setMessages(messagesWithClientIds);
        } else {
          // Handle case where no messages are found
          setMessages([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading messaging data:', err);
        setError(`Failed to load messaging data: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
        
        // Show toast notification
        toast({
          title: "Error loading messages",
          description: "There was a problem loading the messaging data. Please try again.",
          variant: "destructive"
        });
      }
    }
    
    loadData();
    
    // Set up subscription to new messages
    const unsubscribe = ContractorMessagingService.subscribeToMessages(
      projectId,
      null, // Get all messages for the project
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
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [projectId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Send a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && files.length === 0) return;
    
    if (!isGroupMessage && !selectedContractorId) {
      toast({
        title: 'Error',
        description: 'Please select a contractor to message',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSending(true);
      
      // Send message
      const success = await ContractorMessagingService.sendMessage(
        projectId,
        newMessage,
        isGroupMessage ? 'group' : 'individual',
        isGroupMessage ? null : selectedContractorId,
        files
      );
      
      if (success) {
        // Clear input
        setNewMessage('');
        setFiles([]);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };
  
  // Handle file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Check file size (max 5MB per file)
      const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast({
          title: 'Error',
          description: `Some files exceed the 5MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`,
          variant: 'destructive',
        });
        return;
      }
      
      // Check total files (max 5)
      if (files.length + newFiles.length > 5) {
        toast({
          title: 'Error',
          description: 'You can attach a maximum of 5 files',
          variant: 'destructive',
        });
        return;
      }
      
      setFiles(prev => [...prev, ...newFiles]);
    }
    
    // Reset input
    if (e.target.value) e.target.value = '';
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Toggle between individual and group messaging
  const toggleMessageType = () => {
    setIsGroupMessage(!isGroupMessage);
  };
  
  // Get contractor alias
  const getContractorAlias = async (contractorId: string): Promise<string | null> => {
    if (!contractors || !contractorId) return null;
    
    // Find in local contractors first
    const contractor = contractors.find(c => c.id === contractorId);
    if (contractor) return contractor.alias;
    
    // Otherwise fetch from service
    return await ContractorMessagingService.getContractorAlias(projectId, contractorId);
  };
  
  // Check if we have a valid selected contractor
  const hasValidContractor = selectedContractorId !== '' && contractors.some(c => c.id === selectedContractorId);
  
  // Get contractor display name
  const getContractorDisplay = () => {
    if (!isGroupMessage && hasValidContractor) {
      const contractor = contractors.find(c => c.id === selectedContractorId);
      return contractor ? `Contractor ${contractor.alias}` : '';
    }
    return isGroupMessage ? 'Group Message' : '';
  };
  
  // Render message list
  const renderMessages = () => {
    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
          <span className="text-muted-foreground animate-pulse">Loading messages...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="my-4 border-destructive/20 bg-destructive/10">
          <AlertTitle className="font-semibold">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (messages.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-[300px] text-muted-foreground">
          <span className="h-12 w-12 mb-4 opacity-20">+</span>
          <p className="text-center">No messages yet.</p>
          <p className="text-center text-sm">Start the conversation with your contractors!</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 py-2">
        {messages.map((message) => (
          <div 
            key={message.clientId || `msg-${message.id}-${Math.random().toString(36).substring(2, 9)}`}
            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                message.isOwn 
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/90'
              }`}
            >
              {!message.isOwn && (
                <div className="flex items-center mb-1">
                  <Avatar className="h-6 w-6 mr-2 ring-2 ring-background">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {message.senderAlias?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {message.senderAlias ? `Contractor ${message.senderAlias}` : 'Contractor'}
                  </span>
                </div>
              )}
              
              <p className="text-sm">{message.content}</p>
              
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {message.attachments.map((attachment) => (
                    <div 
                      key={`${message.clientId}-attach-${attachment.id}-${Math.random().toString(36).substring(2, 7)}`}
                      className={`flex items-center text-xs rounded-md p-1.5 ${
                        message.isOwn 
                          ? 'bg-primary-foreground/20' 
                          : 'bg-background/80'
                      }`}
                    >
                      <span className="h-3 w-3 mr-1.5 text-primary/70">+</span>
                      <span className="truncate max-w-[180px]">{attachment.fileName}</span>
                      <span className="ml-1.5 text-[10px] opacity-70">
                        {(attachment.fileSize / 1024).toFixed(0)}KB
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-xs mt-1.5 opacity-70 text-right">
                {ContractorMessagingService.formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };
  
  // Render the component wrapped in an error boundary
  return (
    <ErrorBoundary>
      <Card className="h-[600px] flex flex-col border-none shadow-lg bg-gradient-to-b from-white to-gray-50/50">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg flex justify-between items-center">
            <div className="flex items-center">
              {isGroupMessage ? (
                <span className="h-5 w-5 mr-2 text-primary">+</span>
              ) : (
                <span className="h-5 w-5 mr-2 text-primary">+</span>
              )}
              <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent font-semibold">
                {projectTitle ? `${projectTitle} - ` : ''}
                {getContractorDisplay()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-normal transition-colors duration-200 ${isGroupMessage ? 'text-primary' : 'text-muted-foreground'}`}>
                Group Message
              </span>
              <Switch 
                checked={isGroupMessage} 
                onCheckedChange={toggleMessageType}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-indigo-600"
              />
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/30">
          {renderMessages()}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2 pt-2 border-t bg-gradient-to-b from-transparent to-gray-50/80">
          <div className="flex flex-wrap gap-2 w-full">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-1.5 pr-2 text-xs border border-blue-100 shadow-sm transition-all hover:shadow-md group"
              >
                <span className="h-3 w-3 mr-1.5 text-primary/70">+</span>
                <span className="truncate max-w-[120px]">{file.name}</span>
                <span className="ml-1.5 text-[10px] opacity-70">
                  {(file.size / 1024).toFixed(0)}KB
                </span>
                <Button
                  variant="ghost"
                  className="h-5 w-5 ml-1 p-0 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
                  onClick={() => removeFile(index)}
                >
                  <span className="h-3 w-3">+</span>
                </Button>
              </div>
            ))}
          </div>
          
          {!isGroupMessage && (
            <div className="w-full">
              <Label htmlFor="contractor-select" className="text-xs font-medium text-muted-foreground">
                Select Contractor
              </Label>
              <Select
                value={selectedContractorId}
                onValueChange={setSelectedContractorId}
                disabled={isGroupMessage}
              >
                <SelectTrigger id="contractor-select" className="w-full bg-white/50 border-blue-100 focus:ring-primary/20">
                  <SelectValue placeholder="Select a contractor" />
                </SelectTrigger>
                <SelectContent>
                  {contractors.map((contractor) => (
                    <SelectItem key={contractor.id} value={contractor.id} className="focus:bg-primary/10">
                      <div className="flex items-center">
                        <Avatar className="h-5 w-5 mr-2">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] text-white">
                            {contractor.alias}
                          </AvatarFallback>
                        </Avatar>
                        <span>Contractor {contractor.alias} ({contractor.full_name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex w-full space-x-2">
            <div className="flex-grow">
              <Textarea
                placeholder={`Type a message to ${isGroupMessage ? 'all contractors' : hasValidContractor ? `Contractor ${contractors.find(c => c.id === selectedContractorId)?.alias ?? ''}` : 'selected contractor'}`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[80px] border-blue-100 focus:ring-primary/20 bg-white/80 resize-none"
              />
              <div className="flex justify-between mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  className="border-blue-200 hover:bg-blue-50 hover:text-primary transition-colors"
                >
                  <span className="h-4 w-4 mr-2">+</span>
                  Attach Files
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
              </div>
            </div>
            
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={sending || (newMessage.trim() === '' && files.length === 0)}
              className="self-end bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 transition-all hover:shadow-md disabled:from-gray-300 disabled:to-gray-400"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <span className="h-4 w-4 mr-2">+</span>
              )}
              Send
            </Button>
          </div>
        </CardFooter>
      </Card>
    </ErrorBoundary>
  );
}
