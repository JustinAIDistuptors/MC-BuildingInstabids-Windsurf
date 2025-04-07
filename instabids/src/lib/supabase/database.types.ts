/**
 * Type definitions for Supabase database schema
 * These types provide a type-safe interface to the Supabase database
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          full_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: 'homeowner' | 'contractor' | 'property_manager' | 'admin';
          phone_number: string | null;
          is_verified: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: 'homeowner' | 'contractor' | 'property_manager' | 'admin';
          phone_number?: string | null;
          is_verified?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: 'homeowner' | 'contractor' | 'property_manager' | 'admin';
          phone_number?: string | null;
          is_verified?: boolean;
        };
      };
      projects: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string;
          created_at: string;
          updated_at: string;
          status: 'draft' | 'published' | 'bidding' | 'in_progress' | 'completed' | 'cancelled';
          budget_min: number | null;
          budget_max: number | null;
          location: string | null;
          timeline_start: string | null;
          timeline_end: string | null;
          category: string | null;
          tags: string[] | null;
          image_urls: string[] | null;
          is_featured: boolean;
          is_dream_project: boolean;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description: string;
          created_at?: string;
          updated_at?: string;
          status?: 'draft' | 'published' | 'bidding' | 'in_progress' | 'completed' | 'cancelled';
          budget_min?: number | null;
          budget_max?: number | null;
          location?: string | null;
          timeline_start?: string | null;
          timeline_end?: string | null;
          category?: string | null;
          tags?: string[] | null;
          image_urls?: string[] | null;
          is_featured?: boolean;
          is_dream_project?: boolean;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'draft' | 'published' | 'bidding' | 'in_progress' | 'completed' | 'cancelled';
          budget_min?: number | null;
          budget_max?: number | null;
          location?: string | null;
          timeline_start?: string | null;
          timeline_end?: string | null;
          category?: string | null;
          tags?: string[] | null;
          image_urls?: string[] | null;
          is_featured?: boolean;
          is_dream_project?: boolean;
        };
      };
      bids: {
        Row: {
          id: string;
          project_id: string;
          contractor_id: string;
          amount: number;
          description: string;
          created_at: string;
          updated_at: string;
          status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
          timeline_start: string | null;
          timeline_end: string | null;
          materials_included: boolean;
          labor_included: boolean;
          permit_included: boolean;
          notes: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          contractor_id: string;
          amount: number;
          description: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
          timeline_start?: string | null;
          timeline_end?: string | null;
          materials_included?: boolean;
          labor_included?: boolean;
          permit_included?: boolean;
          notes?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          contractor_id?: string;
          amount?: number;
          description?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
          timeline_start?: string | null;
          timeline_end?: string | null;
          materials_included?: boolean;
          labor_included?: boolean;
          permit_included?: boolean;
          notes?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          project_id: string | null;
          content: string;
          created_at: string;
          is_read: boolean;
          is_system_message: boolean;
          parent_message_id: string | null;
          thread_id: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          project_id?: string | null;
          content: string;
          created_at?: string;
          is_read?: boolean;
          is_system_message?: boolean;
          parent_message_id?: string | null;
          thread_id: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          project_id?: string | null;
          content?: string;
          created_at?: string;
          is_read?: boolean;
          is_system_message?: boolean;
          parent_message_id?: string | null;
          thread_id?: string;
        };
      };
      // Add other tables as needed
    };
    Views: {
      // Add views if needed
    };
    Functions: {
      // Add functions if needed
    };
    Enums: {
      user_role: 'homeowner' | 'contractor' | 'property_manager' | 'admin';
      project_status: 'draft' | 'published' | 'bidding' | 'in_progress' | 'completed' | 'cancelled';
      bid_status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    };
  };
}

// Type-safe client for use in the application
export type TypedSupabaseClient = ReturnType<typeof createClient>;

// Import the client creation function to maintain proper typing
import { createClient } from './server';

// Export database row types for convenience
export type User = Database['public']['Tables']['users']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Bid = Database['public']['Tables']['bids']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
