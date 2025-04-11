'use client';

/**
 * Migration script to move projects from localStorage to Supabase
 * 
 * This script can be run from a browser console or integrated into the application
 * as a migration utility for administrators.
 */

import { supabase } from '@/lib/supabase/client';
import { Project } from '@/services/ProjectService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Migrate projects from localStorage to Supabase
 * @returns {Promise<{success: boolean, message: string, migratedCount: number}>} Result of the migration
 */
export async function migrateProjectsToSupabase(): Promise<{
  success: boolean;
  message: string;
  migratedCount: number;
}> {
  try {
    // Get projects from localStorage
    const localProjectsString = localStorage.getItem('mock_projects');
    
    if (!localProjectsString) {
      return {
        success: true,
        message: 'No projects found in localStorage to migrate',
        migratedCount: 0
      };
    }
    
    const localProjects: Project[] = JSON.parse(localProjectsString);
    
    if (localProjects.length === 0) {
      return {
        success: true,
        message: 'No projects found in localStorage to migrate',
        migratedCount: 0
      };
    }
    
    console.log(`Found ${localProjects.length} projects in localStorage`);
    
    // Prepare projects for Supabase
    // Ensure all required fields are present and properly formatted
    const preparedProjects = localProjects.map(project => {
      const now = new Date().toISOString();
      
      return {
        ...project,
        // Ensure ID is in UUID format
        id: project.id.startsWith('project-') ? uuidv4() : project.id,
        // Ensure timestamps are present
        created_at: project.created_at || project.createdAt || now,
        updated_at: project.updated_at || now,
        // Ensure owner_id is present (use a default if not available)
        owner_id: project.owner_id || 'default-owner-id',
        // Ensure status is valid
        status: project.status || 'draft'
      };
    });
    
    // Insert projects into Supabase
    const { data, error } = await supabase
      .from('projects')
      .upsert(preparedProjects, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('Error migrating projects to Supabase:', error);
      return {
        success: false,
        message: `Error migrating projects: ${error.message}`,
        migratedCount: 0
      };
    }
    
    const migratedCount = data?.length || 0;
    console.log(`Successfully migrated ${migratedCount} projects to Supabase`);
    
    return {
      success: true,
      message: `Successfully migrated ${migratedCount} projects to Supabase`,
      migratedCount
    };
  } catch (error) {
    console.error('Error migrating projects to Supabase:', error);
    return {
      success: false,
      message: `Error migrating projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
      migratedCount: 0
    };
  }
}

/**
 * Run the migration and display results
 * This can be called from the browser console or a migration UI
 */
export async function runMigration(): Promise<void> {
  console.log('Starting migration of projects from localStorage to Supabase...');
  
  const result = await migrateProjectsToSupabase();
  
  if (result.success) {
    console.log(`✅ ${result.message}`);
  } else {
    console.error(`❌ ${result.message}`);
  }
}

// Export a function that can be called from a component
export default runMigration;
