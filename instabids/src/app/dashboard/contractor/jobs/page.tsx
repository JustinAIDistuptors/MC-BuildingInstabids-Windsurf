'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProjectCard from "@/components/projects/ProjectCard";
import { ContractorService } from "@/services/ContractorService";
import { toast } from "sonner";

// Define the Project type
interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  bid_status: string;
  budget_min: number;
  budget_max: number;
  city: string;
  state: string;
  created_at: string;
  owner_id: string;
  job_type_id?: string;
  job_category_id?: string;
  property_size?: string;
  square_footage?: number;
  timeline_horizon?: string;
  location?: {
    city: string;
    state: string;
  };
  media?: any[];
}

export default function ContractorJobsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setFilteredProjects(projects);
      return;
    }
    
    const filtered = projects.filter(
      project => 
        project.title.toLowerCase().includes(value.toLowerCase()) ||
        project.description.toLowerCase().includes(value.toLowerCase()) ||
        (project.job_type_id && project.job_type_id.toLowerCase().includes(value.toLowerCase())) ||
        (project.job_category_id && project.job_category_id.toLowerCase().includes(value.toLowerCase()))
    );
    
    setFilteredProjects(filtered);
  };

  // Handle view project details
  const handleViewProjectDetails = (project: Project) => {
    router.push(`/dashboard/contractor/jobs/${project.id}`);
  };

  // Handle navigation back to dashboard
  const handleNavigateToDashboard = () => {
    router.push('/dashboard/contractor');
  };

  // Fetch jobs data
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setError(null);
      
      try {
        // Check authentication status
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Authentication error. Please sign in again.");
          setLoading(false);
          return;
        }
        
        if (!sessionData.session) {
          setError("Please sign in to view available jobs.");
          setLoading(false);
          return;
        }
        
        setIsAuthenticated(true);
        
        // Using the ContractorService to fetch data following the Magic MCP Integration pattern
        try {
          const projectsData = await ContractorService.getAllAvailableProjects();
          setProjects(projectsData);
          setFilteredProjects(projectsData);
        } catch (err) {
          console.error('Error fetching projects:', err);
          setError('Failed to load projects');
          setProjects([]);
          setFilteredProjects([]);
        }
      } catch (err: any) {
        console.error('Error fetching projects:', err);
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobs();
  }, []);

  if (!isAuthenticated && error?.includes("sign in")) {
    return (
      <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md mb-4">
        <p>Please sign in to view available jobs.</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => router.push('/login')}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Available Projects</h1>
          <p className="text-gray-500">Browse and bid on available projects</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleNavigateToDashboard}
        >
          Back to Dashboard
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects by title, description, or category..."
            className="w-full p-3 border border-gray-300 rounded-lg pr-10"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <span className="absolute right-3 top-3 text-gray-400">
            🔍
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500">Loading available projects...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
          <div className="bg-red-50 rounded-full p-6 mb-4 flex items-center justify-center">
            <span className="text-3xl font-bold text-red-500">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Error Loading Projects</h3>
          <p className="text-gray-500 mb-6 max-w-md">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            Try Again
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
          <div className="bg-gray-100 rounded-full p-6 mb-4 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">🏢</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">No Projects Available</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            {searchTerm ? 'No projects match your search criteria. Try adjusting your search terms.' : 'There are no projects available at the moment. Check back later for new opportunities.'}
          </p>
          {searchTerm && (
            <Button 
              onClick={() => setSearchTerm('')}
              variant="outline"
              className="flex items-center gap-2 mb-4"
            >
              Clear Search
            </Button>
          )}
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex items-center gap-2"
          >
            Refresh Projects
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="relative group">
              <ProjectCard 
                key={project.id} 
                project={project}
                showDeleteButton={false}
                showShareButton={false}
                className="h-full"
              />
              
              {/* Hover Action */}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                <Button 
                  onClick={() => handleViewProjectDetails(project)}
                >
                  View Details & Bid
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Button 
          variant="outline" 
          onClick={handleNavigateToDashboard}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
