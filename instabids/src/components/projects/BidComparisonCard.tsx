'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface ContractorBid {
  id: string;
  contractor_id: string;
  contractor_name: string;
  contractor_alias?: string;
  amount: number;
  timeline_days: number;
  description: string;
  created_at: string;
  status: string;
  has_attachments?: boolean;
}

interface BidComparisonCardProps {
  projectId: string;
  bids: ContractorBid[];
  onSelectBid?: (bid: ContractorBid) => void;
  onMessageContractor?: (contractorId: string) => void;
  className?: string;
}

export default function BidComparisonCard({
  projectId,
  bids,
  onSelectBid,
  onMessageContractor,
  className = '',
}: BidComparisonCardProps) {
  const [selectedBids, setSelectedBids] = useState<string[]>([]);
  
  // Toggle bid selection for comparison
  const toggleBidSelection = (bidId: string) => {
    setSelectedBids(prev => 
      prev.includes(bidId) 
        ? prev.filter(id => id !== bidId)
        : [...prev, bidId]
    );
  };
  
  // Get only the selected bids for comparison
  const bidsToCompare = bids.filter(bid => selectedBids.includes(bid.id));
  
  // Find the lowest bid amount
  const lowestBidAmount = Math.min(...bids.map(bid => bid.amount));
  
  // Find the shortest timeline
  const shortestTimeline = Math.min(...bids.map(bid => bid.timeline_days));
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="text-lg font-semibold text-gray-800">Compare Contractor Bids</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Bid selection list */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Select bids to compare:</h3>
          <div className="flex flex-wrap gap-2">
            {bids.map(bid => (
              <Badge
                key={bid.id}
                className={`cursor-pointer ${selectedBids.includes(bid.id) ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                onClick={() => toggleBidSelection(bid.id)}
              >
                {bid.contractor_alias || bid.contractor_name}
                {bid.amount === lowestBidAmount && (
                  <span className="ml-1 text-green-500">$</span>
                )}
                {bid.timeline_days === shortestTimeline && (
                  <span className="ml-1 text-blue-500">⚡</span>
                )}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Comparison table */}
        {bidsToCompare.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contractor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bid Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {bidsToCompare.map(bid => (
                  <tr key={bid.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {bid.contractor_alias || bid.contractor_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`font-medium ${bid.amount === lowestBidAmount ? 'text-green-600' : 'text-gray-900'}`}>
                        {formatCurrency(bid.amount)}
                        {bid.amount === lowestBidAmount && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Lowest</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`${bid.timeline_days === shortestTimeline ? 'text-blue-600' : 'text-gray-900'}`}>
                        {bid.timeline_days} days
                        {bid.timeline_days === shortestTimeline && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Fastest</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-500 truncate max-w-xs">{bid.description}</p>
                      {bid.has_attachments && (
                        <span className="inline-flex items-center text-xs text-gray-500 mt-1">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Has attachments
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button 
                          className="text-xs px-2 py-1"
                          variant="outline" 
                          onClick={() => onSelectBid && onSelectBid(bid)}
                        >
                          View Details
                        </Button>
                        <Button 
                          className="text-xs px-2 py-1"
                          variant="outline" 
                          onClick={() => onMessageContractor && onMessageContractor(bid.contractor_id)}
                        >
                          Message
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Select at least one bid to compare
          </div>
        )}
      </CardContent>
    </Card>
  );
}
