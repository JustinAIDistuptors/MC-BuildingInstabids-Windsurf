"use client";

import { useState } from "react";

export default function HomeownerAcquisitionPage() {
  const [isConfigEnabled, setIsConfigEnabled] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Homeowner Acquisition Agent</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Agent Status:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isConfigEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}>
            {isConfigEnabled ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Agent Configuration</h2>
          
          {/* This is the main area where your agent building system would integrate */}
          <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center">
            <p className="text-gray-500 mb-2">
              This is the integration point for your homeowner acquisition agent system.
            </p>
            <p className="text-sm text-gray-400">
              Your agent building system can access and modify this section through the API.
            </p>
            
            {/* Placeholder toggles that would be controlled by the agent system */}
            <div className="mt-4 flex items-center justify-center space-x-6">
              <ToggleSwitch
                label="Enable Agent"
                isEnabled={isConfigEnabled}
                onChange={setIsConfigEnabled}
              />
            </div>
          </div>
        </div>
        
        {/* API Documentation Section */}
        <div className="bg-gray-50 px-6 py-4">
          <h3 className="text-sm font-medium text-gray-900">API Endpoints</h3>
          <div className="mt-2 text-sm text-gray-500">
            <p className="mb-1">• GET /api/admin/agent-integration/homeowner-acquisition/config</p>
            <p className="mb-1">• POST /api/admin/agent-integration/homeowner-acquisition/config</p>
            <p className="mb-1">• GET /api/admin/agent-integration/homeowner-acquisition/stats</p>
            <p>• POST /api/admin/agent-integration/homeowner-acquisition/activate</p>
          </div>
        </div>
      </div>
      
      {/* Stats Section - Will be populated by the agent */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Outreach" value="0" />
          <StatCard label="Conversions" value="0" />
          <StatCard label="Active Campaigns" value="0" />
        </div>
      </div>
      
      {/* Activity Log Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Activity Log</h2>
        <div className="border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 text-sm font-medium text-gray-500">
            No activity logs available
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for toggle switches
function ToggleSwitch({ 
  label, 
  isEnabled, 
  onChange 
}: { 
  label: string; 
  isEnabled: boolean; 
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center">
      <label className="mr-3 text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isEnabled ? "bg-blue-600" : "bg-gray-200"
        }`}
        role="switch"
        aria-checked={isEnabled}
        onClick={() => onChange(!isEnabled)}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isEnabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// Component for stat cards
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
