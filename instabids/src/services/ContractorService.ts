'use client';

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * ContractorService
 * 
 * This service provides a clean abstraction layer between the UI components
 * and the Supabase backend for contractor-related operations.
 * Following the Magic MCP Integration pattern, all data operations
 * connect directly to Supabase with proper error handling.
 */
export class ContractorService {
  /**
   * Get active bids for a contractor
   * @param contractorId The ID of the contractor
   * @returns Array of bids with their associated projects
   */
  static async getActiveBids(contractorId: string) {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          project:project_id (
            *,
            project_media (*)
          )
        `)
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching bids:", error);
        throw error;
      }
      
      // Format bids to include project with location in the expected format
      const formattedData = data.map(bid => {
        if (bid.project) {
          return {
            ...bid,
            project: {
              ...bid.project,
              location: {
                city: bid.project.city || '',
                state: bid.project.state || ''
              },
              // Map project_media to media for backward compatibility
              media: bid.project.project_media
            }
          };
        }
        return bid;
      });

      return formattedData;
    } catch (error) {
      console.error("Exception in getActiveBids:", error);
      throw error;
    }
  }

  /**
   * Get recent projects available for bidding
   * @param limit Number of projects to return
   * @returns Array of projects
   */
  static async getRecentProjects(limit = 6) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, project_media(*)')
        .eq('status', 'published')
        .eq('bid_status', 'accepting_bids')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error("Error fetching projects:", error);
        throw error;
      }
      
      // Format projects to include location in the expected format
      const formattedData = data.map(project => ({
        ...project,
        location: {
          city: project.city || '',
          state: project.state || ''
        },
        // Map project_media to media for backward compatibility
        media: project.project_media
      }));

      return formattedData;
    } catch (error) {
      console.error("Exception in getRecentProjects:", error);
      throw error;
    }
  }

  /**
   * Get all available projects for contractors
   * @returns Array of projects
   */
  static async getAllAvailableProjects(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, project_media(*)')
        .eq('status', 'published')
        .eq('bid_status', 'accepting_bids')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching available projects:", error);
        throw new Error(`Failed to load available projects: ${error.message}`);
      }
      
      // Format projects to include location in the expected format
      const formattedProjects = (data || []).map(project => ({
        ...project,
        location: {
          city: project.city || '',
          state: project.state || ''
        },
        // Map project_media to media for backward compatibility
        media: project.project_media
      }));
      
      return formattedProjects;
    } catch (error: any) {
      console.error('Error in getAllAvailableProjects:', error);
      throw new Error(`Failed to get available projects: ${error.message}`);
    }
  }

  /**
   * Get a specific project by ID
   * @param projectId The ID of the project
   * @returns Project details
   */
  static async getProjectById(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, project_media(*)')
        .eq('id', projectId)
        .single();
      
      if (error) {
        console.error("Error fetching project:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("Project not found");
      }
      
      // Format project to include location in the expected format
      const formattedProject = {
        ...data,
        location: {
          city: data.city || '',
          state: data.state || ''
        },
        // Map project_media to media for backward compatibility
        media: data.project_media
      };
      
      return formattedProject;
    } catch (error) {
      console.error("Exception in getProjectById:", error);
      throw error;
    }
  }

  /**
   * Check if a contractor has already bid on a project
   * @param projectId The ID of the project
   * @param contractorId The ID of the contractor
   * @returns The existing bid or null
   */
  static async checkExistingBid(projectId: string, contractorId: string) {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('project_id', projectId)
        .eq('contractor_id', contractorId)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking existing bid:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Exception in checkExistingBid:", error);
      throw error;
    }
  }

  /**
   * Submit a new bid or update an existing one
   * @param bidData The bid data to submit
   * @param isUpdate Whether this is an update to an existing bid
   * @returns The created or updated bid
   */
  static async submitBid(bidData: any, isUpdate = false) {
    try {
      let response;
      
      if (isUpdate) {
        response = await supabase
          .from('bids')
          .update(bidData)
          .eq('id', bidData.id)
          .select()
          .single();
      } else {
        response = await supabase
          .from('bids')
          .insert(bidData)
          .select()
          .single();
      }
      
      if (response.error) {
        console.error(`Error ${isUpdate ? 'updating' : 'creating'} bid:`, response.error);
        throw response.error;
      }
      
      return response.data;
    } catch (error) {
      console.error(`Exception in ${isUpdate ? 'updateBid' : 'createBid'}:`, error);
      throw error;
    }
  }

  /**
   * Get recent projects for a contractor
   * @param contractorId The ID of the contractor
   * @returns Array of projects
   */
  static async getRecentProjectsForContractor(contractorId: string) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_media (*),
          bids!inner (*)
        `)
        .eq('bids.contractor_id', contractorId)
        .eq('bids.status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Error fetching recent projects for contractor:", error);
        throw error;
      }
      
      // Format projects to include location in the expected format
      const formattedData = data.map(project => ({
        ...project,
        location: {
          city: project.city || '',
          state: project.state || ''
        },
        // Map project_media to media for backward compatibility
        media: project.project_media
      }));

      return formattedData;
    } catch (error) {
      console.error("Exception in getRecentProjectsForContractor:", error);
      throw error;
    }
  }

  /**
   * Get bids from a specific contractor for a specific project
   * @param contractorId The ID of the contractor
   * @param projectId The ID of the project
   * @returns Array of bids
   */
  static async getContractorBidsForProject(contractorId: string, projectId: string) {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('contractor_id', contractorId)
        .eq('project_id', projectId);
      
      if (error) {
        console.error("Error fetching contractor bids for project:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Exception in getContractorBidsForProject:", error);
      throw error;
    }
  }

  /**
   * Submit a bid for a project
   * @param bidData The bid data to submit
   * @returns The created or updated bid
   */
  static async submitBidForProject(bidData: any) {
    try {
      // Check if the contractor already has a bid for this project
      const { data: existingBids, error: checkError } = await supabase
        .from('bids')
        .select('*')
        .eq('contractor_id', bidData.contractor_id)
        .eq('project_id', bidData.project_id);

      if (checkError) {
        console.error('Error checking existing bids:', checkError);
        throw new Error(checkError.message);
      }

      if (existingBids && existingBids.length > 0) {
        // Update existing bid
        const { data, error } = await supabase
          .from('bids')
          .update({
            amount: bidData.amount,
            message: bidData.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBids[0].id)
          .select();

        if (error) {
          console.error('Error updating bid:', error);
          throw new Error(error.message);
        }

        return data;
      } else {
        // Create new bid
        const { data, error } = await supabase
          .from('bids')
          .insert({
            ...bidData,
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error('Error submitting bid:', error);
          throw new Error(error.message);
        }

        return data;
      }
    } catch (error) {
      console.error('Exception in submitBidForProject:', error);
      throw error;
    }
  }
}

export default ContractorService;
