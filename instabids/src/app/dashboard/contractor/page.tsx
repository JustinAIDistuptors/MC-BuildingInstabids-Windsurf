"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProjectService, Project } from "@/lib/supabase/project-service";
import { supabase } from "@/lib/supabase/client";

// Mock data for available projects
const mockAvailableProjects = [
  {
    id: "project-1",
    title: "Kitchen Renovation",
    description: "Modernize kitchen with new cabinets, countertops, and appliances.",
    status: "bidding",
    budget: { min: 10000, max: 15000 },
    location: "Miami, FL",
    createdAt: "2025-03-20T14:30:00Z",
    postedBy: "John D.",
    bidsCount: 4,
    imageUrl: "/images/placeholder-project.jpg",
    distance: "3.2 miles"
  },
  {
    id: "project-4",
    title: "Backyard Landscaping",
    description: "Complete redesign of backyard with new plants, walkways, and lighting.",
    status: "bidding",
    budget: { min: 8000, max: 12000 },
    location: "Fort Lauderdale, FL",
    createdAt: "2025-04-02T16:20:00Z",
    postedBy: "Sarah M.",
    bidsCount: 2,
    imageUrl: "/images/placeholder-project.jpg",
    distance: "12.5 miles"
  },
  {
    id: "project-5",
    title: "Living Room Painting",
    description: "Paint living room and dining room (approx. 800 sq ft total).",
    status: "bidding",
    budget: { min: 1200, max: 2000 },
    location: "Boca Raton, FL",
    createdAt: "2025-04-05T10:10:00Z",
    postedBy: "Michael J.",
    bidsCount: 3,
    imageUrl: "/images/placeholder-project.jpg",
    distance: "15.8 miles"
  },
  {
    id: "project-6",
    title: "Window Replacement",
    description: "Replace 12 windows with energy-efficient models.",
    status: "bidding",
    budget: { min: 6000, max: 9000 },
    location: "Miami, FL",
    createdAt: "2025-04-03T13:45:00Z",
    postedBy: "Robert K.",
    bidsCount: 1,
    imageUrl: "/images/placeholder-project.jpg",
    distance: "4.3 miles"
  }
];

// Mock data for active projects (contractor has submitted bids or is working on)
const mockActiveProjects = [
  {
    id: "project-3",
    title: "Deck Construction",
    description: "Build a 400 sq ft wooden deck in the backyard.",
    status: "in_progress",
    bidStatus: "awarded", // awarded, pending
    budget: { min: 7000, max: 9000 },
    location: "Miami, FL",
    postedBy: "Emily R.",
    dueDate: "2025-05-15",
    imageUrl: "/images/placeholder-project.jpg"
  },
  {
    id: "project-7",
    title: "Master Bathroom Renovation",
    description: "Complete renovation of master bathroom with new shower, vanity, and fixtures.",
    status: "bidding",
    bidStatus: "pending",
    budget: { min: 12000, max: 18000 },
    location: "Miami Beach, FL",
    postedBy: "David L.",
    submittedBid: 14500,
  }
];

// Extended Project interface for UI-specific properties
interface ProjectWithUIData extends Project {
  bid_status?: 'pending' | 'awarded';
  submitted_bid?: number;
  due_date?: string | undefined;
}

// Project card component for available projects
function AvailableProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="relative h-40 w-full bg-gray-200 dark:bg-gray-700">
        <div className="h-full w-full flex items-center justify-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{project.title}</h3>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{project.distance}</span>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {project.description}
        </p>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {project.budget_min && project.budget_max ? 
              `$${project.budget_min.toLocaleString()} - $${project.budget_max.toLocaleString()}` : 
              'Budget not specified'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {project.bid_count || 0} bids
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {project.location || 'Location not specified'}
          </div>
          <Link href={`/projects/${project.id}`} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

// Project card component for active projects
function ActiveProjectCard({ project }: { project: ProjectWithUIData }) {
  // Determine if project is awarded based on status
  const bidStatus = project.status === "in_progress" ? "awarded" : "pending";
  
  const statusStyles = {
    awarded: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
  };
  
  const statusLabels = {
    awarded: "Project Awarded",
    pending: "Bid Submitted"
  };
  
  const style = statusStyles[bidStatus];
  const label = statusLabels[bidStatus];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="relative h-40 w-full bg-gray-200 dark:bg-gray-700">
        <div className="h-full w-full flex items-center justify-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{project.title}</h3>
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${style}`}>{label}</span>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {project.description}
        </p>
        
        {bidStatus === "pending" ? (
          <div className="mt-3 flex items-center text-sm">
            <span className="font-medium text-gray-900 dark:text-white">Your bid:</span>
            <span className="ml-2 text-gray-700 dark:text-gray-300">${project.submitted_bid?.toLocaleString() || 'N/A'}</span>
          </div>
        ) : (
          <div className="mt-3 flex items-center text-sm">
            <span className="font-medium text-gray-900 dark:text-white">Due date:</span>
            <span className="ml-2 text-gray-700 dark:text-gray-300">{project.due_date || 'Not specified'}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {project.budget_min && project.budget_max ? 
              `$${project.budget_min.toLocaleString()} - $${project.budget_max.toLocaleString()}` : 
              'Budget not specified'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {project.status === "in_progress" ? "Awarded" : "Pending"}
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {project.location || 'Location not specified'}
          </div>
          <Link href={`/projects/${project.id}`} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700">
            {bidStatus === "awarded" ? "View Project" : "View Bid"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ContractorDashboard() {
  const [activeTab, setActiveTab] = useState("available");
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [activeProjects, setActiveProjects] = useState<ProjectWithUIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("User not authenticated");
          return;
        }
        
        // Load available projects
        const available = await ProjectService.getAvailableProjects();
        setAvailableProjects(available);
        
        // Load active projects for this contractor
        const active = await ProjectService.getActiveProjects(user.id);
        
        // Add UI-specific properties to active projects
        const activeWithUIData = active.map(project => {
          // Convert project to ProjectWithUIData
          const projectWithUI: ProjectWithUIData = {
            ...project,
            bid_status: project.status === "in_progress" ? "awarded" : "pending",
            submitted_bid: Math.floor(Math.random() * (project.budget_max || 10000)), // Mock bid amount
            due_date: project.status === "in_progress" ? 
              new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0] : undefined
          };
          return projectWithUI;
        });
        
        setActiveProjects(activeWithUIData);
      } catch (err: any) {
        console.error("Error loading projects:", err);
        setError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    
    loadProjects();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text">
              InstaBids
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard/contractor" className="text-gray-900 dark:text-white font-medium">
              Find Work
            </Link>
            <Link href="/dashboard/contractor/jobs" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              My Jobs
            </Link>
            <Link href="/dashboard/contractor/messages" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Messages
            </Link>
            <Link href="/dashboard/contractor/profile" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Profile
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <button className="relative p-1 rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              TC
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find Work</h1>
            <p className="text-gray-600 dark:text-gray-400">Discover projects that match your skills and location</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="relative">
              <select className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option>Miami, FL (25 mi)</option>
                <option>Fort Lauderdale, FL (25 mi)</option>
                <option>West Palm Beach, FL (25 mi)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <button className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Filter
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("available")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "available"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Available Projects
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "active"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              My Active Projects
            </button>
          </nav>
        </div>
        
        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading state
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading projects...</p>
            </div>
          ) : error ? (
            // Error state
            <div className="col-span-full text-center py-12">
              <svg className="mx-auto h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error loading projects</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
              <div className="mt-6">
                <button onClick={() => window.location.reload()} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  Retry
                </button>
              </div>
            </div>
          ) : activeTab === "available" ? (
            availableProjects.length > 0 ? (
              availableProjects.map(project => (
                <AvailableProjectCard key={project.id} project={project} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  There are no available projects in your area at the moment.
                </p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    Expand your search area
                  </button>
                </div>
              </div>
            )
          ) : (
            activeProjects.length > 0 ? (
              activeProjects.map(project => (
                <ActiveProjectCard key={project.id} project={project} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No active projects</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You don't have any active projects or pending bids.
                </p>
                <div className="mt-6">
                  <button onClick={() => setActiveTab("available")} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    Find available projects
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
