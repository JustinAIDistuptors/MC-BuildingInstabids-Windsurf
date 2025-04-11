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
        .from('bid_cards')
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
      
      // Add the bid card data as JSON with open status
      formData.append('data', JSON.stringify({
        ...bidCardData,
        status: 'open'
      }));
      
      // Add media files
      mediaFiles.forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });
      
      const { data, error } = await supabase
        .from('bid_cards')
        .insert([
          {
            ...bidCardData,
            status: 'open'
          }
        ])
        .select('id');
      
      if (error) {
        console.error('Error submitting bid card:', error);
        throw new Error('Failed to submit bid card');
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
      
      // Use Supabase directly instead of the mock API
      const { data, error } = await supabase
        .from('bid_cards')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching project from Supabase:', error);
        throw new Error('Failed to get project');
      }
      
      if (!data) {
        console.error('Project not found in Supabase');
        throw new Error('Project not found');
      }
      
      console.log('BidCardService.getBidCard: Fetched from Supabase:', data);
      
      // Convert the Supabase data to the expected format
      const bidCard = {
        ...data,
        media: data.media || []
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
        .from('bid_cards')
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
      const { error } = await supabase
        .from('bid_cards')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting bid card:', error);
        throw new Error('Failed to delete bid card');
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
        .from('bid_cards')
        .select('*');
      
      if (error) {
        console.error('Error getting bid cards:', error);
        throw new Error('Failed to get bid cards');
      }
      
      return { bidCards: data };
    } catch (error) {
      console.error('Error getting bid cards:', error);
      throw error;
    }
  }
};
