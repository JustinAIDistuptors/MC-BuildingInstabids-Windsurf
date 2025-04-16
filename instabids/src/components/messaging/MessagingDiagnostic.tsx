'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { ContractorMessagingService } from '@/services/ContractorMessagingService';

interface MessagingDiagnosticProps {
  projectId: string;
}

export default function MessagingDiagnostic({ projectId }: MessagingDiagnosticProps) {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const supabase = createClientComponentClient<Database>();
  
  // Get current user data
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (err) {
        console.error('Error getting user data:', err);
      }
    };
    
    getUserData();
  }, []);
  
  // Run diagnostic tests
  const runDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const diagnosticResults: any = {
        projectId,
        userId,
        timestamp: new Date().toISOString(),
        tests: {}
      };
      
      // Test 1: Check if contractor_aliases table exists and has data for this project
      try {
        const { data: aliases, error: aliasesError } = await supabase
          .from('contractor_aliases')
          .select('*')
          .eq('project_id', projectId);
        
        diagnosticResults.tests.aliasesTable = {
          success: !aliasesError,
          error: aliasesError?.message,
          data: aliases,
          count: aliases?.length || 0
        };
      } catch (err: any) {
        diagnosticResults.tests.aliasesTable = {
          success: false,
          error: err.message,
          data: null,
          count: 0
        };
      }
      
      // Test 2: Check if messages exist for this project
      try {
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('project_id', projectId);
        
        diagnosticResults.tests.messagesTable = {
          success: !messagesError,
          error: messagesError?.message,
          data: messages,
          count: messages?.length || 0
        };
      } catch (err: any) {
        diagnosticResults.tests.messagesTable = {
          success: false,
          error: err.message,
          data: null,
          count: 0
        };
      }
      
      // Test 3: Check if bids exist for this project
      try {
        const { data: bids, error: bidsError } = await supabase
          .from('bids')
          .select('*')
          .eq('project_id', projectId);
        
        diagnosticResults.tests.bidsTable = {
          success: !bidsError,
          error: bidsError?.message,
          data: bids,
          count: bids?.length || 0
        };
      } catch (err: any) {
        diagnosticResults.tests.bidsTable = {
          success: false,
          error: err.message,
          data: null,
          count: 0
        };
      }
      
      // Test 4: Try to assign contractor aliases
      try {
        const result = await ContractorMessagingService.assignContractorAliases(projectId);
        
        diagnosticResults.tests.assignAliases = {
          success: result,
          error: null,
          data: { result }
        };
      } catch (err: any) {
        diagnosticResults.tests.assignAliases = {
          success: false,
          error: err.message,
          data: null
        };
      }
      
      // Test 5: Get contractors with aliases
      try {
        const contractors = await ContractorMessagingService.getContractorsWithAliases(projectId);
        
        diagnosticResults.tests.getContractors = {
          success: true,
          error: null,
          data: contractors,
          count: contractors?.length || 0
        };
      } catch (err: any) {
        diagnosticResults.tests.getContractors = {
          success: false,
          error: err.message,
          data: null,
          count: 0
        };
      }
      
      // Test 6: Get messages
      try {
        const messages = await ContractorMessagingService.getMessages(projectId);
        
        diagnosticResults.tests.getMessages = {
          success: true,
          error: null,
          data: messages,
          count: messages?.length || 0
        };
      } catch (err: any) {
        diagnosticResults.tests.getMessages = {
          success: false,
          error: err.message,
          data: null,
          count: 0
        };
      }
      
      setDiagnosticData(diagnosticResults);
    } catch (err: any) {
      console.error('Error running diagnostics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Format JSON for display
  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };
  
  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Messaging System Diagnostics</h2>
      
      <div className="mb-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {diagnosticData && (
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-semibold">Project ID: {diagnosticData.projectId}</h3>
            <p className="text-sm">User ID: {diagnosticData.userId}</p>
            <p className="text-sm">Timestamp: {new Date(diagnosticData.timestamp).toLocaleString()}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-md font-semibold">Test Results:</h3>
            
            {Object.entries(diagnosticData.tests).map(([testName, testResult]: [string, any]) => (
              <div key={testName} className="border rounded p-3">
                <h4 className="font-medium">{testName}</h4>
                <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {testResult.success ? 'Success' : 'Failed'}
                  {testResult.count !== undefined && ` (${testResult.count} items)`}
                </p>
                {testResult.error && (
                  <p className="text-sm text-red-600">Error: {testResult.error}</p>
                )}
                {testResult.data && testResult.count > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer">View Data</summary>
                    <pre className="text-xs bg-gray-100 p-2 mt-1 overflow-auto max-h-40 rounded">
                      {formatJson(testResult.data)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
