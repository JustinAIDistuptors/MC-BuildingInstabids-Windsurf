'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import ProjectCard, { formatLocation } from '@/components/projects/ProjectCard';

export default function SharedProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        // In a real app, this would be an API call to get the project by ID
        // For now, we'll use localStorage
        const localProjectsString = localStorage.getItem('mock_projects');
        const localProjects = localProjectsString ? JSON.parse(localProjectsString) : [];
        
        const foundProject = localProjects.find((p: any) => p.id === projectId);
        
        if (foundProject) {
          setProject(foundProject);
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // Generate a shareable link for this project
  const getShareableLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared-project/${projectId}`;
  };

  // Function to copy link to clipboard
  const copyLinkToClipboard = () => {
    const link = getShareableLink();
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  // Function to share via email
  const shareViaEmail = () => {
    const link = getShareableLink();
    const subject = encodeURIComponent(`Check out this project: ${project?.title || 'Project'}`);
    const body = encodeURIComponent(`I wanted to share this project with you: ${link}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
          {error || 'Project not found'}
        </div>
        <Link href="/">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Return to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
            <p className="text-blue-100">{formatLocation(project.location)}</p>
          </div>

          {/* Project Card */}
          <div className="p-6">
            <ProjectCard 
              project={project}
              showDeleteButton={false}
              linkToDetails={false}
              className="w-full"
              imageUrl={project.imageUrl || '/placeholder-project.jpg'}
            />
          </div>

          {/* Sharing Options */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <h2 className="text-lg font-semibold mb-4">Share this Project</h2>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={copyLinkToClipboard}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Copy Link
              </Button>
              <Button 
                onClick={shareViaEmail}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Email
              </Button>
            </div>
          </div>

          {/* Contractor CTA */}
          <div className="border-t border-gray-200 p-6 bg-blue-50">
            <h2 className="text-lg font-semibold mb-2">Are you a contractor?</h2>
            <p className="mb-4 text-gray-600">Interested in bidding on this project? Sign up or log in to submit your bid.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup?type=contractor">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Sign Up as Contractor
                </Button>
              </Link>
              <Link href="/login?redirect=shared-project">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
