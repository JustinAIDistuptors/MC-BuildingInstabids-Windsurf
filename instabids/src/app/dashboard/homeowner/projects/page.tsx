'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BidCard } from '@/types/bidding';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BidCardService } from '@/services/bid-card-service';
import { Loader2, Plus, FileEdit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function ProjectsPage() {
  const [bidCards, setBidCards] = useState<BidCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch bid cards when the component mounts
  useEffect(() => {
    async function fetchBidCards() {
      try {
        setLoading(true);
        const fetchedBidCards = await BidCardService.getBidCards();
        setBidCards(fetchedBidCards);
      } catch (error) {
        console.error('Error fetching bid cards:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your projects. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchBidCards();
  }, []);

  // Handle deleting a bid card
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      setDeletingId(id);
      await BidCardService.deleteBidCard(id);
      
      // Remove the deleted bid card from state
      setBidCards(bidCards.filter(card => card.id !== id));
      
      toast({
        title: 'Project deleted',
        description: 'Your project has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting bid card:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Link href="/dashboard/homeowner/new-project">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : bidCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first project to start receiving bids from contractors.
          </p>
          <Link href="/dashboard/homeowner/new-project">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bidCards.map((bidCard) => (
            <Card key={bidCard.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{bidCard.title}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {bidCard.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="py-2">
                <div className="flex flex-wrap gap-2 mb-3">
                  {bidCard.job_categories && (
                    <Badge variant="outline">
                      {bidCard.job_categories.display_name || bidCard.job_categories.name}
                    </Badge>
                  )}
                  {bidCard.job_types && (
                    <Badge variant="outline">
                      {bidCard.job_types.display_name || bidCard.job_types.name}
                    </Badge>
                  )}
                  <Badge className={getStatusColor(bidCard.status || 'draft')}>
                    {bidCard.status ? bidCard.status.charAt(0).toUpperCase() + bidCard.status.slice(1) : 'Draft'}
                  </Badge>
                </div>
                
                <div className="text-sm">
                  <p><strong>Budget:</strong> {bidCard.budget ? `$${bidCard.budget.toLocaleString()}` : 'Not specified'}</p>
                  <p><strong>Timeline:</strong> {bidCard.timeline_horizons ? 
                    (bidCard.timeline_horizons.display_name || bidCard.timeline_horizons.name) : 
                    'Not specified'}
                  </p>
                  <p><strong>Created:</strong> {new Date(bidCard.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
              
              <CardFooter className="pt-3 flex justify-between">
                <Link href={`/dashboard/homeowner/projects/${bidCard.id}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
                
                <div className="flex space-x-2">
                  <Link href={`/dashboard/homeowner/projects/${bidCard.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      <FileEdit className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(bidCard.id)}
                    disabled={deletingId === bidCard.id}
                  >
                    {deletingId === bidCard.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Toaster />
    </div>
  );
}
