'use client';

import React, { useState, useEffect } from 'react';
import EnhancedMessaging from '@/components/messaging/EnhancedMessaging';
import { DebugMessaging } from '@/components/debug-messaging';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toaster';

export default function MessagingTestPage() {
  const [showComponent, setShowComponent] = useState(true);
  const [errorLog, setErrorLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('component');
  const [projectId, setProjectId] = useState('test-project-1');
  const [debugEnabled, setDebugEnabled] = useState(false);

  // Reset component
  const resetComponent = () => {
    setShowComponent(false);
    setTimeout(() => setShowComponent(true), 100);
  };

  // Clear localStorage (for testing)
  const clearStorage = () => {
    localStorage.clear();
    setErrorLog(prev => [...prev, `${new Date().toLocaleTimeString()}: Local storage cleared`]);
    resetComponent();
  };

  // Log errors to console (this is separate from the ErrorBoundary)
  useEffect(() => {
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      // Call the original console.error
      originalConsoleError(...args);
      
      // Add to our error log if it's a real error
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Error')) {
        const errorMessage = `${new Date().toLocaleTimeString()}: ${args[0]}`;
        setErrorLog(prev => [...prev, errorMessage]);
      }
    };
    
    // Cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <Toaster />
      
      <h1 className="text-3xl font-bold mb-6">Contractor Messaging Test</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="component">Component</TabsTrigger>
          <TabsTrigger value="controls">Test Controls</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>
        
        <TabsContent value="component" className="mt-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            {showComponent ? (
              <ErrorBoundary
                fallback={
                  <div className="text-center p-8">
                    <h3 className="text-xl font-medium mb-4">Component Error</h3>
                    <p className="mb-4">The messaging component encountered an error.</p>
                    <Button onClick={resetComponent}>Reset Component</Button>
                  </div>
                }
              >
                {/* Debug Messaging component is added here but only renders when debug is enabled */}
                {debugEnabled && <DebugMessaging />}
                <EnhancedMessaging projectId={projectId} />
              </ErrorBoundary>
            ) : (
              <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
                <p className="text-gray-500">Component is reset...</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="controls" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Component Controls</h3>
                  <div className="space-y-2">
                    <Button onClick={resetComponent} variant="outline">
                      Reset Component
                    </Button>
                    <Button onClick={clearStorage} variant="outline" className="ml-2">
                      Clear LocalStorage
                    </Button>
                    <Button 
                      onClick={() => setDebugEnabled(!debugEnabled)} 
                      variant={debugEnabled ? "default" : "outline"} 
                      className="ml-2"
                    >
                      {debugEnabled ? "Disable Debug" : "Enable Debug"}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Project ID</h3>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="flex-1 p-2 border rounded"
                      placeholder="Enter project ID"
                    />
                    <Button onClick={resetComponent} variant="outline">
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Error Log</h3>
                <div className="bg-gray-100 p-4 rounded-md h-[200px] overflow-y-auto">
                  {errorLog.length === 0 ? (
                    <p className="text-gray-500">No errors logged</p>
                  ) : (
                    <ul className="space-y-1">
                      {errorLog.map((error, index) => (
                        <li key={index} className="text-red-600 text-sm font-mono">
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">About This Component</h3>
                <p className="text-gray-700">
                  This is a simplified version of the contractor messaging component that uses the ContractorMessagingService
                  to communicate with contractors about projects. It demonstrates the core functionality of the messaging system.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Debug Mode</h3>
                <p className="text-gray-700">
                  When debug mode is enabled, the DebugMessaging component will monitor and log all file upload operations
                  and message attachments. This helps diagnose issues with file uploads to the Supabase storage bucket.
                </p>
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-medium text-yellow-800">Debugging Tips:</h4>
                  <ul className="list-disc pl-5 mt-1 text-sm text-yellow-700">
                    <li>Enable debug mode before testing file uploads</li>
                    <li>Check the browser console for detailed logs</li>
                    <li>Verify that the 'message-attachments' bucket exists in Supabase</li>
                    <li>Test with small image files first (under 1MB)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
