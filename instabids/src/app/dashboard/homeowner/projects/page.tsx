'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import ProjectCard from '@/components/projects/ProjectCard';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Project type definition
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
  bid_status?: string;
  media: {
    id: string;
    media_url: string;
    media_type: string;
    file_name: string;
  }[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const router = useRouter();

  // Load projects with their media - EXACTLY MATCHING DASHBOARD IMPLEMENTATION
  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        console.log('Loading projects from Supabase...');
        
        // Get all projects - USING THE EXACT SAME QUERY AS DASHBOARD
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (projectsError) {
          console.error('Error loading projects:', projectsError);
          toast({
            title: 'Error',
            description: 'Failed to load projects. Please try again.',
            variant: 'destructive',
          });
          setProjects([]);
          return;
        }
        
        console.log('Projects loaded:', JSON.stringify(projectsData, null, 2));
        
        if (!projectsData || projectsData.length === 0) {
          console.log('No projects found');
          setProjects([]);
          setLoading(false);
          return;
        }
        
        // Get media for all projects in a single query
        const { data: allMediaData, error: mediaError } = await supabase
          .from('project_media')
          .select('*');
        
        if (mediaError) {
          console.error('Error loading media:', mediaError);
          // Continue with projects but without media
          setProjects(projectsData.map(project => ({ ...project, media: [] })));
          return;
        }
        
        console.log('Media loaded:', allMediaData);
        
        // Map media to their respective projects
        const projectsWithMedia = projectsData.map(project => {
          const projectMedia = allMediaData?.filter(
            media => media.project_id === project.id
          ) || [];
          
          // Add hasMedia flag for ProjectCard component
          return {
            ...project,
            media: projectMedia,
            hasMedia: projectMedia.length > 0,
            // Set imageUrl for the ProjectCard component
            imageUrl: projectMedia.length > 0 ? projectMedia[0].media_url : undefined
          };
        });
        
        console.log('Projects with media:', projectsWithMedia);
        setProjects(projectsWithMedia);
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while loading projects.',
          variant: 'destructive',
        });
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

  // Delete a project
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // First, delete all media associated with this project
      const { data: mediaData, error: mediaError } = await supabase
        .from('project_media')
        .select('*')
        .eq('project_id', id);
      
      if (!mediaError && mediaData) {
        // Delete each media item from storage
        for (const media of mediaData) {
          const fileName = media.file_name;
          await supabase.storage
            .from('projectmedia')
            .remove([`${id}/${fileName}`]);
        }
        
        // Delete media records from database
        await supabase
          .from('project_media')
          .delete()
          .eq('project_id', id);
      }
      
      // Delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update the projects list
      setProjects(projects.filter(project => project.id !== id));
      
      toast({
        title: 'Success',
        description: 'Project deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear all projects (for testing)
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL projects? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete all project media first
      for (const project of projects) {
        const { data: mediaData } = await supabase
          .from('project_media')
          .select('*')
          .eq('project_id', project.id);
        
        if (mediaData && mediaData.length > 0) {
          // Delete media from storage
          for (const media of mediaData) {
            const fileName = media.file_name;
            await supabase.storage
              .from('projectmedia')
              .remove([`${project.id}/${fileName}`]);
          }
          
          // Delete media records
          await supabase
            .from('project_media')
            .delete()
            .eq('project_id', project.id);
        }
      }
      
      // Delete all projects
      const { error } = await supabase
        .from('projects')
        .delete()
        .neq('id', '0'); // Delete all projects
      
      if (error) {
        throw error;
      }
      
      setProjects([]);
      
      toast({
        title: 'Success',
        description: 'All projects deleted successfully.',
      });
    } catch (error) {
      console.error('Error clearing projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear projects. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on active tab - EXACTLY MATCHING DASHBOARD LOGIC
  const filteredProjects = projects.filter(project => {
    if (activeTab === 'active') {
      // Match any status that could be considered "active"
      return project.status === 'active' || 
             project.status === 'accepting_bids' || 
             project.status === 'published' ||
             project.bid_status === 'accepting_bids';
    }
    if (activeTab === 'drafts') return project.status === 'draft';
    if (activeTab === 'completed') return project.status === 'completed';
    return true; // All tab
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
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDelete}
                  linkToDetails={true}
                  imageUrl={project.imageUrl}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'active' ? "You don't have any active projects yet." :
                 activeTab === 'drafts' ? "You don't have any draft projects." :
                 activeTab === 'completed' ? "You don't have any completed projects." :
                 "You don't have any projects yet."}
              </p>
              <Button onClick={handleCreateProject}>
                Create Your First Project
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
