import { BidCard } from "@/types/bidding";

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
      
      const response = await fetch('/api/bid-cards', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save draft');
      }
      
      return await response.json();
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
      
      const response = await fetch('/api/bid-cards', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit bid card');
      }
      
      return await response.json();
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
      const response = await fetch(`/api/bid-cards/${id}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get bid card');
      }
      
      return await response.json();
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
      const formData = new FormData();
      
      // Add the bid card data as JSON
      formData.append('data', JSON.stringify(bidCardData));
      
      // Add media files
      mediaFiles.forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });
      
      const response = await fetch(`/api/bid-cards/${id}`, {
        method: 'PATCH',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update bid card');
      }
      
      return await response.json();
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
      const response = await fetch(`/api/bid-cards/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete bid card');
      }
      
      return await response.json();
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
      const response = await fetch('/api/bid-cards', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get bid cards');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting bid cards:', error);
      throw error;
    }
  }
};
