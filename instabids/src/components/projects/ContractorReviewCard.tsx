'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ReviewRating {
  category: string;
  score: number;
  maxScore: number;
}

interface ContractorReview {
  id: string;
  reviewer_name: string;
  project_type: string;
  date: string;
  comment: string;
  overall_rating: number;
  ratings: ReviewRating[];
  verified: boolean;
}

interface ContractorReviewCardProps {
  contractorId: string;
  contractorName: string;
  contractorAlias?: string;
  reviews: ContractorReview[];
  averageRating: number;
  totalReviews: number;
  className?: string;
}

export default function ContractorReviewCard({
  contractorId,
  contractorName,
  contractorAlias,
  reviews,
  averageRating,
  totalReviews,
  className = '',
}: ContractorReviewCardProps) {
  // Function to render star rating
  const renderStars = (rating: number, maxRating: number = 5) => {
    return (
      <div className="flex">
        {[...Array(maxRating)].map((_, i) => (
          <svg 
            key={i} 
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {contractorAlias || contractorName} Reviews
          </CardTitle>
          <div className="flex items-center">
            <div className="flex items-center mr-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <span className="text-sm font-medium text-gray-700">{averageRating.toFixed(1)}</span>
            <span className="text-xs text-gray-500 ml-1">({totalReviews})</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Rating summary */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Overall Rating</h3>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-800 mr-2">{averageRating.toFixed(1)}</div>
                <div className="flex flex-col">
                  {renderStars(Math.round(averageRating))}
                  <span className="text-xs text-gray-500 mt-1">{totalReviews} reviews</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Rating Breakdown</h3>
              {reviews.length > 0 && reviews[0]?.ratings?.map((rating, index) => (
                <div key={index} className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{rating.category}</span>
                  <div className="flex items-center">
                    {renderStars(rating.score, rating.maxScore)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Reviews list */}
        <div className="divide-y divide-gray-200">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{review.reviewer_name}</div>
                    <div className="text-xs text-gray-500">{review.project_type} • {review.date}</div>
                  </div>
                  <div className="flex items-center">
                    {renderStars(review.overall_rating)}
                    {review.verified && (
                      <Badge className="ml-2 bg-green-50 text-green-700 border-green-200">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{review.comment}</p>
                
                <div className="flex flex-wrap gap-2">
                  {review.ratings && review.ratings.map((rating, index) => (
                    <div key={index} className="bg-gray-100 rounded px-2 py-1 text-xs">
                      <span className="font-medium text-gray-700">{rating.category}:</span>
                      <span className="ml-1 text-gray-600">{rating.score}/{rating.maxScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No reviews yet for this contractor
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
