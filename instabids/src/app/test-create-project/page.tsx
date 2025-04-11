'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function TestCreateProjectPage() {
  const [title, setTitle] = useState('Test Project');
  const [description, setDescription] = useState('This is a test project');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const router = useRouter();

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

  // Create project
  const createProject = async () => {
    try {
      addLog('Creating project...');
      
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            title,
            description,
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
      return true;
    } else {
      addLog('⚠️ Some media references failed to save');
      return false;
    }
  };

  // Verify project creation
  const verifyProject = async (projectId: string) => {
    try {
      addLog('Verifying project...');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) {
        addLog(`❌ Error verifying project: ${error.message}`);
        return false;
      }
      
      if (!data) {
        addLog('❌ Project not found in database');
        return false;
      }
      
      addLog(`✅ Project verified in database: ${data.title}`);
      return true;
    } catch (e: any) {
      addLog(`❌ Unexpected error verifying project: ${e.message}`);
      return false;
    }
  };

  // Verify media references
  const verifyMediaReferences = async (projectId: string) => {
    try {
      addLog('Verifying media references...');
      
      const { data, error } = await supabase
        .from('project_media')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) {
        addLog(`❌ Error verifying media references: ${error.message}`);
        return false;
      }
      
      if (!data || data.length === 0) {
        addLog('❌ No media references found for project');
        return false;
      }
      
      addLog(`✅ Found ${data.length} media references for project`);
      return true;
    } catch (e: any) {
      addLog(`❌ Unexpected error verifying media references: ${e.message}`);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLogs([]);
    
    try {
      // Step 1: Create project
      const newProjectId = await createProject();
      if (!newProjectId) {
        addLog('❌ Project creation failed, aborting');
        setIsSubmitting(false);
        return;
      }
      
      // Step 2: Upload media files
      const mediaUploaded = await uploadMediaFiles(newProjectId);
      if (!mediaUploaded) {
        addLog('⚠️ Media upload failed or no files selected');
      }
      
      // Step 3: Save media references
      if (uploadedImages.length > 0) {
        const referencesSaved = await saveMediaReferences(newProjectId);
        if (!referencesSaved) {
          addLog('⚠️ Some media references failed to save');
        }
      }
      
      // Step 4: Verify project creation
      const projectVerified = await verifyProject(newProjectId);
      if (!projectVerified) {
        addLog('❌ Project verification failed');
      }
      
      // Step 5: Verify media references
      if (uploadedImages.length > 0) {
        const referencesVerified = await verifyMediaReferences(newProjectId);
        if (!referencesVerified) {
          addLog('❌ Media reference verification failed');
        }
      }
      
      addLog('✅ Project creation process completed');
      
      toast({
        title: 'Success',
        description: 'Project created successfully!',
        variant: 'default',
      });
    } catch (error: any) {
      addLog(`❌ Unexpected error: ${error.message}`);
      
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // View project in the dashboard
  const viewProject = () => {
    if (projectId) {
      router.push(`/dashboard/homeowner/projects/${projectId}`);
    } else {
      addLog('❌ No project ID available');
    }
  };

  // View all projects
  const viewAllProjects = () => {
    router.push('/dashboard/homeowner/projects');
  };

  return (
    <div className="container mx-auto py-8">
      <Toaster />
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Project Creation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="media">Upload Images</Label>
              <Input 
                id="media" 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange}
              />
              <p className="text-sm text-gray-500">
                Select one or more images for your project
              </p>
            </div>
            
            <div className="flex space-x-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Project...' : 'Create Project'}
              </Button>
              
              {projectId && (
                <>
                  <Button type="button" variant="outline" onClick={viewProject}>
                    View Project
                  </Button>
                  <Button type="button" variant="outline" onClick={viewAllProjects}>
                    View All Projects
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Log display */}
      <Card>
        <CardHeader>
          <CardTitle>Process Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p>No logs yet. Create a project to see the process.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Preview uploaded images */}
      {uploadedImages.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Uploaded Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((url, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
