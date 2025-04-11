'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import Image from 'next/image';

// Initialize Supabase client directly
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

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
  created_at: string;
  updated_at?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const router = useRouter();

  // Load projects directly from Supabase
  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        console.log('Loading projects from Supabase...');
        
        const { data, error } = await supabase
          .from('projects')
          .select('*');
        
        if (error) {
          console.error('Error loading projects from Supabase:', error);
          setProjects([]);
        } else {
          console.log('Projects loaded from Supabase:', data);
          setProjects(data || []);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadProjects();
  }, []);

  // Create a new project
  const handleCreateProject = () => {
    router.push('/dashboard/homeowner/new-project');
  };

  // Delete a project directly from Supabase
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting project from Supabase:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete project. Please try again.',
          variant: 'destructive',
        });
      } else {
        // Update local state
        setProjects(projects.filter(project => project.id !== id));
        
        toast({
          title: 'Success',
          description: 'Project deleted successfully.',
        });
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear all projects
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL projects? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete all projects from Supabase
      const { error } = await supabase
        .from('projects')
        .delete()
        .gte('id', '0'); // This will match all IDs
      
      if (error) {
        console.error('Error clearing all projects from Supabase:', error);
        toast({
          title: 'Error',
          description: 'Failed to clear projects. Please try again.',
          variant: 'destructive',
        });
      } else {
        // Update local state
        setProjects([]);
        
        toast({
          title: 'Success',
          description: 'All projects cleared successfully.',
        });
      }
    } catch (error) {
      console.error('Error clearing projects:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  // Filter projects based on active tab
  const filteredProjects = projects.filter(project => {
    if (activeTab === 'active') return project.status === 'active' || project.status === 'accepting_bids';
    if (activeTab === 'drafts') return project.status === 'draft';
    if (activeTab === 'completed') return project.status === 'completed';
    return true;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleClearAll}
            variant="outline"
            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
          >
            Clear All Projects
          </Button>
          <Button onClick={handleCreateProject}>
            Create New Project
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <Card key={project.id} className="overflow-hidden">
                  <div className="relative h-40 bg-gray-200">
                    <Image
                      src="/placeholder-project.jpg"
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
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {project.description || 'No description provided'}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs">Budget</div>
                        <div>{formatBudget(project.budget_min, project.budget_max)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Location</div>
                        <div>{project.location || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Type</div>
                        <div>{project.type || 'Not specified'}</div>
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
                      onClick={() => handleDelete(project.id)}
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
              <p className="text-gray-500 mb-6">Get started by creating a new project.</p>
              <Button onClick={handleCreateProject}>Create Your First Project</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
