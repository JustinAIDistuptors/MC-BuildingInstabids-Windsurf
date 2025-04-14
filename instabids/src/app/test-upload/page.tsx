'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function TestUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Add log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      addLog(`Selected ${filesArray.length} files`);
    }
  };

  // Create test project
  const createTestProject = async () => {
    try {
      addLog('Creating test project...');
      
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            title: 'Test Project ' + new Date().toISOString(),
            description: 'This is a test project for media upload',
            status: 'published',
            bid_status: 'accepting_bids',
            budget_min: 1000,
            budget_max: 5000,
            city: 'Test City',
            state: 'Test State',
            zip_code: '12345',
            type: 'Test Type',
            job_type_id: 'test',
            job_category_id: 'test',
            property_type: 'residential'
          }
        ])
        .select();
      
      if (error) {
        addLog(`Error creating project: ${error.message}`);
        toast({
          title: 'Error',
          description: `Failed to create test project: ${error.message}`,
          variant: 'destructive',
        });
        return null;
      }
      
      addLog(`Project created with ID: ${data[0].id}`);
      return data[0].id;
    } catch (error: any) {
      addLog(`Unexpected error creating project: ${error.message}`);
      toast({
        title: 'Error',
        description: `Unexpected error: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Upload files
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      addLog('No files selected');
      toast({
        title: 'Warning',
        description: 'Please select files to upload',
        variant: 'default',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadedImages([]);
    
    try {
      // Create a test project first
      const projectId = await createTestProject();
      if (!projectId) {
        setIsUploading(false);
        return;
      }
      
      // Ensure bucket exists
      addLog('Checking if bucket exists...');
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketName = 'projectmedia';
      const hasBucket = buckets?.some((b: any) => b.name === bucketName);
      
      if (!hasBucket) {
        addLog(`Bucket ${bucketName} not found, trying to create it...`);
        try {
          await supabase.storage.createBucket(bucketName, { public: true });
          addLog(`Bucket ${bucketName} created successfully`);
        } catch (bucketError: any) {
          addLog(`Error creating bucket ${bucketName}: ${bucketError.message}`);
          toast({
            title: 'Error',
            description: `Failed to create storage bucket: ${bucketError.message}`,
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }
      } else {
        addLog(`Bucket ${bucketName} exists`);
      }
      
      // Upload each file
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        addLog(`Processing file ${i + 1}/${selectedFiles.length}: ${file.name} (${file.type})`);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}_${i}.${fileExt}`;
        
        addLog(`Uploading to storage path: ${bucketName}/${fileName}`);
        
        try {
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from(bucketName)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (uploadError) {
            addLog(`Error uploading file ${i + 1}: ${uploadError.message}`);
            continue;
          }
          
          addLog(`File ${i + 1} uploaded successfully`);
          
          // Get the public URL
          const { data: publicUrlData } = supabase
            .storage
            .from(bucketName)
            .getPublicUrl(fileName);
          
          if (publicUrlData) {
            addLog(`Public URL for file ${i + 1}: ${publicUrlData.publicUrl}`);
            uploadedUrls.push(publicUrlData.publicUrl);
            
            // Save to project_media table
            const mediaRecord = {
              project_id: projectId,
              media_url: publicUrlData.publicUrl,
              media_type: file.type,
              file_name: file.name,
              created_at: new Date().toISOString()
            };
            
            const { data: mediaSaveData, error: mediaSaveError } = await supabase
              .from('project_media')
              .insert([mediaRecord]);
            
            if (mediaSaveError) {
              addLog(`Error saving media reference ${i + 1}: ${mediaSaveError.message}`);
            } else {
              addLog(`Media reference ${i + 1} saved successfully`);
            }
          }
        } catch (fileError: any) {
          addLog(`Unexpected error uploading file ${i + 1}: ${fileError.message}`);
        }
      }
      
      setUploadedImages(uploadedUrls);
      
      if (uploadedUrls.length > 0) {
        toast({
          title: 'Success',
          description: `Successfully uploaded ${uploadedUrls.length} files`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Warning',
          description: 'No files were uploaded successfully',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      addLog(`Unexpected error during upload process: ${error.message}`);
      toast({
        title: 'Error',
        description: `An unexpected error occurred: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Media Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">1. Select Files</h3>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-sm text-gray-500">
                Selected {selectedFiles.length} files
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">2. Upload Files</h3>
              <Button 
                onClick={uploadFiles} 
                disabled={isUploading || selectedFiles.length === 0}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
            
            {uploadedImages.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">3. Uploaded Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                      <img
                        src={url}
                        alt={`Uploaded image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-2">Logs</h3>
              <div className="bg-gray-100 p-4 rounded-md h-64 overflow-y-auto font-mono text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Toaster />
    </div>
  );
}
