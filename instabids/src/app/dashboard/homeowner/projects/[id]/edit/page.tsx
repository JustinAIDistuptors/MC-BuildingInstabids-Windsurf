'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BidCardForm } from '@/components/projects/BidCardForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BidCardService } from '@/services/bid-card-service';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';

interface EditProjectPageProps {
  params: {
    id: string;
  };
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = params;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bidCardData, setBidCardData] = useState(null);

  // Fetch bid card data when component mounts
  useEffect(() => {
    async function fetchBidCard() {
      try {
        setLoading(true);
        const bidCard = await BidCardService.getBidCard(id);
        setBidCardData(bidCard);
      } catch (err) {
        console.error('Error fetching bid card:', err);
        setError('Failed to load project data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load project data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchBidCard();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !bidCardData) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Link href={`/dashboard/homeowner/projects/${id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
          </Link>
        </div>
        
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Project</h3>
          <p className="text-gray-500 mb-4">
            {error || "The project couldn't be loaded. It may have been deleted or you don't have permission to view it."}
          </p>
          <Link href="/dashboard/homeowner/projects">
            <Button>Go to My Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/homeowner/projects/${id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
      <p className="text-gray-600 mb-8">
        Make changes to your project details below.
      </p>
      
      <BidCardForm initialData={bidCardData} />
      
      <Toaster />
    </div>
  );
}
