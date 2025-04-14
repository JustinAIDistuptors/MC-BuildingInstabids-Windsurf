'use client';

import React from 'react';

interface TimelineStep {
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
}

interface ProjectStatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export default function ProjectStatusTimeline({ 
  steps, 
  className = '' 
}: ProjectStatusTimelineProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-1/2 transform -translate-y-1/2 z-0"></div>
        
        {/* Steps */}
        {steps.map((step, index) => (
          <div key={index} className="relative z-10 flex flex-col items-center">
            {/* Circle indicator */}
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center
                ${step.status === 'completed' ? 'bg-green-500' : 
                  step.status === 'current' ? 'bg-blue-500 ring-4 ring-blue-100' : 
                  'bg-gray-200'}`}
            >
              {step.status === 'completed' && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            
            {/* Label */}
            <div className="mt-2 text-xs font-medium text-center">
              <div className={`
                ${step.status === 'completed' ? 'text-green-600' : 
                  step.status === 'current' ? 'text-blue-600 font-semibold' : 
                  'text-gray-500'}`}
              >
                {step.label}
              </div>
              {step.date && (
                <div className="text-xs text-gray-400 mt-0.5">{step.date}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
