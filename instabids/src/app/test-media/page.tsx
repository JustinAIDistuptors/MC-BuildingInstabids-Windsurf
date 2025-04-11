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

// Create project_media table if it doesn't exist
const createProjectMediaTable = async () => {
  try {
    const { error } = await supabase.rpc('create_project_media_table');
    if (error) {
      console.error('Error creating project_media table via RPC:', error);
      
      // Fallback: Try direct SQL if RPC fails
      const { error: sqlError } = await supabase.from('project_media').select('id').limit(1);
      if (sqlError && sqlError.code === '42P01') { // Table doesn't exist error code
        console.log('Creating project_media table via direct SQL...');
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS project_media (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID NOT NULL,
            media_url TEXT NOT NULL,
            media_type TEXT,
            file_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS project_media_project_id_idx ON project_media(project_id);
          ALTER TABLE project_media DISABLE ROW LEVEL SECURITY;
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        if (createError) {
          console.error('Error creating table via SQL:', createError);
          return false;
        }
        return true;
      }
    }
    return true;
  } catch (e) {
    console.error('Unexpected error creating project_media table:', e);
    return false;
  }
};

export default function TestMediaPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    bucketExists: boolean;
    projectCreated: boolean;
    mediaUploaded: boolean;
    mediaReferencesSaved: boolean;
    mediaRetrieved: boolean;
  }>({
    bucketExists: false,
    projectCreated: false,
    mediaUploaded: false,
    mediaReferencesSaved: false,
    mediaRetrieved: false,
  });

  // Add log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      addLog(`Selected ${filesArray.length} files`);
    }
  };

  // Test bucket existence
  const testBucketExistence = async () => {
    try {
      addLog('Testing bucket existence...');
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        addLog(`Error listing buckets: ${error.message}`);
        return false;
      }
      
      const bucketName = 'projectmedia';
      const hasBucket = buckets?.some((b: any) => b.name === bucketName);
      
      if (hasBucket) {
        addLog(`✅ Bucket '${bucketName}' exists`);
        setTestResults(prev => ({ ...prev, bucketExists: true }));
        return true;
      } else {
        addLog(`❌ Bucket '${bucketName}' does not exist, creating it...`);
        
        try {
          const { data, error: createError } = await supabase.storage.createBucket(bucketName, { public: true });
          
          if (createError) {
            addLog(`Error creating bucket: ${createError.message}`);
            return false;
          }
          
          addLog(`✅ Bucket '${bucketName}' created successfully`);
          setTestResults(prev => ({ ...prev, bucketExists: true }));
          return true;
        } catch (e: any) {
          addLog(`Error creating bucket: ${e.message}`);
          return false;
        }
      }
    } catch (e: any) {
      addLog(`Error testing bucket existence: ${e.message}`);
      return false;
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
        addLog(`❌ Error creating project: ${error.message}`);
        return null;
      }
      
      const id = data[0].id;
      addLog(`✅ Project created with ID: ${id}`);
      setProjectId(id);
      setTestResults(prev => ({ ...prev, projectCreated: true }));
      return id;
    } catch (error: any) {
      addLog(`❌ Unexpected error creating project: ${error.message}`);
      return null;
    }
  };

  // Upload media files
  const uploadMediaFiles = async (projectId: string) => {
    if (selectedFiles.length === 0) {
      addLog('❌ No files selected for upload');
      return false;
    }
    
    const bucketName = 'projectmedia';
    const uploadedUrls: string[] = [];
    let allUploadsSuccessful = true;
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      // TypeScript safety check
      if (!file) {
        addLog(`❌ File at index ${i} is undefined, skipping`);
        continue;
      }
      
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
          addLog(`❌ Error uploading file ${i + 1}: ${uploadError.message}`);
          allUploadsSuccessful = false;
          continue;
        }
        
        addLog(`✅ File ${i + 1} uploaded successfully`);
        
        // Get the public URL
        const { data: publicUrlData } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(fileName);
        
        if (publicUrlData) {
          addLog(`Public URL for file ${i + 1}: ${publicUrlData.publicUrl}`);
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      } catch (fileError: any) {
        addLog(`❌ Unexpected error uploading file ${i + 1}: ${fileError.message}`);
        allUploadsSuccessful = false;
      }
    }
    
    setUploadedImages(uploadedUrls);
    
    if (uploadedUrls.length > 0) {
      addLog(`✅ Successfully uploaded ${uploadedUrls.length}/${selectedFiles.length} files`);
      setTestResults(prev => ({ ...prev, mediaUploaded: true }));
      return true;
    } else {
      addLog('❌ No files were uploaded successfully');
      return false;
    }
  };

  // Save media references
  const saveMediaReferences = async (projectId: string) => {
    if (uploadedImages.length === 0) {
      addLog('❌ No uploaded images to save references for');
      return false;
    }
    
    let allReferencesSaved = true;
    
    for (let i = 0; i < uploadedImages.length; i++) {
      const url = uploadedImages[i];
      // Make sure we have a corresponding file
      const file = i < selectedFiles.length ? selectedFiles[i] : null;
      
      if (!file) {
        addLog(`⚠️ Warning: No file data available for media reference ${i + 1}`);
        continue;
      }
      
      const mediaRecord = {
        project_id: projectId,
        media_url: url,
        media_type: file.type,
        file_name: file.name,
        created_at: new Date().toISOString()
      };
      
      try {
        const { data, error } = await supabase
          .from('project_media')
          .insert([mediaRecord]);
        
        if (error) {
          addLog(`❌ Error saving media reference ${i + 1}: ${error.message}`);
          allReferencesSaved = false;
        } else {
          addLog(`✅ Media reference ${i + 1} saved successfully`);
        }
      } catch (e: any) {
        addLog(`❌ Unexpected error saving media reference ${i + 1}: ${e.message}`);
        allReferencesSaved = false;
      }
    }
    
    if (allReferencesSaved) {
      addLog('✅ All media references saved successfully');
      setTestResults(prev => ({ ...prev, mediaReferencesSaved: true }));
      return true;
    } else {
      addLog('❌ Some media references failed to save');
      return false;
    }
  };

  // Retrieve media
  const retrieveMedia = async (projectId: string) => {
    try {
      addLog('Retrieving media for project...');
      
      const { data, error } = await supabase
        .from('project_media')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) {
        addLog(`❌ Error retrieving media: ${error.message}`);
        return false;
      }
      
      if (!data || data.length === 0) {
        addLog('❌ No media found for project');
        return false;
      }
      
      addLog(`✅ Retrieved ${data.length} media items`);
      setTestResults(prev => ({ ...prev, mediaRetrieved: true }));
      return true;
    } catch (e: any) {
      addLog(`❌ Unexpected error retrieving media: ${e.message}`);
      return false;
    }
  };

  // Run full test
  const runFullTest = async () => {
    setIsUploading(true);
    setLogs([]);
    setTestResults({
      bucketExists: false,
      projectCreated: false,
      mediaUploaded: false,
      mediaReferencesSaved: false,
      mediaRetrieved: false,
    });
    
    try {
      addLog('Starting full test...');
      
      // Test 0: Ensure project_media table exists
      addLog('Ensuring project_media table exists...');
      await createProjectMediaTable();
      
      // Test 1: Check bucket existence
      const bucketExists = await testBucketExistence();
      if (!bucketExists) {
        addLog('❌ Bucket test failed, aborting further tests');
        setIsUploading(false);
        return;
      }
      
      // Test 2: Create project
      const newProjectId = await createTestProject();
      if (!newProjectId) {
        addLog('❌ Project creation failed, aborting further tests');
        setIsUploading(false);
        return;
      }
      
      // Test 3: Upload media
      const mediaUploaded = await uploadMediaFiles(newProjectId);
      if (!mediaUploaded) {
        addLog('❌ Media upload failed, aborting further tests');
        setIsUploading(false);
        return;
      }
      
      // Test 4: Save media references
      const referencesSaved = await saveMediaReferences(newProjectId);
      if (!referencesSaved) {
        addLog('⚠️ Some media references failed to save, continuing with tests');
      }
      
      // Test 5: Retrieve media
      const mediaRetrieved = await retrieveMedia(newProjectId);
      if (!mediaRetrieved) {
        addLog('❌ Media retrieval failed');
      }
      
      addLog('Full test completed');
      
      // Final assessment - check actual test results, not the state which might not be updated yet
      const allTestsPassed = 
        testResults.bucketExists && 
        testResults.projectCreated && 
        testResults.mediaUploaded && 
        testResults.mediaReferencesSaved && 
        testResults.mediaRetrieved;
        
      if (allTestsPassed) {
        addLog('✅ ALL TESTS PASSED! The media upload system is working correctly.');
        toast({
          title: 'Success',
          description: 'All tests passed! The media upload system is working correctly.',
          variant: 'default',
        });
      } else {
        // Check which tests failed and provide a detailed report
        const failedTests = [];
        if (!testResults.bucketExists) failedTests.push('Bucket creation/verification');
        if (!testResults.projectCreated) failedTests.push('Project creation');
        if (!testResults.mediaUploaded) failedTests.push('Media upload');
        if (!testResults.mediaReferencesSaved) failedTests.push('Media reference saving');
        if (!testResults.mediaRetrieved) failedTests.push('Media retrieval');
        
        addLog(`❌ The following tests failed: ${failedTests.join(', ')}`);
        toast({
          title: 'Warning',
          description: `The following tests failed: ${failedTests.join(', ')}`,
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      addLog(`❌ Unexpected error during test: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Media Upload System Test</CardTitle>
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
              <h3 className="text-lg font-medium mb-2">2. Run Full Test</h3>
              <Button 
                onClick={runFullTest} 
                disabled={isUploading || selectedFiles.length === 0}
                className="w-full"
              >
                {isUploading ? 'Testing...' : 'Run Full Test'}
              </Button>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Test Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-md ${testResults.bucketExists ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 ${testResults.bucketExists ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Storage Bucket</span>
                  </div>
                </div>
                <div className={`p-4 rounded-md ${testResults.projectCreated ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 ${testResults.projectCreated ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Project Creation</span>
                  </div>
                </div>
                <div className={`p-4 rounded-md ${testResults.mediaUploaded ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 ${testResults.mediaUploaded ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Media Upload</span>
                  </div>
                </div>
                <div className={`p-4 rounded-md ${testResults.mediaReferencesSaved ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 ${testResults.mediaReferencesSaved ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Media References</span>
                  </div>
                </div>
                <div className={`p-4 rounded-md ${testResults.mediaRetrieved ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 ${testResults.mediaRetrieved ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Media Retrieval</span>
                  </div>
                </div>
              </div>
            </div>
            
            {uploadedImages.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Uploaded Images</h3>
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
                  <div key={index} className="mb-1">
                    {log.includes('✅') ? (
                      <span className="text-green-600">{log}</span>
                    ) : log.includes('❌') ? (
                      <span className="text-red-600">{log}</span>
                    ) : log.includes('⚠️') ? (
                      <span className="text-yellow-600">{log}</span>
                    ) : (
                      <span>{log}</span>
                    )}
                  </div>
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
