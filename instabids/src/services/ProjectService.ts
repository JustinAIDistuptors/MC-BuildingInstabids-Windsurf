'use client';

/**
 * ProjectService - Service layer for project operations
 * 
 * This service abstracts all project data operations, making it easy to switch
 * from localStorage to Supabase in the future without changing component code.
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Project type definition
export interface Project {
  id: string;
  title: string;
  description?: string | undefined;
  status: string;
  bid_status?: string | undefined;
  budget_min?: number | string | undefined;
  budget_max?: number | string | undefined;
  budget?: string | undefined;
  timeline?: string | undefined;
  timeline_start?: string | undefined;
  timeline_end?: string | undefined;
  location?: any;
  zip_code?: string | undefined;
  job_type_id?: string | undefined;
  job_category_id?: string | undefined;
  job_size?: string | undefined;
  type?: string | undefined;
  size?: string | undefined;
  hasMedia?: boolean | undefined;
  bid_count?: number | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  createdAt?: string | undefined;
  group_bidding_enabled?: boolean | undefined;
  imageUrl?: string | undefined;
  owner_id?: string | undefined;
}

class ProjectService {
  private supabase: any;
  private useSupabase: boolean;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    // FORCE USING SUPABASE ONLY - DISABLE ALL LOCALSTORAGE
    this.useSupabase = true;
    
    console.log('ProjectService initialized with useSupabase =', this.useSupabase);
  }

  /**
   * Get all projects
   * @returns Array of projects
   */
  async getAllProjects(): Promise<Project[]> {
    console.log('ProjectService.getAllProjects: Starting to fetch projects');
    
    try {
      // We're forcing Supabase usage, so only fetch from Supabase
      const { data, error } = await this.supabase
        .from('projects')
        .select('*');
      
      if (error) {
        console.error('Error fetching projects from Supabase:', error);
        return [];
      }
      
      console.log('ProjectService.getAllProjects: Fetched from Supabase:', data);
      return data as Project[];
    } catch (error) {
      console.error('ProjectService.getAllProjects: Error fetching projects:', error);
      return [];
    }
  }

  /**
   * Get a project by ID
   * @param id Project ID
   * @returns Project or null if not found
   */
  async getProjectById(id: string): Promise<Project | null> {
    console.log('ProjectService.getProjectById: Fetching project with ID:', id);
    
    try {
      // We're forcing Supabase usage, so only fetch from Supabase
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching project from Supabase:', error);
        return null;
      }
      
      console.log('ProjectService.getProjectById: Fetched from Supabase:', data);
      return data as Project;
    } catch (error) {
      console.error('ProjectService.getProjectById: Error fetching project:', error);
      return null;
    }
  }

  /**
   * Create a new project
   * @param project Project data without ID
   * @returns Created project with ID
   */
  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    try {
      const timestamp = new Date().toISOString();
      const id = uuidv4();

      // Create new project with ID and timestamps
      const newProject: Project = {
        id,
        title: project.title,
        description: project.description,
        status: project.status || 'draft',
        bid_status: project.bid_status,
        budget_min: project.budget_min,
        budget_max: project.budget_max,
        budget: project.budget,
        timeline: project.timeline,
        timeline_start: project.timeline_start,
        timeline_end: project.timeline_end,
        location: project.location,
        zip_code: project.zip_code,
        job_type_id: project.job_type_id,
        job_category_id: project.job_category_id,
        job_size: project.job_size,
        type: project.type,
        size: project.size,
        hasMedia: project.hasMedia || false,
        bid_count: project.bid_count || 0,
        created_at: timestamp,
        updated_at: timestamp,
        createdAt: timestamp,
        group_bidding_enabled: project.group_bidding_enabled || false,
        imageUrl: project.imageUrl,
        owner_id: project.owner_id
      };

      // We're forcing Supabase usage, so only save to Supabase
      const { data, error } = await this.supabase
        .from('projects')
        .insert([newProject])
        .select();
      
      if (error) {
        console.error('Error creating project in Supabase:', error);
        throw new Error('Failed to create project');
      }
      
      console.log('ProjectService.createProject: Created in Supabase:', data[0]);
      return data[0] as Project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  /**
   * Update an existing project
   * @param id Project ID
   * @param projectData Updated project data
   * @returns Updated project
   */
  async updateProject(id: string, projectData: Partial<Project>): Promise<Project | null> {
    try {
      const timestamp = new Date().toISOString();

      // Ensure id is included and required fields are present
      const updatedProject: Project = {
        ...projectData,
        id, // Ensure ID is set and not overridden
        title: projectData.title || '', // Title is required
        status: projectData.status || 'draft', // Status is required
        updated_at: timestamp
      };

      // We're forcing Supabase usage, so only update in Supabase
      const { data, error } = await this.supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating project in Supabase:', error);
        return null;
      }
      
      console.log('ProjectService.updateProject: Updated in Supabase:', data[0]);
      return data[0] as Project;
    } catch (error) {
      console.error(`Error updating project with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete a project by ID
   * @param id Project ID to delete
   * @returns Promise resolving to true if deletion was successful
   */
  async deleteProject(id: string): Promise<boolean> {
    console.log('ProjectService: Deleting project with ID:', id);
    
    try {
      // We're forcing Supabase usage, so only delete from Supabase
      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting project from Supabase:', error);
        return false;
      }
      
      console.log('ProjectService: Successfully deleted project from Supabase');
      return true;
    } catch (error) {
      console.error('ProjectService: Error deleting project:', error);
      return false;
    }
  }

  /**
   * Get projects by status
   * @param status Project status
   * @returns Array of projects with the specified status
   */
  async getProjectsByStatus(status: string): Promise<Project[]> {
    try {
      // We're forcing Supabase usage, so only fetch from Supabase
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('status', status);
      
      if (error) {
        console.error(`Error fetching projects with status ${status} from Supabase:`, error);
        return [];
      }
      
      console.log(`ProjectService.getProjectsByStatus: Fetched from Supabase:`, data);
      return data as Project[];
    } catch (error) {
      console.error(`Error fetching projects with status ${status}:`, error);
      return [];
    }
  }

  /**
   * Get active projects (not completed or archived)
   * @returns Array of active projects
   */
  async getActiveProjects(): Promise<Project[]> {
    try {
      // We're forcing Supabase usage, so only fetch from Supabase
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .neq('bid_status', 'completed');
      
      if (error) {
        console.error('Error fetching active projects from Supabase:', error);
        return [];
      }
      
      console.log('ProjectService.getActiveProjects: Fetched from Supabase:', data);
      return data as Project[];
    } catch (error) {
      console.error('Error fetching active projects:', error);
      return [];
    }
  }

  /**
   * Get completed projects
   * @returns Array of completed projects
   */
  async getCompletedProjects(): Promise<Project[]> {
    try {
      // We're forcing Supabase usage, so only fetch from Supabase
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('bid_status', 'completed');
      
      if (error) {
        console.error('Error fetching completed projects from Supabase:', error);
        return [];
      }
      
      console.log('ProjectService.getCompletedProjects: Fetched from Supabase:', data);
      return data as Project[];
    } catch (error) {
      console.error('Error fetching completed projects:', error);
      return [];
    }
  }

  /**
   * Delete all projects
   * @returns Boolean indicating success
   */
  async deleteAllProjects(): Promise<boolean> {
    try {
      // We're forcing Supabase usage, so only delete from Supabase
      const { error } = await this.supabase
        .from('projects')
        .delete();
      
      if (error) {
        console.error('Error deleting all projects from Supabase:', error);
        return false;
      }
      
      console.log('ProjectService: Successfully deleted all projects from Supabase');
      return true;
    } catch (error) {
      console.error('Error deleting all projects:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const projectService = new ProjectService();
