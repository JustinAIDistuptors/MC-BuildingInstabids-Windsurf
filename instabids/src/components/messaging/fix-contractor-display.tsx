'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fixContractorMessageDisplay, markMessageAsFromContractor } from '@/lib/fix-contractor-messages';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface FixContractorDisplayProps {
  projectId: string;
}

/**
 * Component to fix contractor message display issues
 */
export default function FixContractorDisplay({ projectId }: FixContractorDisplayProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [messageId, setMessageId] = useState('');
  
  const handleFixAll = async () => {
    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }
    
    try {
      setLoading(true);
      const result = await fixContractorMessageDisplay(projectId);
      
      if (result.success) {
        toast.success(result.message);
        setResult(result);
      } else {
        toast.error(result.error || 'Failed to fix contractor messages');
      }
    } catch (err) {
      console.error('Error fixing contractor messages:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFixSingle = async () => {
    if (!messageId) {
      toast.error('Message ID is required');
      return;
    }
    
    try {
      setLoading(true);
      const result = await markMessageAsFromContractor(messageId);
      
      if (result.success) {
        toast.success('Message updated successfully');
        setResult(result);
        setMessageId('');
      } else {
        toast.error(result.error || 'Failed to update message');
      }
    } catch (err) {
      console.error('Error updating message:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Fix Contractor Messages</CardTitle>
        <CardDescription>
          Use these tools to fix contractor message display issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Fix All Messages</h3>
          <p className="text-sm text-muted-foreground mb-2">
            This will scan all messages in the project and fix contractor identification
          </p>
          <Button 
            onClick={handleFixAll} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : 'Fix All Contractor Messages'}
          </Button>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-2">Fix Single Message</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Mark a specific message as being from a contractor
          </p>
          <div className="flex space-x-2">
            <Input
              placeholder="Message ID"
              value={messageId}
              onChange={(e) => setMessageId(e.target.value)}
              disabled={loading}
            />
            <Button 
              onClick={handleFixSingle} 
              disabled={loading || !messageId}
              variant="outline"
            >
              Fix
            </Button>
          </div>
        </div>
        
        {result && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <h4 className="font-medium mb-1">Result:</h4>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Project ID: {projectId}
        </p>
      </CardFooter>
    </Card>
  );
}
