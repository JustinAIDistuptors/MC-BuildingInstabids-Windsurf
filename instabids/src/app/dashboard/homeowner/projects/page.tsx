'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function ProjectsPage() {
  const [bidCards, setBidCards] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('active');

  // Fetch bid cards from localStorage when the component mounts
  useEffect(() => {
    function fetchLocalProjects() {
      try {
        setLoading(true);
        
        // Get projects from localStorage
        const localProjectsString = localStorage.getItem('mock_projects');
        const localProjects = localProjectsString ? JSON.parse(localProjectsString) : [];
        
        // Add sample projects if none exist
        if (localProjects.length === 0) {
          const sampleProjects = [
            {
              id: 'sample-1',
              title: 'Kitchen Renovation',
              description: 'Modernize kitchen with new cabinets, countertops, and appliances.',
              job_type_id: 'renovation',
              job_category_id: 'kitchen',
              status: 'published',
              bid_status: 'accepting_bids',
              budget_min: 10000,
              budget_max: 15000,
              location: {
                address_line1: '123 Main St',
                city: 'Miami',
                state: 'FL',
                zip_code: '33101'
              },
              zip_code: '33101',
              created_at: new Date().toISOString()
            },
            {
              id: 'sample-2',
              title: 'Deck Construction',
              description: 'Build a 400 sq ft wooden deck in the backyard.',
              job_type_id: 'construction',
              job_category_id: 'outdoor',
              status: 'published',
              bid_status: 'in_progress',
              budget_min: 7000,
              budget_max: 9000,
              location: {
                address_line1: '456 Palm Ave',
                city: 'Miami',
                state: 'FL',
                zip_code: '33101'
              },
              zip_code: '33101',
              created_at: new Date().toISOString()
            }
          ];
          
          localStorage.setItem('mock_projects', JSON.stringify(sampleProjects));
          setBidCards(sampleProjects);
        } else {
          setBidCards(localProjects);
        }
      } catch (error) {
        console.error('Error fetching local projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your projects from local storage.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchLocalProjects();
  }, []);

  // Handle deleting a bid card
  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      // Get current projects
      const localProjectsString = localStorage.getItem('mock_projects');
      const localProjects = localProjectsString ? JSON.parse(localProjectsString) : [];
      
      // Filter out the deleted project
      const updatedProjects = localProjects.filter((project: any) => project.id !== id);
      
      // Save updated projects back to localStorage
      localStorage.setItem('mock_projects', JSON.stringify(updatedProjects));
      
      // Update state
      setBidCards(updatedProjects);
      
      toast({
        title: 'Project deleted',
        description: 'Your project has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter projects based on active tab
  const filteredProjects = bidCards.filter(project => {
    if (activeTab === 'active') {
      return project.status === 'published' && project.bid_status !== 'completed';
    } else if (activeTab === 'drafts') {
      return project.status === 'draft';
    } else if (activeTab === 'completed') {
      return project.bid_status === 'completed';
    }
    return true;
  });

  // Get status badge color and text
  const getStatusBadge = (project: any) => {
    const status = project.bid_status || 'accepting_bids';
    
    switch (status) {
      case 'accepting_bids':
        return (
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Accepting Bids
          </div>
        );
      case 'in_progress':
        return (
          <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
            In Progress
          </div>
        );
      case 'completed':
        return (
          <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Completed
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Draft
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Projects</h1>
        <p className="text-gray-600">Manage your renovation and improvement projects</p>
      </div>

      <Tabs defaultValue="active" onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {activeTab === 'active' && "You don't have any active projects yet."}
            {activeTab === 'drafts' && "You don't have any draft projects yet."}
            {activeTab === 'completed' && "You don't have any completed projects yet."}
          </p>
          <Link href="/simple-bid">
            <Button>Create New Project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Status Badge */}
              <div className="p-2">
                {getStatusBadge(project)}
              </div>
              
              {/* Project Image */}
              <div className="h-40 bg-gray-200 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor" viewBox="0 0 640 512">
                  <path d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z" />
                </svg>
              </div>
              
              {/* Project Content */}
              <div className="p-4">
                <h5 className="text-xl font-bold tracking-tight text-gray-900 mb-2">
                  {project.title}
                </h5>
                <p className="font-normal text-gray-700 mb-3 line-clamp-2">
                  {project.description}
                </p>
                
                {/* Project Details */}
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <div>${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}</div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                    </svg>
                    {project.location?.city}, {project.location?.state}
                  </div>
                </div>
                
                {/* Comments count - just for demo */}
                {project.bid_status === 'accepting_bids' && (
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-medium text-blue-600">4</span> bids received
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Link 
                    href={`/simple-bid/submit?id=${project.id}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/simple-bid?edit=${project.id}`}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Edit
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Toaster />
    </div>
  );
}
