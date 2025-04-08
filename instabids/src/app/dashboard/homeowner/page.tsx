"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Mock data for projects
const mockProjects = [
  {
    id: "project-1",
    title: "Kitchen Renovation",
    description: "Modernize kitchen with new cabinets, countertops, and appliances.",
    status: "bidding",
    budget: { min: 10000, max: 15000 },
    location: "Miami, FL",
    createdAt: "2025-03-20T14:30:00Z",
    bidsCount: 4,
    imageUrl: "/images/placeholder-project.jpg"
  },
  {
    id: "project-2",
    title: "Bathroom Remodel",
    description: "Complete bathroom remodel with new fixtures, tiling, and vanity.",
    status: "draft",
    budget: { min: 5000, max: 8000 },
    location: "Miami, FL",
    createdAt: "2025-04-01T09:15:00Z",
    bidsCount: 0,
    imageUrl: "/images/placeholder-project.jpg"
  },
  {
    id: "project-3",
    title: "Deck Construction",
    description: "Build a 400 sq ft wooden deck in the backyard.",
    status: "in_progress",
    budget: { min: 7000, max: 9000 },
    location: "Miami, FL",
    createdAt: "2025-02-15T11:45:00Z",
    bidsCount: 6,
    imageUrl: "/images/placeholder-project.jpg"
  }
];

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusStyles = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    bidding: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
  };
  
  const statusLabels = {
    draft: "Draft",
    bidding: "Accepting Bids",
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
  
  // Filter projects based on active tab
  const filteredProjects = mockProjects.filter(project => {
    if (activeTab === "active") {
      return ["bidding", "in_progress"].includes(project.status);
    } else if (activeTab === "drafts") {
      return project.status === "draft";
    } else if (activeTab === "completed") {
      return project.status === "completed";
    }
    return true;
  });
  
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
            <Link href="/dashboard/homeowner" className="text-gray-900 dark:text-white font-medium">
              My Projects
            </Link>
            <Link href="/dashboard/homeowner/messages" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Messages
            </Link>
            <Link href="/dashboard/homeowner/account" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Account
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
              JD
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your renovation and improvement projects</p>
          </div>
          
          <Link href="/dashboard/homeowner/new-project" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Project
          </Link>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("active")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "active"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Active Projects
            </button>
            <button
              onClick={() => setActiveTab("drafts")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "drafts"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "completed"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Completed
            </button>
          </nav>
        </div>
        
        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <Link
                key={project.id}
                href={`/dashboard/homeowner/projects/${project.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700">
                  <div className="absolute top-3 left-3 z-10">
                    <StatusBadge status={project.status} />
                  </div>
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
                    {project.status === "bidding" && (
                      <span className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                        <span className="mr-1">{project.bidsCount}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {project.location}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {activeTab === "active" && "You don't have any active projects yet."}
              {activeTab === "drafts" && "You don't have any draft projects."}
              {activeTab === "completed" && "You don't have any completed projects."}
            </p>
            <div className="mt-6">
              <Link href="/dashboard/homeowner/new-project" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create your first project
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
