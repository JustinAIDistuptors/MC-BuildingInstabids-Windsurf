'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { getContractorsForProject, getMessages, initializeMessagingSchema, sendMessage } from '@/lib/supabase/messaging';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';

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
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  }>;
}

// Define bucket interface to fix TypeScript errors
interface Bucket {
  id: string;
  name: string;
  public: boolean;
}

// Define URL data interface
interface UrlData {
  publicUrl: string;
}

// Define URL response interface
interface UrlResponse {
  data: UrlData | null;
  error: Error | null;
}

export default function EnhancedMessaging({ projectId = '' }: EnhancedMessagingProps) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [setupNeeded, setSetupNeeded] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug mode
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  useEffect(() => {
    async function fetchContractors() {
      try {
        setLoading(true);
        setError(null);
        
        if (!projectId) {
          setError('No project ID provided');
          setLoading(false);
          return;
        }
        
        // First check if messaging schema is initialized
        const schemaInitialized = await initializeMessagingSchema();
        
        if (!schemaInitialized) {
          setSetupNeeded(true);
          setError('Messaging system needs to be set up');
          setLoading(false);
          return;
        }
        
        // Get contractors for this project
        const contractorsData = await getContractorsForProject(projectId);
        
        if (!contractorsData || contractorsData.length === 0) {
          setContractors([]);
          setError('No contractors available for this project');
          setLoading(false);
          return;
        }
        
        setContractors(contractorsData);
        
        // If there are contractors, select the first one and load messages
        const firstContractorId = contractorsData[0].id;
        setSelectedContractorId(firstContractorId);
          
        // Load messages for the first contractor
        const messagesData = await getMessages(projectId, firstContractorId);
        setMessages(prev => ({
          ...prev,
          [firstContractorId]: messagesData
        }));
      } catch (error: any) {
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchContractors();
    
    // Check bucket configuration in debug mode
    if (debugMode) {
      checkBucketConfiguration();
    }
  }, [projectId, debugMode]);
  
  // Function to check bucket configuration (debug mode)
  const checkBucketConfiguration = async () => {
    addDebugLog('Checking bucket configuration...');
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addDebugLog(`Error listing buckets: ${bucketsError.message}`);
        return;
      }
      
      if (!buckets) {
        addDebugLog('No buckets returned from API');
        return;
      }
      
      addDebugLog(`Found ${buckets.length} buckets:`);
      
      // Log each bucket
      buckets.forEach((bucket: Bucket) => {
        addDebugLog(`- ${bucket.name} (public: ${bucket.public})`);
      });
      
      // Check if our target bucket exists
      const bucketName = 'message-attachments';
      const bucket = buckets.find((b: Bucket) => b.name === bucketName);
      
      if (bucket) {
        addDebugLog(`"${bucketName}" bucket exists and is ${bucket.public ? 'public' : 'private'}`);
        
        // Try to list files in the bucket
        const { data: files, error: filesError } = await supabase.storage
          .from(bucketName)
          .list();
          
        if (filesError) {
          addDebugLog(`Error listing files in bucket: ${filesError.message}`);
        } else if (files) {
          addDebugLog(`Found ${files.length} files/folders in the bucket`);
        }
      } else {
        addDebugLog(`"${bucketName}" bucket does not exist`);
      }
    } catch (error: any) {
      addDebugLog(`Error checking bucket configuration: ${error.message}`);
    }
  };
  
  // Function to test file upload directly (debug mode)
  const testFileUpload = async () => {
    if (selectedFiles.length === 0) {
      addDebugLog('No files selected for test upload');
      return;
    }
    
    // We've already checked that selectedFiles has at least one element
    const file = selectedFiles[0];
    
    if (!file) {
      addDebugLog('File is undefined');
      return;
    }
    
    addDebugLog(`Testing direct file upload for ${file.name} (${file.size} bytes, type: ${file.type})`);
    
    try {
      // First, check if the bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addDebugLog(`Error listing buckets: ${bucketsError.message}`);
        return;
      }
      
      const bucketName = 'message-attachments';
      const bucketExists = buckets && buckets.some((bucket: Bucket) => bucket.name === bucketName);
      
      if (!bucketExists) {
        addDebugLog(`Bucket "${bucketName}" does not exist`);
        return;
      }
      
      addDebugLog(`Bucket "${bucketName}" exists, proceeding with file upload`);
      
      // Generate a test file path
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `test-uploads/${timestamp}_${safeName}`;
      
      addDebugLog(`Uploading to path: ${filePath}`);
      
      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        addDebugLog(`Error uploading file: ${uploadError.message}`);
        toast({
          title: 'Upload Error',
          description: `Failed to upload file: ${uploadError.message}`,
          variant: 'destructive',
        });
      } else if (!uploadData) {
        addDebugLog('Upload completed but no data returned');
        toast({
          title: 'Upload Warning',
          description: 'Upload completed but no data was returned',
          variant: 'destructive',
        });
      } else {
        addDebugLog(`File uploaded successfully to ${uploadData.path}`);
        
        // Get public URL
        const { data: urlData, error: urlError } = await supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath) as UrlResponse;
          
        if (urlError) {
          addDebugLog(`Error getting public URL: ${urlError.message}`);
        } else if (urlData) {
          addDebugLog(`Public URL: ${urlData.publicUrl}`);
          
          // Try to fetch the file to verify it's accessible
          try {
            const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
            addDebugLog(`File accessibility check: ${response.status} ${response.statusText}`);
          } catch (fetchError: any) {
            addDebugLog(`Error checking file accessibility: ${fetchError.message}`);
          }
        }
        
        toast({
          title: 'Upload Success',
          description: 'File uploaded successfully',
        });
      }
    } catch (error: any) {
      addDebugLog(`Error in test upload: ${error.message}`);
      toast({
        title: 'Upload Error',
        description: `An unexpected error occurred: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    // Convert FileList to array and store
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    
    if (debugMode) {
      fileArray.forEach(file => {
        addDebugLog(`Selected file: ${file.name} (${file.size} bytes, type: ${file.type})`);
      });
    }
  };

  // Function to remove a selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Function to select a contractor and load their messages
  const selectContractor = async (contractorId: string) => {
    setSelectedContractorId(contractorId);
    
    // Check if we already have messages for this contractor
    if (!messages[contractorId]) {
      try {
        if (!projectId) {
          setError('No project ID provided');
          return;
        }
        
        // Load messages for this contractor
        const messagesData = await getMessages(projectId, contractorId);
        setMessages(prev => ({
          ...prev,
          [contractorId]: messagesData
        }));
      } catch (error: any) {
        setError(error.message || 'An error occurred loading messages');
      }
    }
  };

  // Function to send a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter a message or select a file to send',
        variant: 'destructive',
      });
      return;
    }
    
    if (!projectId || !selectedContractorId) {
      toast({
        title: 'Error',
        description: 'Missing project ID or contractor ID',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSendingMessage(true);
      
      if (debugMode) {
        addDebugLog(`Sending message to contractor ${selectedContractorId} with ${selectedFiles.length} attachments`);
      }
      
      // Send the message
      const success = await sendMessage(
        projectId,
        selectedContractorId,
        newMessage.trim(),
        selectedFiles
      );
      
      if (success) {
        // Clear the message input
        setNewMessage('');
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Reload messages for this contractor
        const messagesData = await getMessages(projectId, selectedContractorId);
        setMessages(prev => ({
          ...prev,
          [selectedContractorId]: messagesData
        }));
        
        if (debugMode) {
          addDebugLog('Message sent successfully');
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send message',
          variant: 'destructive',
        });
        
        if (debugMode) {
          addDebugLog('Failed to send message');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
      
      if (debugMode) {
        addDebugLog(`Error sending message: ${error.message}`);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  // Function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to check if a file is an image
  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (setupNeeded) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Setup Required</AlertTitle>
        <AlertDescription>
          The messaging system needs to be set up. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Contractors List */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Contractors</CardTitle>
          </CardHeader>
          <CardContent>
            {contractors.length === 0 ? (
              <p className="text-muted-foreground">No contractors available</p>
            ) : (
              <div className="space-y-2">
                {contractors.map((contractor) => (
                  <Button
                    key={contractor.id}
                    variant={selectedContractorId === contractor.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => selectContractor(contractor.id)}
                  >
                    <div className="truncate">
                      <span className="font-medium">{contractor.name}</span>
                      {contractor.company && (
                        <span className="text-xs text-muted-foreground block truncate">
                          {contractor.company}
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Debug Controls */}
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setDebugMode(!debugMode)}
          >
            {debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
          </Button>
          
          {debugMode && (
            <div className="mt-2 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={checkBucketConfiguration}
              >
                Check Bucket Config
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={testFileUpload}
                disabled={selectedFiles.length === 0}
              >
                Test File Upload
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="md:col-span-3">
        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle>
              {selectedContractorId
                ? `Messages with ${contractors.find(c => c.id === selectedContractorId)?.name || 'Contractor'}`
                : 'Select a contractor'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {selectedContractorId && messages[selectedContractorId]?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedContractorId && messages[selectedContractorId]?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isOwn ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="mb-1">{message.content}</div>
                        
                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2">
                                {isImageFile(attachment.fileType) ? (
                                  <div className="relative h-32 w-full">
                                    <img
                                      src={attachment.fileUrl}
                                      alt={attachment.fileName}
                                      className="rounded-md object-contain h-full w-full"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 bg-background/50 rounded p-2">
                                    <span className="text-sm truncate">{attachment.fileName}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-xs opacity-70 text-right mt-1">
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Input */}
            {selectedContractorId && (
              <div className="space-y-2">
                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-1 bg-muted rounded-full pl-2 pr-1 py-1">
                        {file.type.startsWith('image/') ? (
                          <span className="h-3 w-3">📷</span>
                        ) : (
                          <span className="h-3 w-3">📄</span>
                        )}
                        <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                        <Button
                          variant="ghost"
                          className="h-4 w-4 rounded-full"
                          onClick={() => removeFile(index)}
                        >
                          <span className="h-3 w-3">✕</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      multiple
                    />
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="h-4 w-4">📎</span>
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (!newMessage.trim() && selectedFiles.length === 0)}
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Debug Logs */}
        {debugMode && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-2 rounded h-40 overflow-y-auto font-mono text-xs">
                {debugLogs.length === 0 ? (
                  <p className="text-muted-foreground">No logs yet</p>
                ) : (
                  debugLogs.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
