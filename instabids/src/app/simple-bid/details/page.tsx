'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectDetailsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Get the project type from URL params
  const projectType = searchParams.type || 'unknown';
  const router = useRouter();
  
  // State for form data
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    city: '',
    zipCode: '',
    budget: '',
    timeline: ''
  });
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create project object
    const newProject = {
      id: `mock-${Date.now()}`,
      job_type_id: projectType as string,
      job_category_id: projectType as string,
      title: formData.title || `New ${projectType} Project`,
      description: "Project details will be added later",
      location: {
        address_line1: formData.address,
        city: formData.city,
        zip_code: formData.zipCode
      },
      zip_code: formData.zipCode,
      budget_min: 1000,
      budget_max: 5000,
      timeline_horizon_id: formData.timeline || 'flexible',
      status: "published",
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
    
    // Redirect to submit confirmation page
    router.push(`/simple-bid/submit?id=${newProject.id}&type=${projectType}&title=${formData.title}&address=${formData.address}&city=${formData.city}&zipCode=${formData.zipCode}&budget=${formData.budget}&timeline=${formData.timeline}`);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Project Details: {projectType}</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="mb-4">
          Fill in your project information below.
        </p>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Project Information:</h2>
          
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="type" value={String(projectType)} />
            
            <div className="mb-4">
              <label className="block mb-2">Project Title</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border rounded" 
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Address</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-2 border rounded" 
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2">City</label>
                <input 
                  type="text" 
                  name="city" 
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-2 border rounded" 
                  required
                />
              </div>
              <div>
                <label className="block mb-2">ZIP Code</label>
                <input 
                  type="text" 
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full p-2 border rounded" 
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Budget Range</label>
              <input 
                type="text" 
                name="budget" 
                value={formData.budget}
                onChange={handleChange}
                className="w-full p-2 border rounded" 
                placeholder="e.g. $1000-$5000"
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Timeline</label>
              <select 
                name="timeline" 
                value={formData.timeline}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select your timeline</option>
                <option value="asap">As soon as possible</option>
                <option value="1week">Within 1 week</option>
                <option value="2weeks">Within 2 weeks</option>
                <option value="1month">Within 1 month</option>
                <option value="flexible">Flexible timeline</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <a 
                href="/simple-bid" 
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Back
              </a>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Submit Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
