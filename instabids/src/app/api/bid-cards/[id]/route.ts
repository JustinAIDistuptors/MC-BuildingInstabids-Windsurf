import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOnly } from '@/lib/auth/auth-utils';
import { BidCard } from '@/types/bidding';

/**
 * GET /api/bid-cards/[id]
 * Gets a specific bid card by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserOnly();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Create Supabase client
    const supabase = createClient();
    
    // Get the bid card
    const { data: bidCard, error: bidCardError } = await supabase
      .from('bid_cards')
      .select(`
        *,
        job_categories(name, display_name),
        job_types(name, display_name),
        project_intention_types(name, display_name),
        timeline_horizons(name, display_name)
      `)
      .eq('id', id)
      .single();
    
    if (bidCardError) {
      console.error('Error fetching bid card:', bidCardError);
      return NextResponse.json(
        { error: bidCardError.message },
        { status: 500 }
      );
    }
    
    // Check if the user is the creator of the bid card
    if (bidCard.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this bid card' },
        { status: 403 }
      );
    }
    
    // Get the media for the bid card
    const { data: media, error: mediaError } = await supabase
      .from('bid_card_media')
      .select('*')
      .eq('bid_card_id', id);
    
    if (mediaError) {
      console.error('Error fetching bid card media:', mediaError);
      return NextResponse.json(
        { error: mediaError.message },
        { status: 500 }
      );
    }
    
    // Get URLs for each media item
    const mediaWithUrls = await Promise.all(
      media.map(async (item) => {
        if (!item.file_path) return item;
        
        const { data: urlData } = await supabase.storage
          .from('media')
          .createSignedUrl(item.file_path, 3600);
        
        return {
          ...item,
          url: urlData?.signedUrl || null
        };
      })
    );
    
    return NextResponse.json({ 
      bidCard: {
        ...bidCard,
        media: mediaWithUrls
      }
    });
    
  } catch (error) {
    console.error('Error fetching bid card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bid-cards/[id]
 * Updates a specific bid card by ID
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserOnly();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
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
    const bidCardData = JSON.parse(jsonData as string) as Partial<BidCard>;
    
    // Create Supabase client
    const supabase = createClient();
    
    // Verify ownership of the bid card
    const { data: existingBidCard, error: fetchError } = await supabase
      .from('bid_cards')
      .select('creator_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching bid card:', fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }
    
    // Check if the user is the creator of the bid card
    if (existingBidCard.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this bid card' },
        { status: 403 }
      );
    }
    
    // Update the bid card
    const { data, error } = await supabase
      .from('bid_cards')
      .update({
        ...bidCardData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error updating bid card:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Handle media files if present
    const filePromises: Promise<any>[] = [];
    
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('file-') && value instanceof File) {
        const file = value as File;
        const fileExt = file.name.split('.').pop();
        const fileName = `${id}/${Date.now()}.${fileExt}`;
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
                bid_card_id: id,
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
      id: data.id 
    });
    
  } catch (error) {
    console.error('Error updating bid card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bid-cards/[id]
 * Deletes a specific bid card by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserOnly();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Create Supabase client
    const supabase = createClient();
    
    // Verify ownership of the bid card
    const { data: existingBidCard, error: fetchError } = await supabase
      .from('bid_cards')
      .select('creator_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching bid card:', fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }
    
    // Check if the user is the creator of the bid card
    if (existingBidCard.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this bid card' },
        { status: 403 }
      );
    }
    
    // Get media for the bid card before deleting
    const { data: media, error: mediaFetchError } = await supabase
      .from('bid_card_media')
      .select('file_path')
      .eq('bid_card_id', id);
    
    if (!mediaFetchError && media && media.length > 0) {
      // Delete media files
      const filePaths = media
        .filter(item => item.file_path)
        .map(item => item.file_path);
      
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('media')
          .remove(filePaths);
        
        if (storageError) {
          console.error('Error removing media files:', storageError);
        }
      }
      
      // Delete media records
      const { error: mediaDeleteError } = await supabase
        .from('bid_card_media')
        .delete()
        .eq('bid_card_id', id);
      
      if (mediaDeleteError) {
        console.error('Error deleting media records:', mediaDeleteError);
      }
    }
    
    // Delete the bid card
    const { error } = await supabase
      .from('bid_cards')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting bid card:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true 
    });
    
  } catch (error) {
    console.error('Error deleting bid card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
