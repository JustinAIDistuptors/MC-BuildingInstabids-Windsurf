'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Simple Project type
interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  type?: string;
  imageUrl?: string;
}

export default function ProjectsNewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load projects directly from localStorage
  useEffect(() => {
    setLoading(true);
    try {
      // Clear any existing localStorage data first
      localStorage.removeItem('mock_projects');
      
      // Set empty array
      localStorage.setItem('mock_projects', JSON.stringify([]));
      
      // Now read it back
      const projectsStr = localStorage.getItem('mock_projects');
      const loadedProjects = projectsStr ? JSON.parse(projectsStr) : [];
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new project
  const handleCreateProject = () => {
    router.push('/dashboard/homeowner/projects/new');
  };

  // Delete a project
  const handleDeleteProject = (id: string) => {
    try {
      // Filter out the project to delete
      const updatedProjects = projects.filter(p => p.id !== id);
      
      // Update state
      setProjects(updatedProjects);
      
      // Update localStorage
      localStorage.setItem('mock_projects', JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Format budget for display
  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return 'Not specified';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Projects (Clean Version)</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              localStorage.setItem('mock_projects', JSON.stringify([]));
              setProjects([]);
            }}
            variant="outline"
          >
            Clear All Projects
          </Button>
          <Button onClick={handleCreateProject}>
            Create New Project
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <Card key={project.id} className="overflow-hidden">
                  <div className="relative h-40 bg-gray-200">
                    <Image
                      src={project.imageUrl || '/placeholder-project.jpg'}
                      alt={project.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.status}
                      </span>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle>{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Budget</div>
                        <div className="font-medium">
                          {formatBudget(project.budget_min, project.budget_max)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Location</div>
                        <div className="font-medium">
                          {project.location || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Type</div>
                        <div className="font-medium">
                          {project.type || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/homeowner/projects/${project.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6">You haven't created any projects yet.</p>
              <Button onClick={handleCreateProject}>Create Your First Project</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts">
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No draft projects</h3>
            <p className="text-gray-500">Any projects saved as drafts will appear here.</p>
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No completed projects</h3>
            <p className="text-gray-500">Completed projects will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
