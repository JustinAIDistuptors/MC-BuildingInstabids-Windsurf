'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export default function TestSimplePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Test Simple Page</h1>
      <p className="mb-4">This is a simple test page to verify that basic rendering is working.</p>
      <Button onClick={() => alert('Button clicked!')}>Click Me</Button>
    </div>
  );
}
