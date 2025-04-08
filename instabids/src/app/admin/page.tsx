"use client";

import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Agent Integration Summary Cards */}
          <DashboardCard
            title="Homeowner Acquisition"
            description="View and manage homeowner acquisition agent activities"
            linkHref="/admin/agent-integration/homeowner-acquisition"
            metric="0"
            metricLabel="Active Campaigns"
          />
          
          <DashboardCard
            title="Contractor Recruitment"
            description="View and manage contractor recruitment agent activities"
            linkHref="/admin/agent-integration/contractor-recruitment"
            metric="0"
            metricLabel="Outreach Messages"
          />
          
          <DashboardCard
            title="Property Manager Acquisition"
            description="View and manage property manager acquisition agent activities"
            linkHref="/admin/agent-integration/property-manager-acquisition"
            metric="0"
            metricLabel="Active Campaigns"
          />
          
          <DashboardCard
            title="Labor Networking"
            description="View and manage labor networking agent activities"
            linkHref="/admin/agent-integration/labor-networking"
            metric="0"
            metricLabel="Labor Matches"
          />
        </div>
      )}
    </div>
  );
}

function DashboardCard({ 
  title, 
  description, 
  linkHref, 
  metric, 
  metricLabel 
}: { 
  title: string; 
  description: string; 
  linkHref: string; 
  metric: string; 
  metricLabel: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 flex-grow">{description}</p>
      
      <div className="mt-4">
        <span className="text-3xl font-bold">{metric}</span>
        <span className="text-sm text-gray-500 ml-2">{metricLabel}</span>
      </div>
      
      <a 
        href={linkHref}
        className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
      >
        View details →
      </a>
    </div>
  );
}
