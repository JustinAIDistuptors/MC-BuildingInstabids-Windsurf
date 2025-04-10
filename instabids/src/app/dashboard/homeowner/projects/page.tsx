'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Card } from '@/components/ui/card';

// Mock data for projects
const MOCK_PROJECTS = [
  {
    id: '1',
    title: 'Kitchen Renovation',
    description: 'Complete kitchen remodel including new cabinets, countertops, and appliances.',
    status: 'active',
    bids: 3,
    budget: '$15,000 - $25,000',
    timeline: 'May 2023 - July 2023',
    location: 'Austin, TX',
    type: 'one-time',
    size: 'large',
    hasMedia: true,
    createdAt: '2023-04-15T10:30:00Z',
  },
  {
    id: '2',
    title: 'Bathroom Remodel',
    description: 'Update master bathroom with new shower, vanity, and fixtures.',
    status: 'active',
    bids: 2,
    budget: '$8,000 - $12,000',
    timeline: 'June 2023 - July 2023',
    location: 'Austin, TX',
    type: 'one-time',
    size: 'medium',
    hasMedia: false,
    createdAt: '2023-04-20T14:45:00Z',
  },
  {
    id: '3',
    title: 'Lawn Maintenance',
    description: 'Regular lawn mowing, edging, and garden maintenance.',
    status: 'completed',
    bids: 5,
    budget: '$150 - $200 per month',
    timeline: 'Ongoing',
    location: 'Austin, TX',
    type: 'continual',
    size: 'small',
    hasMedia: true,
    createdAt: '2023-03-10T09:15:00Z',
  },
  {
    id: '4',
    title: 'Fence Installation',
    description: 'Install new wooden privacy fence around backyard.',
    status: 'completed',
    bids: 4,
    budget: '$3,000 - $5,000',
    timeline: 'April 2023',
    location: 'Austin, TX',
    type: 'one-time',
    size: 'medium',
    hasMedia: false,
    createdAt: '2023-02-28T11:20:00Z',
  },
  {
    id: '5',
    title: 'Roof Repair',
    description: 'Fix leaking roof and replace damaged shingles.',
    status: 'archived',
    bids: 0,
    budget: '$1,000 - $3,000',
    timeline: 'March 2023',
    location: 'Austin, TX',
    type: 'repair',
    size: 'small',
    hasMedia: true,
    createdAt: '2023-02-15T16:30:00Z',
  },
];

// Project card component
const ProjectCard = ({ project, onViewDetails }: { project: any, onViewDetails: (project: any) => void }) => {
  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{project.title}</h3>
            <div className="text-sm text-gray-500">{project.type} project</div>
          </div>
          <div
            className={`text-xs font-medium px-2.5 py-0.5 rounded ${
              project.status === 'active' ? 'bg-green-100 text-green-800' :
              project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {project.status === 'active' ? 'Active' :
             project.status === 'completed' ? 'Completed' : 'Archived'}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          <div>
            <span className="text-gray-500">Budget</span>
            <p className="font-medium">{project.budget}</p>
          </div>
          <div>
            <span className="text-gray-500">Timeline</span>
            <p className="font-medium">{project.timeline}</p>
          </div>
          <div>
            <span className="text-gray-500">Location</span>
            <p className="font-medium">
              {typeof project.location === 'object' 
                ? `${project.location.city || ''}, ${project.location.state || ''} ${project.location.zip_code || ''}`
                : project.location || 'Not specified'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Size</span>
            <p className="font-medium capitalize">{project.size}</p>
          </div>
          {project.hasMedia && (
            <div className="col-span-2 mt-1">
              <div className="flex items-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Photos</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={() => onViewDetails(project)}
            className="px-3 py-1 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            View Details
          </Button>
          <Button 
            variant="ghost" 
            className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 text-sm transition-colors"
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Empty state component
const EmptyState = ({ onCreateProject }: { onCreateProject: () => void }) => (
  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
    <div className="mb-4">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      Get started by creating a new project.
    </p>
    <div className="mt-6">
      <Button onClick={onCreateProject} className="bg-blue-600 hover:bg-blue-700">
        Create a Project
      </Button>
    </div>
  </div>
);

export default function ProjectsPage() {
  const [bidCards, setBidCards] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('active');
  const router = useRouter();

  // Fetch bid cards from localStorage when the component mounts
  useEffect(() => {
    function fetchLocalProjects() {
      try {
        setLoading(true);
        
        // Get projects from localStorage
        const localProjectsString = localStorage.getItem('mock_projects');
        let localProjects = localProjectsString ? JSON.parse(localProjectsString) : [];
        
        // Check for lastSubmittedProject from BidCardForm
        const lastSubmittedProjectString = localStorage.getItem('lastSubmittedProject');
        if (lastSubmittedProjectString) {
          try {
            const lastSubmittedProject = JSON.parse(lastSubmittedProjectString);
            
            // Create a project object from the submitted data
            const newProject = {
              id: `project-${Date.now()}`,
              title: lastSubmittedProject.data.title || 'New Project',
              description: lastSubmittedProject.data.description || 'No description provided',
              job_type_id: lastSubmittedProject.data.job_type_id || 'other',
              job_category_id: lastSubmittedProject.data.job_category_id || 'other',
              status: 'published',
              bid_status: 'accepting_bids',
              budget_min: lastSubmittedProject.data.budget_min || null,
              budget_max: lastSubmittedProject.data.budget_max || null,
              location: lastSubmittedProject.data.location || {
                address_line1: 'Not specified',
                city: 'Not specified',
                state: 'Not specified',
                zip_code: lastSubmittedProject.data.zip_code || 'Not specified'
              },
              zip_code: lastSubmittedProject.data.zip_code || 'Not specified',
              created_at: lastSubmittedProject.submittedAt || new Date().toISOString(),
              job_size: lastSubmittedProject.data.job_size || 'medium',
              group_bidding_enabled: lastSubmittedProject.data.group_bidding_enabled || false,
              hasMedia: true // Flag to indicate this project has media files
            };
            
            // Check if this project already exists in localProjects
            const projectExists = localProjects.some((project: any) => 
              project.created_at === newProject.created_at && 
              project.title === newProject.title
            );
            
            if (!projectExists) {
              // Add the new project to the beginning of the array
              localProjects = [newProject, ...localProjects];
              
              // Save updated projects back to localStorage
              localStorage.setItem('mock_projects', JSON.stringify(localProjects));
              
              // Show success toast
              toast({
                title: 'Project Added',
                description: 'Your recently submitted project has been added to your dashboard.',
              });
            }
          } catch (error) {
            console.error('Error processing last submitted project:', error);
          }
        }
        
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

  // Handle creating a new project
  const handleCreateNewProject = () => {
    router.push('/bid-card');
  };

  // Handle viewing a project
  const handleViewProject = (project: any) => {
    try {
      // Format the project data for viewing
      const formattedProject = {
        data: {
          title: project.title || 'Untitled Project',
          description: project.description || 'No description provided',
          job_type_id: project.job_type_id || project.type || 'one-time',
          job_size: project.job_size || project.size || 'medium',
          group_bidding_enabled: project.group_bidding_enabled || false,
          // Format location as a proper object
          location: typeof project.location === 'object' 
            ? project.location 
            : {
                city: project.location?.split(',')[0]?.trim() || '',
                state: project.location?.split(',')[1]?.trim() || '',
                zip_code: project.zip_code || ''
              },
          // Format budget as strings
          budget_min: project.budget_min || (project.budget ? project.budget.split('-')[0]?.trim() : ''),
          budget_max: project.budget_max || (project.budget ? project.budget.split('-')[1]?.trim() : ''),
          // Format timeline
          timeline_start: project.timeline_start || (project.timeline ? project.timeline.split('-')[0]?.trim() : ''),
          timeline_end: project.timeline_end || (project.timeline ? project.timeline.split('-')[1]?.trim() : '')
        },
        submittedAt: project.created_at || project.createdAt || new Date().toISOString()
      };
      
      // Store the formatted project data in localStorage
      localStorage.setItem('lastSubmittedProject', JSON.stringify(formattedProject));
      
      // Navigate to the bid card form with a query parameter to show the view
      router.push('/bid-card?view=true');
    } catch (error) {
      console.error('Error viewing project:', error);
      toast({
        title: 'Error',
        description: 'Failed to view project details. Please try again.',
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
            Unknown
          </div>
        );
    }
  };

  // Format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          onClick={handleCreateNewProject}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Create New Project
        </Button>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 transition-all"
          >
            Active Projects
          </TabsTrigger>
          <TabsTrigger 
            value="drafts"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 transition-all"
          >
            Drafts
          </TabsTrigger>
          <TabsTrigger 
            value="completed"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 transition-all"
          >
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState onCreateProject={handleCreateNewProject} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onViewDetails={handleViewProject} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Toaster />
    </div>
  );
}
