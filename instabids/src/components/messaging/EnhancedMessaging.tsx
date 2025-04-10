'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { sendMessage, getMessages, getContractorsForProject } from '@/lib/supabase/messaging';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EnhancedMessagingProps {
  projectId?: string;
}

// This interface must match exactly what getContractorsForProject returns
interface Contractor {
  id: string;
  name: string;
  company?: string | undefined;
  bidAmount?: number | undefined;
  status: 'pending' | 'accepted' | 'rejected';
  avatar?: string | undefined;
}

// This interface must match exactly what getMessages returns
interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export default function EnhancedMessaging({ projectId }: EnhancedMessagingProps) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [setupNeeded, setSetupNeeded] = useState<boolean>(false);

  useEffect(() => {
    async function fetchContractors() {
      try {
        setLoading(true);
        setError(null);
        
        if (projectId) {
          console.log('Fetching contractors for project:', projectId);
          // Fetch real contractors for this project
          const fetchedContractors = await getContractorsForProject(projectId);
          console.log('Fetched contractors:', fetchedContractors);
          
          if (fetchedContractors && fetchedContractors.length > 0) {
            // Type assertion to ensure compatibility
            setContractors(fetchedContractors as Contractor[]);
            // Safely access the first contractor's ID
            if (fetchedContractors[0] && fetchedContractors[0].id) {
              setSelectedContractorId(fetchedContractors[0].id);
            }
          } else {
            // No contractors found for this project
            setContractors([]);
            setSelectedContractorId('');
            setError("No contractors have bid on this project yet.");
          }
        } else {
          // No project ID provided
          setContractors([]);
          setSelectedContractorId('');
          setError("No project ID provided.");
        }
      } catch (error) {
        console.error('Error fetching contractors:', error);
        setContractors([]);
        setSelectedContractorId('');
        
        // Check if the error indicates missing tables
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes("does not exist") || errorMsg.includes("relation") || errorMsg.includes("column")) {
          setSetupNeeded(true);
          setError("Messaging system needs to be set up. Please contact support.");
        } else {
          setError("Failed to load contractors. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchContractors();
  }, [projectId]);

  useEffect(() => {
    async function fetchMessages() {
      if (!selectedContractorId || !projectId) return;
      
      try {
        setError(null);
        console.log('Fetching messages for project:', projectId, 'and contractor:', selectedContractorId);
        // Fetch real messages for this contractor and project
        const fetchedMessages = await getMessages(projectId, selectedContractorId);
        console.log('Fetched messages:', fetchedMessages);
        
        if (fetchedMessages && fetchedMessages.length > 0) {
          setMessages(prev => ({
            ...prev,
            [selectedContractorId]: fetchedMessages
          }));
        } else {
          // No messages found
          setMessages(prev => ({
            ...prev,
            [selectedContractorId]: []
          }));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages(prev => ({
          ...prev,
          [selectedContractorId]: []
        }));
        
        // Check if the error indicates missing tables
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes("does not exist") || errorMsg.includes("relation") || errorMsg.includes("column")) {
          setSetupNeeded(true);
          setError("Messaging system needs to be set up. Please contact support.");
        } else {
          setError("Failed to load messages. Please try again later.");
        }
      }
    }

    fetchMessages();
  }, [selectedContractorId, projectId]);

  // Get messages for the selected contractor
  const contractorMessages = selectedContractorId ? (messages[selectedContractorId] || []) : [];
  const selectedContractor = contractors.find((c) => c.id === selectedContractorId) || null;

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContractorId || !projectId) return;

    setSendingMessage(true);
    setError(null);
    
    try {
      console.log('Sending message to contractor:', selectedContractorId, 'for project:', projectId);
      // Send the message
      const result = await sendMessage(projectId, selectedContractorId, newMessage);
      console.log('Message send result:', result);
      
      if (result && result.id && result.id !== 'error') {
        // Add the new message to the state
        setMessages((prev) => ({
          ...prev,
          [selectedContractorId]: [...(prev[selectedContractorId] || []), result as Message],
        }));

        setNewMessage('');

        toast({
          title: 'Message sent',
          description: 'Your message has been sent successfully.',
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check if the error indicates missing tables
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("does not exist") || errorMsg.includes("relation") || errorMsg.includes("column")) {
        setSetupNeeded(true);
        setError("Messaging system needs to be set up. Please contact support.");
      } else {
        setError("Failed to send message. Please try again later.");
        
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setSendingMessage(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (setupNeeded) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Messaging System Setup Required</AlertTitle>
        <AlertDescription>
          <p className="mb-2">The messaging system needs to be set up in your Supabase database.</p>
          <p className="mb-4">Please contact the development team to set up the required database tables.</p>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Technical Details</summary>
            <p className="mt-2">The following tables need to be created:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>messaging.messages</li>
              <li>messaging.attachments</li>
            </ul>
            <p className="mt-2">Make sure the bids table has a project_id column that references your projects.</p>
          </details>
        </AlertDescription>
      </Alert>
    );
  }

  if (error && contractors.length === 0) {
    return (
      <Alert variant="default" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Contractors Available</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Contractor List */}
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle>Contractors</CardTitle>
          </CardHeader>
          <CardContent>
            {contractors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No contractors available for this project yet.
              </div>
            ) : (
              <div className="space-y-3">
                {contractors.map((contractor) => (
                  <div
                    key={contractor.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedContractorId === contractor.id
                        ? 'bg-blue-50 border-blue-200 border'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => setSelectedContractorId(contractor.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                        {contractor.avatar || '👤'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{contractor.name}</div>
                            <div className="text-xs text-gray-500">{contractor.company || 'Independent Contractor'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {contractor.bidAmount !== undefined
                                ? `$${contractor.bidAmount.toLocaleString()}`
                                : 'No bid yet'}
                            </div>
                            <div
                              className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${getStatusColor(
                                contractor.status
                              )}`}
                            >
                              {contractor.status}
                            </div>
                          </div>
                        </div>
                        {messages[contractor.id]?.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {messages[contractor.id]?.[messages[contractor.id]?.length - 1]?.content ?? ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Thread */}
      <div className="md:col-span-2">
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="pb-3 border-b">
            {selectedContractor ? (
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg mr-2">
                  {selectedContractor?.avatar ?? '👤'}
                </div>
                <div>
                  <CardTitle>{selectedContractor?.name ?? ''}</CardTitle>
                  <div className="text-xs text-gray-500">{selectedContractor?.company ?? 'Independent Contractor'}</div>
                </div>
              </div>
            ) : (
              <CardTitle>Select a contractor to start messaging</CardTitle>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!selectedContractor ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a contractor to view messages
              </div>
            ) : contractorMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                No messages yet. Start the conversation!
              </div>
            ) : (
              contractorMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!message.isOwn && selectedContractor && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg mr-2 self-end">
                      {selectedContractor.avatar ?? '👤'}
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      message.isOwn
                        ? 'bg-blue-500 text-white rounded-tr-none'
                        : 'bg-gray-100 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div
                      className={`text-xs mt-1 ${
                        message.isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                  {message.isOwn && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg ml-2 self-end">
                      👤
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
          <div className="p-4 border-t mt-auto">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={selectedContractor ? "Type your message..." : "Select a contractor to start messaging"}
                className="min-h-[80px] flex-1 resize-none"
                disabled={!selectedContractor || sendingMessage}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !sendingMessage) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!selectedContractor || !newMessage.trim() || sendingMessage}
                className="self-end bg-blue-600 hover:bg-blue-700"
              >
                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
