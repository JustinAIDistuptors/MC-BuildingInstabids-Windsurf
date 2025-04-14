/**
 * MessagingService.ts
 * 
 * This service provides a clean abstraction layer between the UI components
 * and the data storage (Supabase). It handles all messaging operations and
 * provides a consistent interface regardless of the backend implementation.
 */

import { getMessages, sendMessage, getContractorsForProject } from '@/lib/supabase/messaging';

// Types
export interface Contractor {
  id: string;
  name: string;
  company?: string;
  bidAmount?: number;
  status: 'pending' | 'accepted' | 'rejected';
  avatar?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  }>;
}

export interface AttachmentFile {
  id: string;
  file: File;
  previewUrl?: string;
}

class MessagingService {
  /**
   * Get all contractors for a specific project
   */
  async getContractorsForProject(projectId: string): Promise<Contractor[]> {
    try {
      // Use the Supabase implementation
      return await getContractorsForProject(projectId);
    } catch (error) {
      console.error('Error getting contractors:', error);
      return [];
    }
  }

  /**
   * Get messages between the current user and a contractor for a specific project
   */
  async getMessages(projectId: string, contractorId: string): Promise<Message[]> {
    try {
      // Use the Supabase implementation
      return await getMessages(projectId, contractorId);
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * Send a message to a contractor
   */
  async sendMessage(
    projectId: string,
    contractorId: string,
    content: string,
    files?: File[]
  ): Promise<boolean> {
    try {
      // Use the Supabase implementation
      return await sendMessage(projectId, contractorId, content, files);
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Format a timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      
      // Check if the date is today
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
      
      if (isToday) {
        // Format as time only for today
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        // Format as date and time for other days
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric' 
        }) + ' ' + date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return timestamp;
    }
  }
}

// Export a singleton instance
export const messagingService = new MessagingService();
