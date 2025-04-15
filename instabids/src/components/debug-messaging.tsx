'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

/**
 * Debug component for messaging system
 * Usage:
 * <DebugMessaging />
 */
export function DebugMessaging() {
  const [logs, setLogs] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const BUCKET_NAME = 'message-attachments';

  useEffect(() => {
    // Add debug styles to console
    console.log(
      '%c📋 Debug Messaging Component Initialized',
      'background: #2563eb; color: white; padding: 2px 4px; border-radius: 2px; font-weight: bold;'
    );
    
    // Check bucket configuration
    checkBucketConfiguration();
    
    // Get recent attachments
    getRecentAttachments();
    
    // Subscribe to changes in the message_attachments table
    const subscription = supabase
      .channel('message-attachments-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_attachments'
      }, (payload: any) => {
        console.group('🔔 New message attachment detected');
        console.log('Attachment data:', payload.new);
        
        // Try to get the public URL for the file
        const filePath = payload.new.file_path;
        
        if (filePath) {
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
            
          addLog(`File URL: ${urlData?.publicUrl || 'unknown'}`);
        }
        
        console.groupEnd();
        
        setAttachments(prev => [payload.new, ...prev].slice(0, 5));
        addLog(`New attachment: ${payload.new.file_name}`);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [`${timestamp} - ${message}`, ...prev].slice(0, 20));
  };
  
  const checkBucketConfiguration = async () => {
    addLog('Checking bucket configuration...');
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addLog(`Error listing buckets: ${bucketsError.message}`);
        return;
      }
      
      if (!buckets) {
        addLog('No buckets returned from API');
        return;
      }
      
      addLog(`Found ${buckets.length} buckets:`);
      
      // Log each bucket
      buckets.forEach((bucket: any) => {
        addLog(`- ${bucket.name} (public: ${bucket.public})`);
      });
      
      // Check if the Message Attachments bucket exists
      const attachmentBucket = buckets.find((b: any) => b.name === BUCKET_NAME);
      
      if (attachmentBucket) {
        addLog(`"${BUCKET_NAME}" bucket exists and is ${attachmentBucket.public ? 'public' : 'private'}`);
        
        // Try to list files in the bucket
        const { data: files, error: filesError } = await supabase.storage
          .from(BUCKET_NAME)
          .list();
          
        if (filesError) {
          addLog(`Error listing files in bucket: ${filesError.message}`);
        } else if (files) {
          addLog(`Found ${files.length} files/folders in the bucket`);
          
          // Log some file details
          files.slice(0, 3).forEach((file: any) => {
            addLog(`  - ${file.name} (${file.metadata?.size || 'unknown size'})`);
          });
        }
      } else {
        addLog(`"${BUCKET_NAME}" bucket does not exist`);
      }
    } catch (error: any) {
      addLog(`Error checking bucket configuration: ${error.message}`);
    }
  };
  
  const getRecentAttachments = async () => {
    addLog('Getting recent attachments...');
    
    try {
      const { data: attachments, error } = await supabase
        .from('message_attachments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        addLog(`Error fetching attachments: ${error.message}`);
        return;
      }
      
      if (!attachments || attachments.length === 0) {
        addLog('No attachments found');
        return;
      }
      
      addLog(`Found ${attachments.length} recent attachments`);
      setAttachments(attachments);
      
      // Try to get public URLs for each attachment
      for (const attachment of attachments) {
        if (attachment.file_path) {
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(attachment.file_path);
            
          attachment.publicUrl = urlData?.publicUrl;
        }
      }
    } catch (error: any) {
      addLog(`Error getting recent attachments: ${error.message}`);
    }
  };
  
  const testFileUpload = async () => {
    addLog('Testing file upload...');
    
    // Create a small test file
    const testContent = 'This is a test file created at ' + new Date().toISOString();
    const testFile = new File([testContent], 'test-file.txt', { type: 'text/plain' });
    
    try {
      // Upload to the bucket
      const timestamp = Date.now();
      const filePath = `test-uploads/test-${timestamp}.txt`;
      
      addLog(`Uploading test file to ${filePath}`);
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, testFile, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        addLog(`Error uploading test file: ${error.message}`);
        return;
      }
      
      addLog('Test file uploaded successfully');
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
        
      addLog(`Public URL: ${urlData?.publicUrl || 'unknown'}`);
    } catch (error: any) {
      addLog(`Error in test upload: ${error.message}`);
    }
  };
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Messaging Debug Panel</h3>
        <div className="space-x-2">
          <button 
            onClick={checkBucketConfiguration}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Check Bucket Config
          </button>
          <button 
            onClick={testFileUpload}
            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            Test File Upload
          </button>
          <button 
            onClick={getRecentAttachments}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
          >
            Refresh Attachments
          </button>
        </div>
      </div>
      
      {/* Debug logs */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-1">Debug Logs</h4>
        <div className="bg-black text-green-400 p-2 rounded h-32 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet</div>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </div>
      
      {/* Recent attachments */}
      <div>
        <h4 className="text-xs font-medium mb-1">Recent Attachments</h4>
        <div className="bg-white border border-gray-200 rounded p-2 h-32 overflow-y-auto text-xs">
          {attachments.length === 0 ? (
            <div className="text-gray-500">No attachments found</div>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded flex justify-between">
                  <div>
                    <div className="font-medium">{attachment.file_name}</div>
                    <div className="text-gray-500 text-xs">{attachment.file_path}</div>
                  </div>
                  {attachment.publicUrl && (
                    <a 
                      href={attachment.publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
