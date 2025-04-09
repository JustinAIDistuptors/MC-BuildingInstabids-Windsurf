'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent } from 'react';
import { BidCard, JobSize } from '@/types/bidding';

// Using a mock API endpoint that doesn't require authentication
export default function BasicFormPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    projectType: '',
    projectCategory: '',
    title: '',
    description: 'Project details will be added later',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    timeline: '',
    budget: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to create a valid BidCard object from our form state
  const createBidCardData = (): BidCard => {
    // Parse budget values or use defaults
    let budgetMin: number | undefined;
    let budgetMax: number | undefined;
    
    if (formState.budget) {
      const budgetParts = formState.budget.split('-');
      if (budgetParts[0]) {
        budgetMin = parseFloat(budgetParts[0].replace(/[^0-9.]/g, '')) || 0;
      }
      if (budgetParts[1]) {
        budgetMax = parseFloat(budgetParts[1].replace(/[^0-9.]/g, '')) || 0;
      }
    }
    
    return {
      job_type_id: formState.projectType || 'one-time', // Default value
      job_category_id: formState.projectCategory || 'other', // Default value
      intention_type_id: formState.projectType || 'one-time', // Default value
      title: formState.title || `New ${formState.projectCategory || 'Project'}`,
      description: formState.description || 'Project details will be added later',
      location: {
        address_line1: formState.address || 'Address pending',
        city: formState.city || 'City pending',
        state: formState.state || 'State pending',
        zip_code: formState.zipCode || '00000',
        country: 'USA'
      },
      zip_code: formState.zipCode || '00000',
      budget_min: budgetMin || 0,
      budget_max: budgetMax || 1000,
      timeline_horizon_id: formState.timeline || 'flexible',
      group_bidding_enabled: false,
      visibility: 'public' as const,
      job_size: JobSize.Medium,
    };
  };

  // Simple function to store project locally for demo purposes
  const storeMockProject = (project: any) => {
    try {
      // Get existing projects from localStorage
      const existingProjects = localStorage.getItem('mock_projects');
      let projects = existingProjects ? JSON.parse(existingProjects) : [];
      
      // Add new project with ID and timestamp
      const newProject = {
        ...project,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      
      projects.push(newProject);
      
      // Save back to localStorage
      localStorage.setItem('mock_projects', JSON.stringify(projects));
      
      return newProject;
    } catch (err) {
      console.error('Error storing mock project:', err);
      return project;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Get BidCard data from form
      const bidCardData = createBidCardData();
      
      // For now, just store in localStorage to avoid API issues
      const savedProject = storeMockProject({
        ...bidCardData,
        status: 'published'
      });
      
      console.log('Project saved locally:', savedProject);
      
      setSuccessMessage('Project submitted successfully! (Data stored locally for demo purposes)');
      
      // Don't redirect immediately, show success message first
      setTimeout(() => {
        router.push('/dashboard/homeowner/projects');
      }, 3000);
    } catch (err) {
      console.error('Error submitting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Get BidCard data from form
      const bidCardData = createBidCardData();
      
      // For now, just store in localStorage to avoid API issues
      const savedDraft = storeMockProject({
        ...bidCardData,
        status: 'draft'
      });
      
      console.log('Draft saved locally:', savedDraft);
      
      setSuccessMessage('Draft saved successfully! (Data stored locally for demo purposes)');
      
      // Don't redirect immediately, show success message first
      setTimeout(() => {
        router.push('/dashboard/homeowner/projects');
      }, 3000);
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif' 
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Create New Project</h1>
      
      {successMessage && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#d1fae5', 
          color: '#065f46',
          borderRadius: '4px'
        }}>
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Project Type
          </label>
          <select 
            name="projectType"
            value={formState.projectType}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
            required
          >
            <option value="">Select Project Type</option>
            <option value="one-time">One-Time Project</option>
            <option value="recurring">Recurring Service</option>
            <option value="repair">Repair/Handyman</option>
            <option value="labor">Labor Only</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Project Category
          </label>
          <select 
            name="projectCategory"
            value={formState.projectCategory}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
            required
          >
            <option value="">Select Category</option>
            <option value="kitchen">Kitchen Remodel</option>
            <option value="bathroom">Bathroom Remodel</option>
            <option value="addition">Home Addition</option>
            <option value="deck">Deck/Patio</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Project Title
          </label>
          <input 
            type="text"
            name="title"
            value={formState.title}
            onChange={handleChange}
            placeholder="Give your project a name"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Street Address
          </label>
          <input 
            type="text"
            name="address"
            value={formState.address}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
            required
          />
        </div>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              City
            </label>
            <input 
              type="text"
              name="city"
              value={formState.city}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ccc', 
                borderRadius: '4px' 
              }}
              required
            />
          </div>
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              State
            </label>
            <select 
              name="state"
              value={formState.state}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ccc', 
                borderRadius: '4px' 
              }}
              required
            >
              <option value="">Select State</option>
              <option value="AL">Alabama</option>
              <option value="AK">Alaska</option>
              <option value="AZ">Arizona</option>
              <option value="CA">California</option>
              <option value="CO">Colorado</option>
              <option value="FL">Florida</option>
              <option value="NY">New York</option>
              <option value="TX">Texas</option>
              {/* Add other states as needed */}
            </select>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            ZIP Code
          </label>
          <input 
            type="text"
            name="zipCode"
            value={formState.zipCode}
            onChange={handleChange}
            maxLength={5}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Timeline
          </label>
          <select 
            name="timeline"
            value={formState.timeline}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
            required
          >
            <option value="">When do you need this project completed?</option>
            <option value="asap">As soon as possible</option>
            <option value="1week">Within 1 week</option>
            <option value="2weeks">Within 2 weeks</option>
            <option value="1month">Within 1 month</option>
            <option value="flexible">Flexible timeline</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Budget Range
          </label>
          <input 
            type="text"
            name="budget"
            value={formState.budget}
            onChange={handleChange}
            placeholder="e.g. $1000-$5000"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
            required
          />
        </div>
        
        {error && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '10px', 
            backgroundColor: '#FFEBEE', 
            color: '#D32F2F',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#2563eb',
              border: '1px solid #2563eb',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            Save as Draft
          </button>
          
          <button 
            type="submit"
            disabled={isSubmitting}
            style={{ 
              backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb', 
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
