'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContractorMessaging from '@/components/messaging/ContractorMessaging';

export default function TestMessagingPage() {
  const [projectId, setProjectId] = useState<string>('test-project-1');
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]);

  // Override console.log to capture messages
  if (typeof window !== 'undefined' && !showConsole) {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      setConsoleMessages(prev => [...prev, `LOG: ${args.map(a => JSON.stringify(a)).join(' ')}`]);
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      setConsoleMessages(prev => [...prev, `ERROR: ${args.map(a => JSON.stringify(a)).join(' ')}`]);
    };
  }

  // Clear localStorage for fresh testing
  const clearStorage = () => {
    localStorage.removeItem(`contractors_${projectId}`);
    localStorage.removeItem(`messages_${projectId}`);
    window.location.reload();
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Contractor Messaging Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Button onClick={() => setProjectId('test-project-1')}>
              Project 1 {projectId === 'test-project-1' && '(Active)'}
            </Button>
            <Button onClick={() => setProjectId('test-project-2')}>
              Project 2 {projectId === 'test-project-2' && '(Active)'}
            </Button>
            <Button variant="destructive" onClick={clearStorage}>
              Clear Storage
            </Button>
            <Button variant="outline" onClick={() => setShowConsole(!showConsole)}>
              {showConsole ? 'Hide Console' : 'Show Console'}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Active Project ID: <code>{projectId}</code>
          </p>
          
          {showConsole && (
            <div className="bg-black text-green-400 p-4 rounded-md mb-4 h-48 overflow-y-auto font-mono text-xs">
              {consoleMessages.length === 0 ? (
                <p>No console messages yet.</p>
              ) : (
                consoleMessages.map((msg, i) => (
                  <div key={i} className="mb-1">
                    {msg}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="messaging">
        <TabsList className="mb-4">
          <TabsTrigger value="messaging">Messaging Component</TabsTrigger>
          <TabsTrigger value="storage">Local Storage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="messaging">
          <div className="grid grid-cols-1 gap-6">
            <ContractorMessaging 
              projectId={projectId} 
              projectTitle={`Test Project ${projectId.split('-').pop()}`} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Local Storage Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Contractors</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    {localStorage.getItem(`contractors_${projectId}`) 
                      ? JSON.stringify(JSON.parse(localStorage.getItem(`contractors_${projectId}`) || '[]'), null, 2) 
                      : 'No data'}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Messages</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    {localStorage.getItem(`messages_${projectId}`) 
                      ? JSON.stringify(JSON.parse(localStorage.getItem(`messages_${projectId}`) || '[]'), null, 2) 
                      : 'No data'}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
