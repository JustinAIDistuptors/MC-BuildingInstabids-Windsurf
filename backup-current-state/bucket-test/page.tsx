'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BucketTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [testFile, setTestFile] = useState<File | null>(null);
  const [uploadPath, setUploadPath] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Add a log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [`${timestamp} - ${message}`, ...prev]);
    console.log(`${timestamp} - ${message}`);
  };

  // List all buckets
  const listBuckets = async () => {
    addLog('Listing buckets...');
    try {
      const { data, error } = await supabaseAdmin.storage.listBuckets();
      
      if (error) {
        addLog(`Error listing buckets: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        addLog('No buckets found');
        return;
      }
      
      addLog(`Found ${data.length} buckets`);
      setBuckets(data);
      
      // Log each bucket
      data.forEach((bucket: any) => {
        addLog(`- ${bucket.name} (public: ${bucket.public})`);
      });
    } catch (error: any) {
      addLog(`Exception listing buckets: ${error.message}`);
    }
  };

  // Create a test file
  const createTestFile = () => {
    const content = 'This is a test file created at ' + new Date().toISOString();
    const file = new File([content], 'test-file.txt', { type: 'text/plain' });
    setTestFile(file);
    addLog(`Created test file: ${file.name} (${file.size} bytes)`);
  };

  // Upload test file to selected bucket
  const uploadTestFile = async () => {
    if (!selectedBucket) {
      addLog('No bucket selected');
      return;
    }
    
    if (!testFile) {
      addLog('No test file created');
      return;
    }
    
    const timestamp = Date.now();
    const path = `test-uploads/test-${timestamp}.txt`;
    setUploadPath(path);
    
    addLog(`Uploading test file to bucket "${selectedBucket}" at path "${path}"...`);
    
    try {
      // Direct upload without any extra checks
      const { data, error } = await supabaseAdmin.storage
        .from(selectedBucket)
        .upload(path, testFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        addLog(`Error uploading file: ${error.message}`);
        setUploadResult({ success: false, error });
        return;
      }
      
      addLog('File uploaded successfully');
      setUploadResult({ success: true, data });
      
      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(selectedBucket)
        .getPublicUrl(path);
      
      addLog(`Public URL: ${urlData?.publicUrl}`);
    } catch (error: any) {
      addLog(`Exception during upload: ${error.message}`);
      setUploadResult({ success: false, error: { message: error.message } });
    }
  };

  // List files in selected bucket
  const listFiles = async () => {
    if (!selectedBucket) {
      addLog('No bucket selected');
      return;
    }
    
    addLog(`Listing files in bucket "${selectedBucket}"...`);
    
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(selectedBucket)
        .list();
      
      if (error) {
        addLog(`Error listing files: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        addLog('No files found in bucket');
        return;
      }
      
      addLog(`Found ${data.length} files/folders in bucket`);
      
      // Log each file
      data.forEach((item: any) => {
        addLog(`- ${item.name} (${item.metadata?.size || 'unknown size'})`);
      });
    } catch (error: any) {
      addLog(`Exception listing files: ${error.message}`);
    }
  };

  // Initialize
  useEffect(() => {
    addLog('Bucket Test Page Initialized');
    
    // Check Supabase connection
    addLog(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    addLog(`Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Missing'}`);
    
    // List buckets on load
    listBuckets();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Supabase Storage Bucket Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bucket Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Available Buckets</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {buckets.map((bucket) => (
                  <Button
                    key={bucket.name}
                    variant={selectedBucket === bucket.name ? 'default' : 'outline'}
                    onClick={() => setSelectedBucket(bucket.name)}
                  >
                    {bucket.name}
                  </Button>
                ))}
              </div>
              <Button onClick={listBuckets} variant="outline">Refresh Buckets</Button>
            </div>
            
            {selectedBucket && (
              <div>
                <h3 className="text-lg font-medium mb-2">Selected Bucket: {selectedBucket}</h3>
                <div className="space-x-2">
                  <Button onClick={listFiles} variant="outline">List Files</Button>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-2">Test File Upload</h3>
              <div className="space-y-2">
                <Button onClick={createTestFile} variant="outline">Create Test File</Button>
                {testFile && (
                  <div className="mt-2">
                    <p className="text-sm">Test file ready: {testFile.name} ({testFile.size} bytes)</p>
                    <Button 
                      onClick={uploadTestFile} 
                      disabled={!selectedBucket || !testFile}
                      className="mt-2"
                    >
                      Upload to {selectedBucket || 'selected bucket'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {uploadResult && (
              <div className={`p-4 rounded-md ${uploadResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <h3 className="font-medium">{uploadResult.success ? 'Upload Successful' : 'Upload Failed'}</h3>
                {uploadResult.success ? (
                  <p>File uploaded to path: {uploadPath}</p>
                ) : (
                  <p>Error: {uploadResult.error.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-md h-[500px] overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
