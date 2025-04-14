'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ProjectStat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
}

interface ProjectProgressDashboardProps {
  projectId: string;
  projectTitle: string;
  stats: ProjectStat[];
  bidCount: number;
  averageBidAmount: number;
  lowestBidAmount: number;
  highestBidAmount: number;
  daysRemaining: number;
  completionPercentage: number;
  className?: string;
}

export default function ProjectProgressDashboard({
  projectId,
  projectTitle,
  stats,
  bidCount,
  averageBidAmount,
  lowestBidAmount,
  highestBidAmount,
  daysRemaining,
  completionPercentage,
  className = '',
}: ProjectProgressDashboardProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Project header with progress */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{projectTitle}</h2>
            <p className="text-sm text-gray-500">Project ID: {projectId}</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center">
              <div className="mr-4">
                <span className="text-sm font-medium text-gray-500">Overall Progress</span>
                <div className="flex items-center mt-1">
                  <div className="text-xl font-bold text-gray-800">{completionPercentage}%</div>
                  <div className="ml-2 text-sm font-medium text-green-600">
                    On Track
                  </div>
                </div>
              </div>
              
              <div className="h-12 w-12 rounded-full border-4 border-blue-500 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">{daysRemaining}d</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                  
                  {stat.change && (
                    <div className={`flex items-center mt-1 text-sm font-medium
                      ${stat.change.type === 'increase' ? 'text-green-600' : 
                        stat.change.type === 'decrease' ? 'text-red-600' : 
                        'text-gray-500'}`}
                    >
                      {stat.change.type === 'increase' ? (
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : stat.change.type === 'decrease' ? (
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : null}
                      {stat.change.value}%
                    </div>
                  )}
                </div>
                
                {stat.icon && (
                  <div className="bg-blue-50 p-3 rounded-full">
                    {stat.icon}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Bid summary */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Bid Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Total Bids</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{bidCount}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Average Bid</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(averageBidAmount)}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Lowest Bid</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(lowestBidAmount)}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Highest Bid</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(highestBidAmount)}</p>
            </div>
          </div>
          
          {/* Bid range visualization */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">Bid Range</span>
              <span className="text-xs font-medium text-gray-500">{formatCurrency(highestBidAmount)}</span>
            </div>
            <div className="relative w-full h-4 bg-gray-200 rounded-full">
              <div 
                className="absolute left-0 h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                style={{ 
                  width: '100%',
                }}
              ></div>
              <div 
                className="absolute h-6 w-1 bg-green-600 rounded-full transform -translate-y-1"
                style={{ 
                  left: `${(lowestBidAmount / highestBidAmount) * 100}%`,
                }}
              ></div>
              <div 
                className="absolute h-6 w-1 bg-blue-600 rounded-full transform -translate-y-1"
                style={{ 
                  left: `${(averageBidAmount / highestBidAmount) * 100}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-start mt-1">
              <span className="text-xs font-medium text-gray-500">{formatCurrency(lowestBidAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
