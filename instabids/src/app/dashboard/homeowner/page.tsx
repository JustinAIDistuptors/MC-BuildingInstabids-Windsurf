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
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-8 mb-8 text-white shadow-lg relative overflow-hidden">
        {/* Abstract background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_40%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.2)_0%,transparent_40%)]"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 animate-fade-in">Welcome to Your InstaBids Dashboard</h1>
            <p className="text-blue-100 mb-4 max-w-xl animate-fade-in opacity-90" style={{ animationDelay: '0.1s' }}>
              Create projects and receive competitive bids from qualified contractors. Manage everything from one place.
            </p>
            <Link 
              href="/dashboard/homeowner/new-project" 
              className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-md font-medium shadow-sm hover:bg-blue-50 transition-all duration-200 transform hover:translate-y-[-2px] animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Project
            </Link>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 shadow-inner animate-slide-up transform hover:translate-y-[-2px] transition-transform duration-200" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center">
                <div className="rounded-full bg-white/30 p-2 mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-1">{stats.activeProjects}</div>
                  <div className="text-sm opacity-90">Active Projects</div>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 shadow-inner animate-slide-up transform hover:translate-y-[-2px] transition-transform duration-200" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center">
                <div className="rounded-full bg-white/30 p-2 mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-1">{stats.bidReceived}</div>
                  <div className="text-sm opacity-90">Bids Received</div>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 shadow-inner animate-slide-up transform hover:translate-y-[-2px] transition-transform duration-200" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center">
                <div className="rounded-full bg-white/30 p-2 mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-1">{stats.projectsCompleted}</div>
                  <div className="text-sm opacity-90">Projects Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Project Tabs and List */}
      <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Recent Projects</h2>
          <Link 
            href="/dashboard/homeowner/projects" 
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center group"
          >
            <span>View All Projects</span>
            <svg className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-6 py-3 text-sm font-medium relative ${
                activeTab === "active"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              } transition-colors duration-200`}
            >
              <span className="relative z-10">Active</span>
              {activeTab === "active" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("drafts")}
              className={`px-6 py-3 text-sm font-medium relative ${
                activeTab === "drafts"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              } transition-colors duration-200`}
            >
              <span className="relative z-10">Drafts</span>
              {activeTab === "drafts" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-6 py-3 text-sm font-medium relative ${
                activeTab === "completed"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              } transition-colors duration-200`}
            >
              <span className="relative z-10">Completed</span>
              {activeTab === "completed" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></span>
              )}
            </button>
          </div>
          
          {/* Projects List */}
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project: any, index: number) => (
                  <div 
                    key={project.id} 
                    className="animate-fade-in transform transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md" 
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <ProjectCard
                      project={project}
                      onDelete={handleDelete}
                      linkToDetails={true}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-dashed border-gray-300">
                <div className="bg-blue-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first project</p>
                <Link
                  href="/dashboard/homeowner/new-project"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md font-medium shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:translate-y-[-2px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create New Project
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
