import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/mock-bid-cards/[id]
 * Gets a mock bid card by ID for development purposes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Create a mock bid card with the requested ID
    const mockBidCard = {
      id,
      title: 'Kitchen Renovation Project',
      description: 'Complete kitchen renovation including new cabinets, countertops, and appliances.',
      status: 'active',
      creator_id: 'user-123',
      job_type_id: 'renovation',
      job_category_id: 'kitchen',
      job_size: 'medium',
      intention_type_id: 'upgrade',
      timeline_horizon_id: 'within_3_months',
      timeline_start: '2023-06-01',
      timeline_end: '2023-08-31',
      budget_min: 15000,
      budget_max: 25000,
      zip_code: '78701',
      location: {
        address_line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        zip_code: '78701'
      },
      group_bidding_enabled: false,
      visibility: 'public',
      created_at: '2023-04-15T12:00:00Z',
      updated_at: '2023-04-15T12:00:00Z',
      job_categories: {
        name: 'kitchen',
        display_name: 'Kitchen'
      },
      job_types: {
        name: 'renovation',
        display_name: 'Renovation'
      },
      project_intention_types: {
        name: 'upgrade',
        display_name: 'Upgrade'
      },
      timeline_horizons: {
        name: 'within_3_months',
        display_name: 'Within 3 Months'
      },
      media: [
        {
          id: 'media-1',
          bid_card_id: id,
          media_type: 'photo',
          file_name: 'kitchen-before.jpg',
          content_type: 'image/jpeg',
          size_bytes: 1024000,
          url: 'https://images.unsplash.com/photo-1556911220-bda9f7f7597e?q=80&w=500'
        },
        {
          id: 'media-2',
          bid_card_id: id,
          media_type: 'photo',
          file_name: 'kitchen-inspiration.jpg',
          content_type: 'image/jpeg',
          size_bytes: 1548000,
          url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=500'
        }
      ]
    };
    
    return NextResponse.json({ bidCard: mockBidCard });
    
  } catch (error) {
    console.error('Error creating mock bid card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
