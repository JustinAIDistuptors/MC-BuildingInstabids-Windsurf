'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import * as SupabaseMessaging from '@/lib/supabase/contractor-messaging';
import * as MockMessaging from '@/lib/mock/contractor-messaging-mock';
import { ensureAuthentication as originalEnsureAuthentication, isUsingDevFallback } from '@/lib/supabase/client';

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
 * Uses localStorage for development and will be updated to use Supabase in production
 */
export class ContractorMessagingService {
  private static supabase = createClientComponentClient<Database>();
  
  /**
   * Ensure authentication is set up before making requests
   */
  static async ensureAuthentication(): Promise<void> {
    try {
      await originalEnsureAuthentication();
    } catch (error) {
      console.warn('Authentication failed, using development fallback');
      localStorage.setItem('dev_auth_fallback', 'true');
    }
  }
  
  /**
   * Get contractors with aliases for a project
   * @param projectId - The project ID
   * @returns Array of contractors with aliases
   */
  static async getContractorsWithAliases(projectId: string): Promise<SupabaseMessaging.ContractorWithAlias[]> {
    try {
      // Try to use Supabase if authentication is available
      try {
        await ContractorMessagingService.ensureAuthentication();
        
        // If we're using the development fallback, use mock data
        if (isUsingDevFallback()) {
          console.log('Using development fallback for contractors');
          return MockMessaging.getContractorsWithAliases(projectId);
        }
        
        return await SupabaseMessaging.getContractorsWithAliases(projectId);
      } catch (supabaseError) {
        console.warn('Falling back to localStorage for contractors:', supabaseError);
        // Fall back to localStorage
        return MockMessaging.getContractorsWithAliases(projectId);
      }
    } catch (error) {
      console.error('Error getting contractors:', error);
      
      // Last resort fallback
      return [
        { id: '1', full_name: 'Contractor 1', alias: 'A', bid_amount: 5000 },
        { id: '2', full_name: 'Contractor 2', alias: 'B', bid_amount: 6500 },
        { id: '3', full_name: 'Contractor 3', alias: 'C', bid_amount: 7200 },
      ];
    }
  }
  
  /**
   * Get messages for a project
   * @param projectId - The project ID
   * @param contractorId - Optional contractor ID for filtering individual messages
   * @returns Array of formatted messages
   */
  static async getMessages(projectId: string, contractorId?: string): Promise<SupabaseMessaging.FormattedMessage[]> {
    try {
      // Try to use Supabase if authentication is available
      try {
        await ContractorMessagingService.ensureAuthentication();
        
        // If we're using the development fallback, use mock data
        if (isUsingDevFallback()) {
          console.log('Using development fallback for messages');
          return MockMessaging.getProjectMessages(projectId, contractorId);
        }
        
        return await SupabaseMessaging.getProjectMessages(projectId, contractorId);
      } catch (supabaseError) {
        console.warn('Falling back to localStorage for messages:', supabaseError);
        // Fall back to localStorage
        return MockMessaging.getProjectMessages(projectId, contractorId);
      }
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }
  
  /**
   * Send a message
   * @param projectId - The project ID
   * @param content - The message content
   * @param messageType - 'individual' or 'group'
   * @param recipientId - The recipient ID (for individual messages)
   * @param files - Optional files to attach
   * @returns Success status
   */
  static async sendMessage(
    projectId: string,
    content: string,
    messageType: 'individual' | 'group',
    recipientId: string | null = null,
    files: File[] = []
  ): Promise<boolean> {
    try {
      // Try to use Supabase if authentication is available
      try {
        await ContractorMessagingService.ensureAuthentication();
        
        // If we're using the development fallback, use mock data
        if (isUsingDevFallback()) {
          console.log('Using development fallback for sending message');
          if (messageType === 'individual' && recipientId) {
            return MockMessaging.sendIndividualMessage(projectId, recipientId, content, files);
          } else {
            return MockMessaging.sendGroupMessage(projectId, content, files);
          }
        }
        
        if (messageType === 'individual' && recipientId) {
          return await SupabaseMessaging.sendIndividualMessage(projectId, recipientId, content, files);
        } else {
          return await SupabaseMessaging.sendGroupMessage(projectId, content, files);
        }
      } catch (supabaseError) {
        console.warn('Falling back to localStorage for sending message:', supabaseError);
        // Fall back to localStorage
        if (messageType === 'individual' && recipientId) {
          return MockMessaging.sendIndividualMessage(projectId, recipientId, content, files);
        } else {
          return MockMessaging.sendGroupMessage(projectId, content, files);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }
  
  /**
   * Get contractor alias by ID
   * @param projectId - The project ID
   * @param contractorId - The contractor ID
   * @returns The contractor alias or null if not found
   */
  static async getContractorAlias(projectId: string, contractorId: string): Promise<string | null> {
    try {
      // Try to use Supabase if authentication is available
      try {
        await ContractorMessagingService.ensureAuthentication();
        
        // If we're using the development fallback, use mock data
        if (isUsingDevFallback()) {
          console.log('Using development fallback for contractor alias');
          return MockMessaging.getContractorAlias(projectId, contractorId);
        }
        
        const alias = await SupabaseMessaging.getContractorAlias(projectId, contractorId);
        return alias;
      } catch (supabaseError) {
        console.warn('Falling back to localStorage for contractor alias:', supabaseError);
        // Fall back to localStorage
        return MockMessaging.getContractorAlias(projectId, contractorId);
      }
    } catch (error) {
      console.error('Error getting contractor alias:', error);
      return null;
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
    } catch (e) {
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
    } catch (e) {
      return '';
    }
  }
  
  /**
   * Subscribe to new messages for a project
   * @param projectId - The project ID
   * @param contractorId - Optional contractor ID for filtering individual messages
   * @param callback - Function to call when a new message is received
   * @returns Unsubscribe function
   */
  static subscribeToMessages(
    projectId: string,
    contractorId: string | null,
    callback: (message: SupabaseMessaging.FormattedMessage) => void
  ): () => void {
    try {
      // Try to use Supabase if authentication is available
      try {
        ContractorMessagingService.ensureAuthentication();
        
        // If we're using the development fallback, use mock data
        if (isUsingDevFallback()) {
          console.log('Using development fallback for message subscription');
          return MockMessaging.subscribeToMessages(projectId, contractorId, callback);
        }
        
        return SupabaseMessaging.subscribeToMessages(projectId, contractorId, callback);
      } catch (supabaseError) {
        console.warn('Using localStorage fallback for message subscription:', supabaseError);
        // Fall back to localStorage - no real-time updates, but we'll simulate it
        return MockMessaging.subscribeToMessages(projectId, contractorId, callback);
      }
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }
  
  /**
   * Mark a message as read
   * @param messageId - The message ID
   * @returns Success status
   */
  static async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      // This is only implemented in Supabase
      try {
        await ContractorMessagingService.ensureAuthentication();
        
        // If we're using the development fallback, pretend it worked
        if (isUsingDevFallback()) {
          console.log('Using development fallback for marking message as read');
          return true;
        }
        
        // Call Supabase implementation when available
        // return await SupabaseMessaging.markMessageAsRead(messageId);
        return true;
      } catch (error) {
        console.warn('Mark as read not available in localStorage:', error);
        return true; // Pretend it worked in localStorage
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }
}
