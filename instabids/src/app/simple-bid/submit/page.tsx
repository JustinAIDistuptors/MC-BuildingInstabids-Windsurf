'use client';

import { useSearchParams } from 'next/navigation';

export default function SubmitSuccessPage() {
  // Use the useSearchParams hook to safely get URL parameters
  const searchParams = useSearchParams();
  
  // Get the form data from URL params
  const projectType = searchParams.get('type') || 'unknown';
  const title = searchParams.get('title') || 'Untitled Project';
  const address = searchParams.get('address');
  const city = searchParams.get('city');
  const zipCode = searchParams.get('zipCode');
  const budget = searchParams.get('budget');
  const timeline = searchParams.get('timeline');
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-green-800 mb-2">Project Submitted Successfully!</h1>
        <p className="text-green-700">
          Your project has been submitted and will be visible to contractors soon.
        </p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Project Summary</h2>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
          <div className="font-medium">Project Type:</div>
          <div>{projectType}</div>
          
          <div className="font-medium">Title:</div>
          <div>{title}</div>
          
          <div className="font-medium">Address:</div>
          <div>{address}</div>
          
          <div className="font-medium">City:</div>
          <div>{city}</div>
          
          <div className="font-medium">ZIP Code:</div>
          <div>{zipCode}</div>
          
          <div className="font-medium">Budget Range:</div>
          <div>{budget}</div>
          
          <div className="font-medium">Timeline:</div>
          <div>
            {timeline === 'asap' && 'As soon as possible'}
            {timeline === '1week' && 'Within 1 week'}
            {timeline === '2weeks' && 'Within 2 weeks'}
            {timeline === '1month' && 'Within 1 month'}
            {timeline === 'flexible' && 'Flexible timeline'}
          </div>
        </div>
        
        <div className="flex gap-4">
          <a 
            href="/dashboard/homeowner/projects" 
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            View My Projects
          </a>
          <a 
            href="/simple-bid" 
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Create Another Project
          </a>
        </div>
        
        {/* Add client-side script to store the project in localStorage */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Store the project in localStorage
          const newProject = {
            id: "mock-${Date.now()}",
            job_type_id: "${projectType}",
            title: "${title || 'Untitled Project'}",
            description: "Project details will be added later",
            budget_min: 1000,
            budget_max: 5000,
            address: "${address || ''}",
            city: "${city || ''}",
            zipCode: "${zipCode || ''}",
            timeline_horizon_id: "${timeline || 'flexible'}",
            status: "published",
            bid_status: "accepting_bids",
            location: {
              address_line1: "${address || ''}",
              city: "${city || ''}",
              state: "FL",
              zip_code: "${zipCode || ''}"
            },
            created_at: new Date().toISOString()
          };
          
          // Get existing projects from localStorage
          const existingProjectsString = localStorage.getItem('mock_projects');
          const existingProjects = existingProjectsString ? JSON.parse(existingProjectsString) : [];
          
          // Add the new project
          existingProjects.push(newProject);
          
          // Save back to localStorage
          localStorage.setItem('mock_projects', JSON.stringify(existingProjects));
          
          console.log("Project saved to localStorage:", newProject);
        ` }}></script>
      </div>
    </div>
  );
}
