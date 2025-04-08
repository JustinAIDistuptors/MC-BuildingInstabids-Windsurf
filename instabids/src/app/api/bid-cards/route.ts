import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOnly } from '@/lib/auth/auth-utils';
import { BidCard } from '@/types/bidding';

/**
 * POST /api/bid-cards
 * Creates a new bid card or saves a draft
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserOnly();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
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
    
    // Add the creator ID
    bidCardData.creator_id = user.id;
    
    // Create Supabase client
    const supabase = createClient();
    
    // Insert the bid card
    const { data, error } = await supabase
      .from('bid_cards')
      .insert(bidCardData)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating bid card:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    const bidCardId = data.id;
    
    // Handle media files if present
    const filePromises: Promise<any>[] = [];
    
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('file-') && value instanceof File) {
        const file = value as File;
        const fileExt = file.name.split('.').pop();
        const fileName = `${bidCardId}/${Date.now()}.${fileExt}`;
        const filePath = `bid-cards/${fileName}`;
        
        const filePromise = supabase.storage
          .from('media')
          .upload(filePath, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          })
          .then(async ({ data: fileData, error: fileError }) => {
            if (fileError) {
              console.error('Error uploading file:', fileError);
              return null;
            }
            
            // Create a media record
            const isImage = file.type.startsWith('image/');
            
            const { data: mediaData, error: mediaError } = await supabase
              .from('bid_card_media')
              .insert({
                bid_card_id: bidCardId,
                media_type: isImage ? 'photo' : 'document',
                file_path: filePath,
                file_name: file.name,
                content_type: file.type,
                size_bytes: file.size,
              })
              .select('id')
              .single();
            
            if (mediaError) {
              console.error('Error creating media record:', mediaError);
              return null;
            }
            
            return mediaData;
          });
        
        filePromises.push(filePromise);
      }
    }
    
    // Wait for all file uploads to complete
    await Promise.all(filePromises);
    
    return NextResponse.json({ 
      success: true, 
      id: bidCardId 
    });
    
  } catch (error) {
    console.error('Error processing bid card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bid-cards
 * Gets all bid cards for the current user
 */
export async function GET() {
  try {
    const user = await getCurrentUserOnly();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // Get all bid cards for the current user
    const { data, error } = await supabase
      .from('bid_cards')
      .select(`
        *,
        job_categories(name, display_name),
        job_types(name, display_name),
        project_intention_types(name, display_name),
        timeline_horizons(name, display_name)
      `)
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching bid cards:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      bidCards: data 
    });
    
  } catch (error) {
    console.error('Error fetching bid cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
