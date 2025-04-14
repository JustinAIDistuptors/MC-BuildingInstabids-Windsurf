'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ContractorMessagingService, ContractorWithAlias, FormattedMessage } from '@/services/ContractorMessagingService';

// Export the props interface so it can be reused by other components
export interface SimpleMessagingProps {
  projectId: string;
  projectTitle?: string;
}

/**
 * A simplified version of the contractor messaging component
 * that doesn't rely on complex UI components
 */
export default function SimpleMessaging({ projectId, projectTitle }: SimpleMessagingProps) {
  // State
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [contractors, setContractors] = useState<ContractorWithAlias[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [isGroupMessage, setIsGroupMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Get contractors
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
    
    // Set up localStorage event listener for fallback real-time updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `messages_${projectId}` && e.newValue) {
        try {
          const newMessages = JSON.parse(e.newValue);
          // Get only new messages
          const existingIds = new Set(messages.map(m => m.id));
          const messagesToAdd = newMessages.filter((m: any) => !existingIds.has(m.id));
          
          if (messagesToAdd.length > 0) {
            setMessages(prev => [...prev, ...messagesToAdd]);
          }
        } catch (error) {
          console.error('Error processing storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [projectId]); // Remove messages from dependency array to avoid infinite loop
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Check file size (max 5MB per file)
      const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError(`Some files exceed the 5MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
        return;
      }
      
      // Check total files (max 5)
      if (files.length + newFiles.length > 5) {
        setError('You can attach a maximum of 5 files');
        return;
      }
      
      // Check file types - only allow images and common document types
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      const invalidFiles = newFiles.filter(file => !allowedTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        setError(`Some files have unsupported formats: ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
      }
      
      // Initialize upload progress for new files
      const newProgress = { ...uploadProgress };
      newFiles.forEach(file => {
        newProgress[file.name] = 0;
      });
      setUploadProgress(newProgress);
      
      setFiles(prev => [...prev, ...newFiles]);
      setError(null); // Clear any previous errors
    }
    
    // Reset input
    if (e.target.value) e.target.value = '';
  };
  
  // Send a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && files.length === 0) return;
    
    try {
      setSending(true);
      setUploadStatus('uploading');
      
      // Create a mock progress update for UI feedback
      if (files.length > 0) {
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const updated = { ...prev };
            files.forEach(file => {
              // Simulate progress up to 90% (the final 10% will happen when actually complete)
              if (updated[file.name] < 90) {
                updated[file.name] += Math.floor(Math.random() * 10) + 1;
                if (updated[file.name] > 90) updated[file.name] = 90;
              }
            });
            return updated;
          });
        }, 300);
        
        // Send message
        const success = await ContractorMessagingService.sendMessage(
          projectId,
          newMessage,
          isGroupMessage ? 'group' : 'individual',
          isGroupMessage ? null : selectedContractorId,
          files
        );
        
        clearInterval(progressInterval);
        
        if (success) {
          // Set all progress to 100%
          const finalProgress = { ...uploadProgress };
          files.forEach(file => {
            finalProgress[file.name] = 100;
          });
          setUploadProgress(finalProgress);
          setUploadStatus('success');
          
          // Clear input
          setNewMessage('');
          setFiles([]);
          
          // Reset upload progress after a delay
          setTimeout(() => {
            setUploadProgress({});
            setUploadStatus('idle');
          }, 2000);
          
          // Refresh messages (for localStorage fallback)
          const refreshedMessages = await ContractorMessagingService.getMessages(projectId);
          
          // Ensure each message has a unique clientId for React keys
          const messagesWithClientIds = refreshedMessages.map(message => ({
            ...message,
            clientId: `msg-${message.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          }));
          
          setMessages(messagesWithClientIds);
        } else {
          setUploadStatus('error');
          setError('Failed to send message. Please try again.');
        }
      } else {
        // No files, just send the message
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
          
          // Refresh messages (for localStorage fallback)
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
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setUploadStatus('error');
      setError(`Failed to send message: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSending(false);
    }
  };
  
  // Toggle message type
  const toggleMessageType = () => {
    setIsGroupMessage(!isGroupMessage);
  };
  
  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  // Remove file
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // File preview component
  const FilePreview = ({ file, index }: { file: File, index: number }) => {
    const isImage = file.type.startsWith('image/');
    const progress = uploadProgress[file.name] || 0;
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    
    // Clean up object URL on unmount
    useEffect(() => {
      if (previewUrl) {
        return () => {
          URL.revokeObjectURL(previewUrl);
        };
      }
      return undefined;
    }, [previewUrl]);
    
    return (
      <div style={styles.fileItem}>
        {isImage && previewUrl ? (
          <div style={styles.imagePreview}>
            <img src={previewUrl} alt={file.name} style={styles.previewImage} />
          </div>
        ) : (
          <div style={styles.fileIcon}>
            {file.type.includes('pdf') ? '📄' : 
             file.type.includes('word') ? '📝' : 
             file.type.includes('excel') ? '📊' : '📎'}
          </div>
        )}
        <div style={styles.fileInfo}>
          <div style={styles.fileName}>{file.name}</div>
          <div style={styles.fileSize}>{formatFileSize(file.size)}</div>
          {uploadStatus !== 'idle' && (
            <div style={styles.progressBarContainer}>
              <div 
                style={{
                  ...styles.progressBar,
                  width: `${progress}%`,
                  backgroundColor: uploadStatus === 'error' ? '#ff4d4f' : 
                                  uploadStatus === 'success' ? '#52c41a' : '#1890ff'
                }}
              />
            </div>
          )}
        </div>
        <button 
          type="button"
          style={styles.removeButton}
          onClick={() => removeFile(index)}
          disabled={sending}
          aria-label="Remove file"
        >
          ×
        </button>
      </div>
    );
  };
  
  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Styles
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      height: '600px',
      backgroundColor: '#fff',
    },
    header: {
      padding: '12px 16px',
      borderBottom: '1px solid #ddd',
      backgroundColor: '#f9f9f9',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      margin: 0,
      fontSize: '16px',
      fontWeight: 'bold' as const,
    },
    toggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    messagesContainer: {
      flexGrow: 1,
      padding: '16px',
      overflowY: 'auto' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    message: (isOwn: boolean) => ({
      maxWidth: '80%',
      alignSelf: isOwn ? 'flex-end' as const : 'flex-start' as const,
      padding: '8px 12px',
      borderRadius: '8px',
      backgroundColor: isOwn ? '#e6f7ff' : '#f5f5f5',
    }),
    messageHeader: {
      fontSize: '12px',
      color: '#666',
      marginBottom: '4px',
    },
    messageContent: {
      margin: 0,
      wordBreak: 'break-word' as const,
    },
    messageTime: {
      fontSize: '11px',
      color: '#999',
      marginTop: '4px',
      textAlign: 'right' as const,
    },
    attachments: {
      marginTop: '8px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    attachment: {
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    attachmentLink: {
      color: '#0070f3',
      textDecoration: 'underline',
    },
    footer: {
      padding: '12px 16px',
      borderTop: '1px solid #ddd',
      backgroundColor: '#f9f9f9',
    },
    contractorSelect: {
      width: '100%',
      padding: '8px',
      marginBottom: '8px',
      borderRadius: '4px',
      border: '1px solid #ddd',
    },
    inputContainer: {
      display: 'flex',
      gap: '8px',
      flexDirection: 'column' as const,
    },
    input: {
      flexGrow: 1,
      padding: '8px 12px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      resize: 'none' as const,
      minHeight: '80px',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    button: (primary: boolean = false) => ({
      padding: '8px 16px',
      backgroundColor: primary ? '#0070f3' : '#f5f5f5',
      color: primary ? 'white' : '#333',
      border: primary ? 'none' : '1px solid #ddd',
      borderRadius: '4px',
      cursor: 'pointer' as const,
    }),
    fileList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      marginBottom: '12px',
      maxHeight: '150px',
      overflowY: 'auto' as const,
    },
    fileItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px',
      borderRadius: '4px',
      backgroundColor: '#f5f5f5',
      position: 'relative' as const,
    },
    fileIcon: {
      fontSize: '24px',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e6f7ff',
      borderRadius: '4px',
    },
    imagePreview: {
      width: '40px',
      height: '40px',
      borderRadius: '4px',
      overflow: 'hidden',
    },
    previewImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
    fileInfo: {
      flexGrow: 1,
      overflow: 'hidden',
    },
    fileName: {
      fontSize: '14px',
      fontWeight: 'bold' as const,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis' as const,
    },
    fileSize: {
      fontSize: '12px',
      color: '#666',
    },
    progressBarContainer: {
      width: '100%',
      height: '4px',
      backgroundColor: '#eee',
      borderRadius: '2px',
      marginTop: '4px',
    },
    progressBar: {
      height: '100%',
      borderRadius: '2px',
      transition: 'width 0.3s ease-in-out',
    },
    removeButton: {
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      border: 'none',
      backgroundColor: '#ff4d4f',
      color: 'white',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer' as const,
      padding: 0,
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
    error: {
      padding: '16px',
      margin: '16px',
      backgroundColor: '#fee',
      border: '1px solid #f99',
      borderRadius: '4px',
    },
    emptyState: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      color: '#999',
    },
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {projectTitle ? `${projectTitle} - ` : ''}
          {isGroupMessage ? 'Group Message' : `Message to Contractor ${contractors.find(c => c.id === selectedContractorId)?.alias || ''}`}
        </h2>
        <div style={styles.toggle}>
          <span>Group Message</span>
          <input
            type="checkbox"
            checked={isGroupMessage}
            onChange={toggleMessageType}
          />
        </div>
      </div>
      
      <div style={styles.messagesContainer}>
        {loading ? (
          <div style={styles.loading}>Loading messages...</div>
        ) : error ? (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyState}>No messages yet. Start the conversation!</div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.clientId || `msg-${message.id}-${Math.random().toString(36).substring(2, 9)}`} style={styles.message(message.isOwn)}>
                {!message.isOwn && (
                  <div style={styles.messageHeader}>
                    {message.senderAlias || 'Unknown'}
                  </div>
                )}
                <p style={styles.messageContent}>{message.content}</p>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div style={styles.attachments}>
                    {message.attachments.map((attachment, attachIndex) => (
                      <div key={`${message.clientId}-attach-${attachment.id || attachIndex}-${Math.random().toString(36).substring(2, 7)}`} style={styles.attachment}>
                        <span>📎</span>
                        <a 
                          href={attachment.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={styles.attachmentLink}
                        >
                          {attachment.fileName}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={styles.messageTime}>
                  {ContractorMessagingService.formatTimestamp(message.timestamp)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div style={styles.footer}>
        {!isGroupMessage && (
          <select
            value={selectedContractorId}
            onChange={(e) => setSelectedContractorId(e.target.value)}
            disabled={isGroupMessage}
            style={styles.contractorSelect}
          >
            <option value="" disabled>Select a contractor</option>
            {contractors.map((contractor) => (
              <option key={contractor.id} value={contractor.id}>
                Contractor {contractor.alias} ({contractor.full_name})
              </option>
            ))}
          </select>
        )}
        
        {files.length > 0 && (
          <div style={styles.fileList}>
            {files.map((file, index) => (
              <FilePreview key={index} file={file} index={index} />
            ))}
          </div>
        )}
        
        <div style={styles.inputContainer}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Type a message to ${isGroupMessage ? 'all contractors' : `Contractor ${contractors.find(c => c.id === selectedContractorId)?.alias || ''}`}`}
            style={styles.input}
          />
          
          <div style={styles.buttonContainer}>
            <button 
              onClick={handleFileSelect}
              style={styles.button()}
              disabled={sending}
            >
              📎 Attach Files
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            
            <button
              onClick={handleSendMessage}
              disabled={sending || (newMessage.trim() === '' && files.length === 0)}
              style={{
                ...styles.button(true),
                opacity: sending || (newMessage.trim() === '' && files.length === 0) ? 0.7 : 1,
                cursor: sending || (newMessage.trim() === '' && files.length === 0) ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
