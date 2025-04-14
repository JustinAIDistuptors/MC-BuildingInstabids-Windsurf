'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function DebugProjectsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  // Run diagnostics
  const runDiagnostics = async () => {
    setIsLoading(true);
    setLogs([]);
    setProjects([]);
    setMediaItems([]);

    try {
      addLog('Starting diagnostics...');

      // 1. Check projects table
      addLog('Checking projects table...');
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) {
        addLog(`❌ Error querying projects table: ${projectsError.message}`);
      } else {
        addLog(`✅ Found ${projectsData?.length || 0} projects in the database`);
        setProjects(projectsData || []);

        if (projectsData && projectsData.length > 0) {
          // List all projects
          projectsData.forEach((project, index) => {
            addLog(`Project ${index + 1}: ID=${project.id}, Title=${project.title}, Status=${project.status}`);
          });
        } else {
          addLog('⚠️ No projects found in the database');
        }
      }

      // 2. Check project_media table
      addLog('Checking project_media table...');
      const { data: mediaData, error: mediaError } = await supabase
        .from('project_media')
        .select('*');

      if (mediaError) {
        addLog(`❌ Error querying project_media table: ${mediaError.message}`);
      } else {
        addLog(`✅ Found ${mediaData?.length || 0} media items in the database`);
        setMediaItems(mediaData || []);

        if (mediaData && mediaData.length > 0) {
          // List all media items
          mediaData.forEach((media, index) => {
            addLog(`Media ${index + 1}: ID=${media.id}, Project ID=${media.project_id}, URL=${media.media_url}`);
          });
        } else {
          addLog('⚠️ No media items found in the database');
        }
      }

      // 3. Check if projects have associated media
      if (projectsData && projectsData.length > 0 && mediaData && mediaData.length > 0) {
        addLog('Checking project-media associations...');
        
        const projectsWithMedia = projectsData.filter(project => 
          mediaData.some(media => media.project_id === project.id)
        );
        
        addLog(`✅ Found ${projectsWithMedia.length} projects with associated media`);
        
        projectsWithMedia.forEach((project, index) => {
          const mediaForProject = mediaData.filter(media => media.project_id === project.id);
          addLog(`Project "${project.title}" (ID: ${project.id}) has ${mediaForProject.length} media items`);
        });
      }

      // 4. Verify database connection is working properly
      addLog('Verifying database connection...');
      const { data: connectionData, error: connectionError } = await supabase.from('_prisma_migrations').select('*').limit(1);
      
      if (connectionError) {
        if (connectionError.code === '42P01') { // Table doesn't exist error
          addLog('✅ Database connection is working (table not found error is expected)');
        } else {
          addLog(`❌ Database connection issue: ${connectionError.message}`);
        }
      } else {
        addLog('✅ Database connection is working properly');
      }

      addLog('Diagnostics completed');
    } catch (error: any) {
      addLog(`❌ Unexpected error during diagnostics: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fix projects display
  const fixProjectsDisplay = async () => {
    setIsLoading(true);
    setLogs([]);

    try {
      addLog('Attempting to fix projects display...');

      // 1. Create a test project if none exist
      if (projects.length === 0) {
        addLog('No projects found, creating a test project...');
        
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert([
            {
              title: 'Test Project',
              description: 'This is a test project created by the debug tool',
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
        
        if (createError) {
          addLog(`❌ Error creating test project: ${createError.message}`);
        } else if (newProject && newProject.length > 0) {
          addLog(`✅ Created test project with ID: ${newProject[0].id}`);
          
          // Run diagnostics again to refresh project list
          await runDiagnostics();
        }
      }

      addLog('Fix attempt completed');
    } catch (error: any) {
      addLog(`❌ Unexpected error during fix attempt: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Project Diagnostics Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <Button 
              onClick={runDiagnostics} 
              disabled={isLoading}
            >
              {isLoading ? 'Running...' : 'Run Diagnostics'}
            </Button>
            <Button 
              onClick={fixProjectsDisplay} 
              disabled={isLoading}
              variant="outline"
            >
              Fix Projects Display
            </Button>
          </div>
          
          {/* Projects display */}
          {projects.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Projects in Database ({projects.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                  <Card key={project.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">{project.title}</CardTitle>
                      <div className="text-xs text-gray-500">ID: {project.id}</div>
                      <div className="text-xs text-gray-500">Status: {project.status}</div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm line-clamp-2">{project.description}</p>
                      <div className="mt-2 text-xs">
                        <div>Created: {new Date(project.created_at).toLocaleString()}</div>
                        <div>Media Count: {mediaItems.filter(m => m.project_id === project.id).length}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Log display */}
          <div>
            <h3 className="text-lg font-medium mb-2">Diagnostic Logs</h3>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p>No logs yet. Run diagnostics to see results.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
