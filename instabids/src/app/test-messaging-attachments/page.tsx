'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

export default function TestMessagingAttachments() {
  const [projectId, setProjectId] = useState('00000000-0000-0000-0000-000000000000');
  const [senderId, setSenderId] = useState('');
  const [recipientId, setRecipientId] = useState('00000000-0000-0000-0000-000000000001');
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();
  
  // Add a log function that both logs to console and to our UI
  const log = (message: string) => {
    console.log(message);
    setLogMessages(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };
  
  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSenderId(session.user.id);
        log(`Current user: ${session.user.id}`);
      } else {
        log('No authenticated user found');
      }
    };
    
    // List buckets
    const listBuckets = async () => {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        log(`Error listing buckets: ${error.message}`);
      } else {
        setBuckets(data || []);
        log(`Found ${data?.length || 0} buckets`);
        data?.forEach(bucket => {
          log(`- ${bucket.name} (public: ${bucket.public})`);
        });
      }
    };
    
    // Load messages
    const loadMessages = async () => {
      if (!projectId) return;
      
      log(`Loading messages for project: ${projectId}`);
      const { data, error } = await supabase
        .from('messages')
        .select('*, message_attachments(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        log(`Error loading messages: ${error.message}`);
      } else {
        log(`Loaded ${data?.length || 0} messages`);
        setMessages(data || []);
      }
    };
    
    getUser();
    listBuckets();
    loadMessages();
    
    // Subscribe to new messages
    const subscription = supabase
      .channel('messages-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        log(`New message received: ${payload.new.id}`);
        loadMessages();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_attachments'
      }, (payload) => {
        log(`New attachment received: ${payload.new.id}`);
        loadMessages();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      log(`Selected ${selectedFiles.length} files: ${selectedFiles.map(f => f.name).join(', ')}`);
    }
  };
  
  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive'
      });
      return;
    }
    
    if (!senderId) {
      toast({
        title: 'Error',
        description: 'No sender ID available',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    log(`Sending message to ${recipientId} with ${files.length} attachments`);
    
    try {
      // First insert the message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          project_id: projectId,
          sender_id: senderId,
          recipient_id: recipientId,
          content: messageContent,
          message_type: 'individual'
        })
        .select();
        
      if (messageError) {
        log(`Error sending message: ${messageError.message}`);
        toast({
          title: 'Error',
          description: `Failed to send message: ${messageError.message}`,
          variant: 'destructive'
        });
        return;
      }
      
      const messageId = messageData[0].id;
      log(`Message sent successfully with ID: ${messageId}`);
      
      // Handle file uploads if any
      if (files.length > 0) {
        log(`Uploading ${files.length} files for message ${messageId}`);
        
        const BUCKET_NAME = 'message-attachments';
        
        for (const file of files) {
          // Create a unique file path
          const timestamp = new Date().getTime();
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filePath = `uploads/${messageId}/${timestamp}_${safeName}`;
          
          log(`Uploading file: ${file.name} (${file.size} bytes) to path: ${filePath}`);
          
          // Upload the file
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            log(`Error uploading file: ${uploadError.message}`);
            continue;
          }
          
          log(`File uploaded successfully: ${filePath}`);
          
          // Get public URL
          const { data: urlData } = await supabase.storage
            .from('message-attachments')
            .getPublicUrl(filePath);
            
          log(`Public URL: ${urlData?.publicUrl}`);
          
          // Insert attachment record
          const { data: attachmentData, error: attachmentError } = await supabase
            .from('message_attachments')
            .insert({
              message_id: messageId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type
            })
            .select();
            
          if (attachmentError) {
            log(`Error saving attachment record: ${attachmentError.message}`);
          } else {
            log(`Attachment record saved: ${attachmentData[0].id}`);
          }
        }
      }
      
      // Clear form
      setMessageContent('');
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: 'Success',
        description: 'Message sent successfully'
      });
      
    } catch (error: any) {
      log(`Unexpected error: ${error.message}`);
      toast({
        title: 'Error',
        description: `An unexpected error occurred: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getFileUrl = (attachment: any) => {
    if (!attachment) return '';
    
    // Try to generate URL from file_path
    if (attachment.file_path) {
      const { data } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(attachment.file_path);
      return data?.publicUrl || '';
    }
    
    // Fallback to file_url if present
    return attachment.file_url || '';
  };
  
  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Messaging Attachments</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project ID</label>
                  <Input
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="Project ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient ID</label>
                  <Input
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    placeholder="Recipient ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Attachments</label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    className="mb-2"
                  />
                  {files.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {files.length} file(s) selected: {files.map(f => f.name).join(', ')}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !messageContent.trim() || !senderId}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Storage Buckets</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1">
                {buckets.map((bucket) => (
                  <li key={bucket.id}>
                    {bucket.name} {bucket.public ? '(public)' : '(private)'}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-2 rounded h-60 overflow-y-auto font-mono text-xs">
                {logMessages.map((msg, index) => (
                  <div key={index} className="mb-1">{msg}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-gray-500">No messages yet</p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="border rounded p-3">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">
                          From: {message.sender_id === senderId ? 'You' : message.sender_id.substring(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(message.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="mb-2">{message.content}</div>
                      
                      {message.message_attachments && message.message_attachments.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium mb-1">Attachments:</div>
                          <div className="grid grid-cols-2 gap-2">
                            {message.message_attachments.map((attachment: any) => {
                              const fileUrl = getFileUrl(attachment);
                              return (
                                <div key={attachment.id} className="border rounded p-2">
                                  {isImageFile(attachment.file_type) ? (
                                    <div className="relative h-24 w-full mb-1">
                                      <img
                                        src={fileUrl}
                                        alt={attachment.file_name}
                                        className="object-contain h-full w-full"
                                      />
                                    </div>
                                  ) : (
                                    <div className="bg-gray-100 h-24 flex items-center justify-center">
                                      <span className="text-sm">{attachment.file_type}</span>
                                    </div>
                                  )}
                                  <div className="text-xs truncate">{attachment.file_name}</div>
                                  <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline"
                                  >
                                    Download
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
