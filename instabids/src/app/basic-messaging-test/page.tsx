'use client';

import React from 'react';
import BasicMessaging from '@/components/messaging/BasicMessaging';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BasicMessagingTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Basic Messaging Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Messaging Component</CardTitle>
        </CardHeader>
        <CardContent>
          <BasicMessaging projectId="test-project-123" />
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">About This Component</h2>
        <p className="mb-4">
          This is a simplified messaging component that demonstrates the basic UI without any complex dependencies.
          It uses static mock data for demonstration purposes.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>No external icon libraries</li>
          <li>Simple React state management</li>
          <li>Basic Tailwind styling</li>
          <li>Minimal TypeScript interfaces</li>
        </ul>
      </div>
    </div>
  );
}
