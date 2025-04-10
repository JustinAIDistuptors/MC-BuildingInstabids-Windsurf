'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SimpleBidCardPage() {
  const [message, setMessage] = useState('This is a simple bid card page');

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Simple Bid Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{message}</p>
          <Button 
            className="mt-4"
            onClick={() => setMessage('Button clicked!')}
          >
            Click Me
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
