import { NextRequest, NextResponse } from 'next/server';
import { BidCard } from '@/types/bidding';

// Mock project storage - this is just for demo purposes
let mockProjects: Array<BidCard & { id: string }> = [];

/**
 * POST /api/mock-bid-cards
 * Creates a new bid card without requiring authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData();
    const jsonData = formData.get('data');
    
    if (!jsonData) {
      return NextResponse.json(
        { error: 'Missing bid card data' },
        { status: 400 }
      );
    }
    
    // Parse the JSON data
    const bidCardData = JSON.parse(jsonData as string) as BidCard;
    
    // Generate a random ID
    const id = `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Add it to our mock storage with created_at timestamp
    const newProject = {
      ...bidCardData,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockProjects.push(newProject);
    
    console.log('Mock project created:', newProject);
    
    return NextResponse.json({ 
      success: true, 
      id,
      message: 'Project saved successfully (MOCK - no database storage)'
    });
    
  } catch (error) {
    console.error('Error processing mock bid card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mock-bid-cards
 * Gets all bid cards from the mock storage
 */
export async function GET() {
  try {
    return NextResponse.json({ 
      bidCards: mockProjects 
    });
  } catch (error) {
    console.error('Error fetching mock bid cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
