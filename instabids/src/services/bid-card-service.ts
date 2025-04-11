import { BidCard } from "@/types/bidding";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Service for handling bid card API interactions
 */
export const BidCardService = {
  /**
   * Save a bid card as a draft
   */
  saveDraft: async (
    bidCardData: BidCard,
    mediaFiles: File[]
  ): Promise<{ id: string }> => {
    try {
      const formData = new FormData();
      
      // Add the bid card data as JSON with draft status
      formData.append('data', JSON.stringify({
        ...bidCardData,
        status: 'draft'
      }));
      
      // Add media files
      mediaFiles.forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });
      
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            ...bidCardData,
            status: 'draft'
          }
        ])
        .select('id');
      
      if (error) {
        console.error('Error saving draft:', error);
        throw new Error('Failed to save draft');
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from insert operation');
      }
      
      return { id: data[0].id };
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  },
  
  /**
   * Submit a bid card
   */
  submitBidCard: async (
    bidCardData: BidCard,
    mediaFiles: File[]
  ): Promise<{ id: string }> => {
    try {
      const formData = new FormData();
      
      // Add the bid card data as JSON with published status
      formData.append('data', JSON.stringify({
        ...bidCardData,
        status: 'published'
      }));
      
      // Add media files
      mediaFiles.forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });
      
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            ...bidCardData,
            status: 'published'
          }
        ])
        .select('id');
      
      if (error) {
        console.error('Error submitting bid card:', error);
        throw new Error('Failed to submit bid card');
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from insert operation');
      }
      
      return { id: data[0].id };
    } catch (error) {
      console.error('Error submitting bid card:', error);
      throw error;
    }
  },
  
  /**
   * Get a bid card by ID
   */
  getBidCard: async (id: string): Promise<{ bidCard: BidCard & { media: any[] } }> => {
    try {
      console.log('BidCardService.getBidCard: Fetching project with ID:', id);
      
      // Fetch the project from the projects table
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching project from Supabase:', error);
        
        // Try to handle the case where the table might not exist yet
        if (error.code === '42P01') { // PostgreSQL code for undefined_table
          console.warn('Projects table does not exist yet, returning mock data');
          return { 
            bidCard: {
              id,
              title: 'Project not found',
              description: 'This project could not be found in the database.',
              status: 'draft',
              job_category_id: '',
              job_type_id: '',
              intention_type_id: '',
              location: { address_line1: '', city: '', state: '', zip_code: '' },
              group_bidding_enabled: false,
              visibility: 'public',
              media: []
            } as BidCard & { media: any[] }
          };
        }
        
        throw new Error('Failed to get project');
      }
      
      if (!data) {
        console.error('Project not found in Supabase');
        throw new Error('Project not found');
      }
      
      console.log('BidCardService.getBidCard: Fetched project from Supabase:', data);
      
      // Fetch media files for this project
      const { data: mediaData, error: mediaError } = await supabase
        .from('project_media')
        .select('*')
        .eq('project_id', id);
      
      if (mediaError) {
        console.error('Error fetching media for project:', mediaError);
      }
      
      console.log('BidCardService.getBidCard: Fetched media from Supabase:', mediaData || []);
      
      // Format the media data to match what the UI expects
      const formattedMedia = (mediaData || []).map(item => ({
        id: item.id,
        media_type: 'photo', // Set to 'photo' to match what the UI expects
        url: item.media_url,
        file_name: item.file_name,
        content_type: item.media_type
      }));
      
      // Convert the Supabase data to the expected format
      const bidCard = {
        ...data,
        media: formattedMedia
      };
      
      return { bidCard };
    } catch (error) {
      console.error('Error getting bid card:', error);
      throw error;
    }
  },
  
  /**
   * Update a bid card
   */
  updateBidCard: async (
    id: string,
    bidCardData: Partial<BidCard>,
    mediaFiles: File[] = []
  ): Promise<{ id: string }> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update([
          {
            ...bidCardData
          }
        ])
        .eq('id', id)
        .select('id');
      
      if (error) {
        console.error('Error updating bid card:', error);
        throw new Error('Failed to update bid card');
      }
      
      return { id: data[0].id };
    } catch (error) {
      console.error('Error updating bid card:', error);
      throw error;
    }
  },
  
  /**
   * Delete a bid card
   */
  deleteBidCard: async (id: string): Promise<{ success: boolean }> => {
    try {
      console.log('BidCardService.deleteBidCard: Deleting project with ID:', id);
      
      // First delete associated media references
      const { error: mediaDeleteError } = await supabase
        .from('project_media')
        .delete()
        .eq('project_id', id);
      
      if (mediaDeleteError) {
        console.error('Error deleting project media references:', mediaDeleteError);
        // Continue with project deletion even if media deletion fails
      }
      
      // Then delete the project itself
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting project from Supabase:', error);
        throw new Error('Failed to delete project');
      }
      
      // Try to delete media files from storage
      try {
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('projectmedia')
          .list(id);
        
        if (!storageError && storageData && storageData.length > 0) {
          // Delete all files in the project folder
          const filesToDelete = storageData.map(file => `${id}/${file.name}`);
          
          const { error: deleteFilesError } = await supabase
            .storage
            .from('projectmedia')
            .remove(filesToDelete);
          
          if (deleteFilesError) {
            console.error('Error deleting project media files:', deleteFilesError);
          }
        }
      } catch (storageError) {
        console.error('Error handling storage cleanup:', storageError);
        // Continue even if storage cleanup fails
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting bid card:', error);
      throw error;
    }
  },
  
  /**
   * Get all bid cards for the current user
   */
  getUserBidCards: async (): Promise<{ bidCards: BidCard[] }> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user bid cards:', error);
        throw new Error('Failed to get user bid cards');
      }
      
      if (!data) {
        return { bidCards: [] };
      }
      
      return { bidCards: data };
    } catch (error) {
      console.error('Error getting bid cards:', error);
      throw error;
    }
  }
};
