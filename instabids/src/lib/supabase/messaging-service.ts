// Messaging Service
// This file provides a clean API for the messaging functionality

import { 
  getMessages, 
  sendMessage, 
  getContractorsForBidCard, 
  getHomeownerForBidCard, 
  subscribeToMessages,
  type Message,
  type Attachment,
  type User,
  type Contractor
} from './messaging';

/**
 * MessagingService class provides a clean API for messaging functionality
 * It handles all the interactions with the Supabase backend
 */
export class MessagingService {
  private bidCardId: string;
  private currentUser: User;
  
  constructor(bidCardId: string, currentUser: User) {
    this.bidCardId = bidCardId;
    this.currentUser = currentUser;
  }
  
  /**
   * Get all messages between the current user and another user
   */
  async getConversation(otherUserId: string): Promise<Message[]> {
    return getMessages(this.bidCardId, this.currentUser.id, otherUserId);
  }
  
  /**
   * Send a message to another user
   */
  async sendMessage(recipientId: string, content: string, files: File[] = []): Promise<Message> {
    return sendMessage(this.bidCardId, this.currentUser.id, recipientId, content, files);
  }
  
  /**
   * Get all contractors for this bid card (for homeowners)
   */
  async getContractors(): Promise<Contractor[]> {
    if (this.currentUser.role !== 'homeowner') {
      throw new Error('Only homeowners can view contractors for a bid card');
    }
    
    return getContractorsForBidCard(this.bidCardId);
  }
  
  /**
   * Get the homeowner for this bid card (for contractors)
   */
  async getHomeowner(): Promise<User | null> {
    if (this.currentUser.role !== 'contractor') {
      throw new Error('Only contractors need to get homeowner information');
    }
    
    return getHomeownerForBidCard(this.bidCardId);
  }
  
  /**
   * Subscribe to new messages
   */
  subscribeToNewMessages(callback: (message: Message) => void): () => void {
    return subscribeToMessages(this.bidCardId, this.currentUser.id, callback);
  }
  
  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    // Implementation will be added when needed
  }
}

/**
 * Create a messaging service instance
 */
export function createMessagingService(bidCardId: string, currentUser: User): MessagingService {
  return new MessagingService(bidCardId, currentUser);
}

// Re-export types
export type { Message, Attachment, User, Contractor };
