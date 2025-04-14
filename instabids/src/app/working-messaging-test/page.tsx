'use client';

import React from 'react';
import WorkingMessaging from '@/components/messaging/WorkingMessaging';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkingMessagingTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Working Messaging Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Messaging Component</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkingMessaging projectId="test-project-123" />
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">About This Component</h2>
        <p className="mb-4">
          This is an extremely simplified messaging component with:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>No external dependencies</li>
          <li>Static mock data</li>
          <li>Basic React state management</li>
          <li>Simple Tailwind styling</li>
        </ul>
        <p className="mt-4">
          Once we confirm this works, we can incrementally build up to the full implementation
          following the established architecture patterns.
        </p>
      </div>
    </div>
  );
}
