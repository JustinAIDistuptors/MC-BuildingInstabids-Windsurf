'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trash, RotateCw, Database, AlertCircle } from 'lucide-react';

export default function FixPage() {
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [projectIdToDelete, setProjectIdToDelete] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load localStorage data
  useEffect(() => {
    try {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }
      setStorageData(data);

      // Load projects specifically
      const projectsData = localStorage.getItem('mock_projects');
      if (projectsData) {
        setProjects(JSON.parse(projectsData));
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading localStorage data:', error);
      setMessage({
        type: 'error',
        text: `Error loading localStorage data: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, [refreshKey]);

  // Clear all localStorage
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear ALL localStorage data? This cannot be undone.')) {
      try {
        localStorage.clear();
        setMessage({ type: 'success', text: 'All localStorage data has been cleared.' });
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        setMessage({
          type: 'error',
          text: `Error clearing localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
  };

  // Clear specific key
  const handleClearKey = (key: string) => {
    if (window.confirm(`Are you sure you want to clear "${key}" from localStorage? This cannot be undone.`)) {
      try {
        localStorage.removeItem(key);
        setMessage({ type: 'success', text: `"${key}" has been removed from localStorage.` });
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        setMessage({
          type: 'error',
          text: `Error removing "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
  };

  // Reset projects to empty array
  const handleResetProjects = () => {
    if (window.confirm('Are you sure you want to reset projects to an empty array? This cannot be undone.')) {
      try {
        localStorage.setItem('mock_projects', '[]');
        setMessage({ type: 'success', text: 'Projects have been reset to an empty array.' });
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        setMessage({
          type: 'error',
          text: `Error resetting projects: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
  };

  // Delete specific project by ID
  const handleDeleteProject = () => {
    if (!projectIdToDelete.trim()) {
      setMessage({ type: 'error', text: 'Please enter a project ID.' });
      return;
    }

    try {
      const projectsData = localStorage.getItem('mock_projects');
      if (!projectsData) {
        setMessage({ type: 'error', text: 'No projects found in localStorage.' });
        return;
      }

      const projects = JSON.parse(projectsData);
      const projectIndex = projects.findIndex((p: any) => p.id === projectIdToDelete);

      if (projectIndex === -1) {
        setMessage({ type: 'error', text: `Project with ID "${projectIdToDelete}" not found.` });
        return;
      }

      // Remove the project
      projects.splice(projectIndex, 1);
      localStorage.setItem('mock_projects', JSON.stringify(projects));

      setMessage({ type: 'success', text: `Project with ID "${projectIdToDelete}" has been deleted.` });
      setProjectIdToDelete('');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error deleting project: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Refresh data
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setMessage({ type: 'info', text: 'Data refreshed.' });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">InstaBids Admin Fix Tool</h1>

      {message && (
        <Alert 
          className={`mb-6 ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
            message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' && <div className="h-4 w-4 text-green-500">✓</div>}
            {message.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
            {message.type === 'info' && <div className="h-4 w-4 text-blue-500">ℹ</div>}
            <AlertTitle>
              {message.type === 'success' ? 'Success' : message.type === 'error' ? 'Error' : 'Information'}
            </AlertTitle>
          </div>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
          <RotateCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="projects">
        <TabsList className="mb-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="localStorage">All localStorage</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projects in localStorage</CardTitle>
              <CardDescription>
                Found {projects.length} projects in localStorage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project, index) => (
                    <Card key={project.id || index} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{project.title || 'Untitled Project'}</h3>
                          <p className="text-sm text-gray-500">ID: {project.id}</p>
                          <p className="text-sm text-gray-500">Status: {project.status || 'Unknown'}</p>
                        </div>
                        <Button 
                          variant="destructive" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setProjectIdToDelete(project.id);
                            handleDeleteProject();
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No projects found in localStorage
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="destructive" onClick={handleResetProjects}>
                Reset Projects to Empty Array
              </Button>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter project ID to delete"
                  value={projectIdToDelete}
                  onChange={(e) => setProjectIdToDelete(e.target.value)}
                  className="w-64"
                />
                <Button onClick={handleDeleteProject}>Delete Project</Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="localStorage">
          <Card>
            <CardHeader>
              <CardTitle>All localStorage Data</CardTitle>
              <CardDescription>
                Found {Object.keys(storageData).length} keys in localStorage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.keys(storageData).map((key) => (
                  <div key={key} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold">{key}</div>
                      <Button 
                        variant="destructive" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleClearKey(key)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {typeof storageData[key] === 'object' 
                        ? JSON.stringify(storageData[key], null, 2) 
                        : storageData[key]}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>
                Perform administrative actions to fix issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md p-4 bg-red-50">
                <h3 className="font-semibold text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Danger Zone
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  These actions cannot be undone. Use with caution.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleClearAll}
                  className="w-full"
                >
                  Clear ALL localStorage Data
                </Button>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Switch Data Source
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Toggle between localStorage and Supabase as the data source
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      localStorage.setItem('use_supabase', 'false');
                      setMessage({ type: 'success', text: 'Data source set to localStorage' });
                      setRefreshKey(prev => prev + 1);
                    }}
                  >
                    Use localStorage
                  </Button>
                  <Button 
                    onClick={() => {
                      localStorage.setItem('use_supabase', 'true');
                      setMessage({ type: 'success', text: 'Data source set to Supabase' });
                      setRefreshKey(prev => prev + 1);
                    }}
                  >
                    Use Supabase
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
