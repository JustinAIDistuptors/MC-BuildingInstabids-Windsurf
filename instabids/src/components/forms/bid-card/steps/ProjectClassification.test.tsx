'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import ProjectClassification from './ProjectClassification';
import { validateRadixComponentStructure } from '@/components/test-utils/component-tester';

// Test wrapper component with proper React Hook Form context
function ProjectClassificationWrapper() {
  const methods = useForm({
    defaultValues: {
      job_type_id: ''
    }
  });
  
  const [mediaFiles, setMediaFiles] = React.useState<File[]>([]);
  
  return (
    <FormProvider {...methods}>
      <ProjectClassification 
        mediaFiles={mediaFiles}
        setMediaFiles={setMediaFiles}
      />
    </FormProvider>
  );
}

// Component structure validation
describe('ProjectClassification Component Structure', () => {
  it('validates Radix UI component structure', () => {
    const componentCode = ProjectClassification.toString();
    expect(() => validateRadixComponentStructure('ProjectClassification', componentCode))
      .not.toThrow();
  });
});

// Component rendering and functionality
describe('ProjectClassification Component', () => {
  beforeEach(() => {
    render(<ProjectClassificationWrapper />);
  });
  
  it('renders project type options', () => {
    expect(screen.getByText('What type of project is this?')).toBeInTheDocument();
    expect(screen.getByText('One Off Project 🏗️')).toBeInTheDocument();
    expect(screen.getByText('Continual Service 🔄')).toBeInTheDocument();
    expect(screen.getByText('Repair 🔧')).toBeInTheDocument();
  });
  
  it('allows selecting a project type', () => {
    // Find the "One Off" option and click it
    const oneOffOption = screen.getByText('One Off Project 🏗️');
    fireEvent.click(oneOffOption);
    
    // Check that the option gets selected (has the selected style)
    const oneOffCard = oneOffOption.closest('div[class*="border-blue-500"]');
    expect(oneOffCard).toBeInTheDocument();
  });
});
