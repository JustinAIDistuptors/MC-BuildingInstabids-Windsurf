'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SimpleBidCardMessaging from '@/components/messaging/SimpleBidCardMessaging';

export default function MessagingDemoPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Messaging Demo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Messaging Component</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleBidCardMessaging />
        </CardContent>
      </Card>
    </div>
  );
}
