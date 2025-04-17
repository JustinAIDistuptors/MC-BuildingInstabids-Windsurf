/**
 * Project Service for InstaBids
 * Handles project-related operations with Supabase
 */

import { supabase } from './client';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  created_at: string;
  owner_id: string;
  owner_name?: string;
  image_url?: string;
  distance?: string;
  bid_count?: number;
}

export interface Bid {
  id: string;
  project_id: string;
  contractor_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  message?: string;
}

export class ProjectService {
  /**
   * Get available projects for contractors to bid on
   */
  static async getAvailableProjects(): Promise<Project[]> {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return [];
      }
      
      // Get projects that are in bidding status
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:owner_id(full_name),
          bids:bids(count)
        `)
        .eq('status', 'bidding')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching available projects:', error);
        return [];
      }
      
      if (!projects || projects.length === 0) {
        return [];
      }
      
      // Format the projects with additional data
      return projects.map(project => ({
        id: project.id,
        title: project.title || 'Untitled Project',
        description: project.description || 'No description provided',
        status: project.status,
        budget_min: project.budget_min,
        budget_max: project.budget_max,
        location: project.location || 'Location not specified',
        created_at: project.created_at,
        owner_id: project.owner_id,
        owner_name: project.profiles?.full_name || 'Property Owner',
        image_url: project.image_url || '/images/placeholder-project.jpg',
        bid_count: project.bids?.length || 0,
        // Calculate a random distance for demo purposes
        distance: (Math.random() * 20).toFixed(1) + ' miles'
      }));
    } catch (error) {
      console.error('Error in getAvailableProjects:', error);
      return [];
    }
  }
  
  /**
   * Get active projects for a contractor (projects they've bid on)
   */
  static async getActiveProjects(contractorId: string): Promise<Project[]> {
    try {
      if (!contractorId) {
        console.error('Contractor ID is required');
        return [];
      }
      
      // Get bids made by this contractor
      const { data: bids, error: bidsError } = await supabase
        .from('bids')
        .select(`
          *,
          projects:project_id(*)
        `)
        .eq('contractor_id', contractorId);
      
      if (bidsError) {
        console.error('Error fetching contractor bids:', bidsError);
        return [];
      }
      
      if (!bids || bids.length === 0) {
        return [];
      }
      
      // Get the unique project IDs
      const projectIds = [...new Set(bids.map(bid => bid.project_id))];
      
      // Get the projects with owner information
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:owner_id(full_name),
          bids:bids(count)
        `)
        .in('id', projectIds);
      
      if (projectsError) {
        console.error('Error fetching active projects:', projectsError);
        return [];
      }
      
      if (!projects || projects.length === 0) {
        return [];
      }
      
      // Format the projects with additional data
      return projects.map(project => ({
        id: project.id,
        title: project.title || 'Untitled Project',
        description: project.description || 'No description provided',
        status: project.status,
        budget_min: project.budget_min,
        budget_max: project.budget_max,
        location: project.location || 'Location not specified',
        created_at: project.created_at,
        owner_id: project.owner_id,
        owner_name: project.profiles?.full_name || 'Property Owner',
        image_url: project.image_url || '/images/placeholder-project.jpg',
        bid_count: project.bids?.length || 0,
        // Calculate a random distance for demo purposes
        distance: (Math.random() * 20).toFixed(1) + ' miles'
      }));
    } catch (error) {
      console.error('Error in getActiveProjects:', error);
      return [];
    }
  }
  
  /**
   * Submit a bid on a project
   */
  static async submitBid(projectId: string, amount: number, message?: string): Promise<{ success: boolean; bid?: Bid; error?: string }> {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
      
      // Submit the bid
      const { data: bid, error } = await supabase
        .from('bids')
        .insert({
          project_id: projectId,
          contractor_id: user.id,
          amount,
          message,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error submitting bid:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, bid };
    } catch (error: any) {
      console.error('Error in submitBid:', error);
      return { success: false, error: error.message };
    }
  }
}
