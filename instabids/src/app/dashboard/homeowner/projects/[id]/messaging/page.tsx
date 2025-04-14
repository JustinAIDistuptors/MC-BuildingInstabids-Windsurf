'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ContractorMessaging from '@/components/messaging/ContractorMessaging';
import { supabase } from '@/lib/supabase/client';

export default function ProjectMessagingPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch project details
  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        setError(null);
        
        if (!projectId) {
          setError('No project ID provided');
          return;
        }
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setProject(data);
        } else {
          setError('Project not found');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProject();
  }, [projectId]);
  
  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Link href={`/dashboard/homeowner/projects/${projectId}`} passHref>
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {loading ? 'Loading...' : project?.title || 'Project Messages'}
        </h1>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/homeowner/projects">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ContractorMessaging 
          projectId={projectId} 
          projectTitle={project?.title || 'Untitled Project'} 
        />
      )}
    </div>
  );
}
