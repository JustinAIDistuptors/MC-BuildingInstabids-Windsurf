"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ProjectCard from "@/components/projects/ProjectCard";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusStyles = {
    draft: "bg-gray-100 text-gray-800",
    accepting_bids: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };
  
  const statusLabels = {
    draft: "Draft",
    accepting_bids: "Accepting Bids",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled"
  };
  
  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.draft;
  const label = statusLabels[status as keyof typeof statusLabels] || "Unknown";
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
};

export default function HomeownerDashboard() {
  const [activeTab, setActiveTab] = useState("active");
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    bidReceived: 0,
    projectsCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        console.log('Dashboard: Loading projects from Supabase...');
        
        // Get all projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (projectsError) {
          console.error('Dashboard: Error loading projects from Supabase:', projectsError);
          setProjects([]);
          return;
        }
        
        console.log('Dashboard: Projects loaded from Supabase:', projectsData);
        
        if (!projectsData || projectsData.length === 0) {
          setProjects([]);
          setLoading(false);
          return;
        }
        
        // Get media for all projects in a single query - MATCHING MY PROJECTS PAGE
        const { data: allMediaData, error: mediaError } = await supabase
          .from('project_media')
          .select('*');
        
        if (mediaError) {
          console.error('Dashboard: Error loading media:', mediaError);
          // Continue with projects but without media
          setProjects(projectsData);
          
          // Calculate stats
          calculateStats(projectsData);
          return;
        }
        
        console.log('Dashboard: Media loaded:', allMediaData);
        
        // Map media to their respective projects - MATCHING MY PROJECTS PAGE
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
        
        console.log('Dashboard: Projects with media:', projectsWithMedia);
        setProjects(projectsWithMedia);
        
        // Calculate stats
        calculateStats(projectsWithMedia);
      } catch (error) {
        console.error('Dashboard: Error loading projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to calculate stats
    const calculateStats = (data: any[]) => {
      // Calculate stats
      const activeCount = data?.filter((p: any) => 
        p.status === 'published' && p.bid_status !== 'completed'
      ).length || 0;
      
      // Simulate bid counts - in a real app this would come from the API
      const totalBids = data?.reduce((acc: number, p: any) => 
        p.status === 'accepting_bids' ? acc + (p.bid_count || 0) : acc
      , 0) || 0;
      
      const completedCount = data?.filter((p: any) => 
        p.bid_status === "completed"
      ).length || 0;
      
      setStats({
        activeProjects: activeCount,
        bidReceived: totalBids,
        projectsCompleted: completedCount
      });
    };
    
    loadProjects();
  }, []);
  
  // Handle deleting a project
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
      } else {
        // Update local state
        setProjects(projects.filter(project => project.id !== id));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter projects based on active tab
  const filteredProjects = projects.filter((project: any) => {
    if (activeTab === "active") {
      return project.status === 'published' && project.bid_status !== 'completed';
    } else if (activeTab === "drafts") {
      return project.status === "draft";
    } else if (activeTab === "completed") {
      return project.bid_status === "completed";
    }
    return true;
  });
  
  return (
    <div className="p-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 mb-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Welcome to Your InstaBids Dashboard</h1>
            <p className="text-blue-100 mb-4 max-w-xl">
              Create projects and receive competitive bids from qualified contractors. Manage everything from one place.
            </p>
            <Link 
              href="/dashboard/homeowner/new-project" 
              className="inline-block px-5 py-3 mt-2 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              Create New Project
            </Link>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-500 bg-opacity-30 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold">{stats.activeProjects}</div>
              <div className="text-blue-100">Active Projects</div>
            </div>
            
            <div className="bg-blue-500 bg-opacity-30 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold">{stats.bidReceived}</div>
              <div className="text-blue-100">Bids Received</div>
            </div>
            
            <div className="bg-blue-500 bg-opacity-30 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold">{stats.projectsCompleted}</div>
              <div className="text-blue-100">Projects Completed</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Projects */}
      <div className="mb-10">
        <div className="flex flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Projects</h2>
          <Link href="/dashboard/homeowner/projects" className="text-blue-600 hover:text-blue-800">
            View All Projects
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first project to start receiving bids from contractors.
            </p>
            <Link href="/simple-bid">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create New Project
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 3).map((project: any) => (
              <ProjectCard
                key={project.id}
                project={project}
                linkToDetails={true}
                showDeleteButton={true}
                onDelete={handleDelete}
                className="h-full"
                usePlaceholder={true}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Projects Overview */}
      <div className="mb-8">
        <div className="flex flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Projects Overview</h2>
          <Link href="/dashboard/homeowner/new-project" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
            Create New Project
          </Link>
        </div>
        
        {/* Filtered Projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project: any) => (
            <ProjectCard
              key={project.id}
              project={project}
              linkToDetails={true}
              showDeleteButton={true}
              onDelete={handleDelete}
              className="h-full"
              usePlaceholder={true}
            />
          ))}
        </div>
      </div>
      
      {/* Quick Tips */}
      <div className="bg-blue-50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Tips for Getting Great Bids</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium">Be detailed in your project description</p>
              <p className="text-sm text-gray-600">Detailed descriptions help contractors provide more accurate bids.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium">Add photos of your project area</p>
              <p className="text-sm text-gray-600">Photos help contractors understand the scope and requirements.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium">Set realistic timelines</p>
              <p className="text-sm text-gray-600">Be clear about your timeline expectations to get appropriate bids.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium">Be upfront about your budget</p>
              <p className="text-sm text-gray-600">Setting a realistic budget range helps filter the right contractors.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
