'use client';

import { getSupabaseClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { toast } from 'sonner';
import * as SupabaseMessaging from '@/lib/supabase/contractor-messaging';
import * as MockMessaging from '@/lib/mock/contractor-messaging-mock';

// Re-export types from the Supabase implementation
export type {
  ContractorAlias,
  MessageRecipient,
  MessageAttachment,
  Message,
  ContractorWithAlias,
  FormattedMessage
} from '@/lib/supabase/contractor-messaging';

/**
 * Service for handling contractor messaging functionality
 * Uses Supabase for production and localStorage for development fallback
 */
export class ContractorMessagingService {
  // Use the singleton Supabase client
  private static getSupabase() {
    return getSupabaseClient();
  }
  
  /**
   * Check if we're using development fallback
   * @returns False - development fallback is disabled for production
   */
  private static isUsingDevFallback(): boolean {
    // Disable development fallback for production
    return false;
  }
  
  /**
   * Ensure authentication is set up before making requests
   * @returns True if authenticated, false if not authenticated
   */
  static async ensureAuthentication(): Promise<boolean> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        console.error('Supabase client not available');
        return false;
      }
      
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Authentication error:', error.message);
        return false;
      }
      
      if (data?.user) {
        return true;
      }
      
      console.error('Authentication required - user not found');
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }
  
  /**
   * Get all contractors for a project
   * @param projectId - The project ID
   * @returns Array of contractors with aliases
   */
  static async getContractors(projectId: string): Promise<SupabaseMessaging.ContractorWithAlias[]> {
    try {
      const isAuthenticated = await ContractorMessagingService.ensureAuthentication();
      if (!isAuthenticated) {
        throw new Error('Authentication required to get contractors');
      }
      return await SupabaseMessaging.getContractorsWithAliases(projectId);
    } catch (error) {
      console.error('Error getting contractors:', error);
      return [];
    }
  }
  
  /**
   * Get contractors with aliases for a project
   * @param projectId - The project ID
   * @returns Array of contractors with aliases
   */
  static async getContractorsWithAliases(projectId: string): Promise<SupabaseMessaging.ContractorWithAlias[]> {
    try {
      const isAuthenticated = await ContractorMessagingService.ensureAuthentication();
      if (!isAuthenticated) {
        throw new Error('Authentication required to get contractors with aliases');
      }
      return await SupabaseMessaging.getContractorsWithAliases(projectId);
    } catch (error) {
      console.error('Error getting contractors with aliases:', error);
      return [];
    }
  }
  
  /**
   * Get messages for a project
   * @param projectId - The project ID
   * @param userId - Optional user ID to filter messages for a specific user
   * @returns Array of formatted messages
   */
  static async getMessages(projectId: string, userId?: string): Promise<SupabaseMessaging.FormattedMessage[]> {
    try {
      const isAuthenticated = await ContractorMessagingService.ensureAuthentication();
      if (!isAuthenticated) {
        throw new Error('Authentication required to get messages');
      }
      
      // The getProjectMessages function already accepts an optional contractorId parameter
      // for filtering messages for a specific user
      return await SupabaseMessaging.getProjectMessages(projectId, userId);
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }
  
  /**
   * Send a message
   * @param params - Message parameters
   * @returns Object with success status
   */
  static async sendMessage(params: {
    projectId: string;
    message: string;
    recipientId: string;
    files?: File[];
  }): Promise<{ success: boolean }> {
    try {
      const { projectId, message, recipientId, files = [] } = params;
      
      // Require authentication
      const isAuthenticated = await ContractorMessagingService.ensureAuthentication();
      if (!isAuthenticated) {
        console.error('Authentication required to send messages');
        toast.error('Please sign in to send messages');
        return { success: false };
      }
      
      console.log('Sending message using Supabase:', {
        projectId,
        message,
        recipientId,
        filesCount: files.length
      });
      
      // Always send as individual message since we have a recipientId
      const result = await SupabaseMessaging.sendIndividualMessage(projectId, recipientId, message, files);
      return { success: result };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false };
    }
  }
  
  /**
   * Subscribe to messages for a project
   * @param projectId - The project ID
   * @param contractorId - The contractor ID
   * @param callback - Callback function to execute when a new message is received
   * @returns Unsubscribe function
   */
  static subscribeToMessages(
    projectId: string,
    contractorId: string,
    callback: (message: SupabaseMessaging.FormattedMessage) => void
  ): () => void {
    try {
      return SupabaseMessaging.subscribeToMessages(projectId, contractorId, callback);
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }
  
  /**
   * Format timestamp for display
   * @param timestamp - ISO timestamp string
   * @returns Formatted time string (e.g., "2:30 PM")
   */
  static formatTimestamp(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  }
  
  /**
   * Format date for display
   * @param timestamp - ISO timestamp string
   * @returns Formatted date string (e.g., "Apr 12, 2025")
   */
  static formatDate(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }
  
  /**
   * Mark a message as read
   * @param messageId - The message ID
   * @returns Promise resolving to true if successful, false otherwise
   */
  static async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      await ContractorMessagingService.ensureAuthentication();
      return await SupabaseMessaging.markMessageAsRead(messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }
}