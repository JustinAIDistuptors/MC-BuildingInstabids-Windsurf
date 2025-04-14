/**
 * Mock implementation for contractor messaging
 * Used as a fallback when Supabase is not available
 */

import { 
  ContractorAlias, 
  MessageRecipient, 
  MessageAttachment, 
  Message, 
  ContractorWithAlias, 
  FormattedMessage 
} from '../supabase/contractor-messaging';

/**
 * Get contractors with aliases for a project from localStorage
 * @param projectId - The project ID
 * @returns Array of contractors with aliases
 */
export function getContractorsWithAliases(projectId: string): ContractorWithAlias[] {
  try {
    const storedContractors = localStorage.getItem(`contractors_${projectId}`);
    
    if (storedContractors) {
      return JSON.parse(storedContractors);
    }
    
    // Default mock data
    const mockContractors: ContractorWithAlias[] = [
      { id: '1', full_name: 'Contractor 1', alias: 'A', bid_amount: 5000 },
      { id: '2', full_name: 'Contractor 2', alias: 'B', bid_amount: 6500 },
      { id: '3', full_name: 'Contractor 3', alias: 'C', bid_amount: 7200 },
    ];
    
    // Store for future use
    localStorage.setItem(`contractors_${projectId}`, JSON.stringify(mockContractors));
    return mockContractors;
  } catch (error) {
    console.error('Error getting mock contractors:', error);
    return [];
  }
}

/**
 * Get messages for a project from localStorage
 * @param projectId - The project ID
 * @param contractorId - Optional contractor ID for filtering individual messages
 * @returns Array of formatted messages
 */
export function getProjectMessages(projectId: string, contractorId?: string): FormattedMessage[] {
  try {
    const storedMessages = localStorage.getItem(`messages_${projectId}`);
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
    
    // Get contractors for this project to add aliases
    const contractors = getContractorsWithAliases(projectId);
    
    // Format messages with isOwn flag and sender information
    return messages.map((message: any) => {
      const isOwn = message.senderId === 'current_user';
      let senderAlias = isOwn ? undefined : 'Unknown';
      
      if (!isOwn) {
        if (message.isGroup) {
          senderAlias = undefined;
        } else {
          const contractor = contractors.find(c => c.id === message.senderId);
          senderAlias = contractor ? contractor.alias : undefined;
        }
      }
      
      return {
        id: message.id,
        senderId: message.senderId,
        senderAlias,
        content: message.content,
        timestamp: message.timestamp,
        isOwn,
        isGroup: message.isGroup,
        attachments: message.attachments
      };
    });
  } catch (error) {
    console.error('Error getting mock messages:', error);
    return [];
  }
}

/**
 * Send an individual message to localStorage
 * @param projectId - The project ID
 * @param recipientId - The recipient contractor ID
 * @param content - The message content
 * @param files - Optional files to attach
 * @returns Success status
 */
export function sendIndividualMessage(
  projectId: string,
  recipientId: string,
  content: string,
  files: File[] = []
): boolean {
  try {
    // Get existing messages
    const storedMessages = localStorage.getItem(`messages_${projectId}`);
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
    
    // Process file attachments
    const attachments = files.length > 0 
      ? files.map(file => ({
          id: Math.random().toString(36).substring(2),
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          fileType: file.type,
          fileSize: file.size
        })) 
      : undefined;
    
    // Create new message
    const newMessage = {
      id: Date.now().toString(),
      content,
      senderId: 'current_user',
      isOwn: true,
      isGroup: false,
      timestamp: new Date().toISOString(),
      attachments
    };
    
    // Add to messages and save
    messages.push(newMessage);
    localStorage.setItem(`messages_${projectId}`, JSON.stringify(messages));
    
    // Simulate response
    setTimeout(() => {
      simulateResponse(projectId, 'individual', recipientId);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Error sending mock individual message:', error);
    return false;
  }
}

/**
 * Send a group message to localStorage
 * @param projectId - The project ID
 * @param content - The message content
 * @param files - Optional files to attach
 * @returns Success status
 */
export function sendGroupMessage(
  projectId: string,
  content: string,
  files: File[] = []
): boolean {
  try {
    // Get existing messages
    const storedMessages = localStorage.getItem(`messages_${projectId}`);
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
    
    // Process file attachments
    const attachments = files.length > 0 
      ? files.map(file => ({
          id: Math.random().toString(36).substring(2),
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          fileType: file.type,
          fileSize: file.size
        })) 
      : undefined;
    
    // Create new message
    const newMessage = {
      id: Date.now().toString(),
      content,
      senderId: 'current_user',
      isOwn: true,
      isGroup: true,
      timestamp: new Date().toISOString(),
      attachments
    };
    
    // Add to messages and save
    messages.push(newMessage);
    localStorage.setItem(`messages_${projectId}`, JSON.stringify(messages));
    
    // Simulate response
    setTimeout(() => {
      simulateResponse(projectId, 'group');
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Error sending mock group message:', error);
    return false;
  }
}

/**
 * Get contractor alias by ID from localStorage
 * @param projectId - The project ID
 * @param contractorId - The contractor ID
 * @returns The contractor alias or null if not found
 */
export function getContractorAlias(projectId: string, contractorId: string): string | null {
  try {
    const contractors = getContractorsWithAliases(projectId);
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor ? contractor.alias : null;
  } catch (error) {
    console.error('Error getting mock contractor alias:', error);
    return null;
  }
}

/**
 * Subscribe to new messages for a project
 * For mock implementation, this doesn't do real-time updates
 * @param projectId - The project ID
 * @param contractorId - Optional contractor ID for filtering individual messages
 * @param callback - Function to call when a new message is received
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  projectId: string,
  contractorId: string | null,
  callback: (message: FormattedMessage) => void
): () => void {
  // For mock implementation, we'll just return a no-op unsubscribe function
  // The real-time updates will be simulated through the simulateResponse method
  return () => {};
}

/**
 * Simulate a response (for testing)
 * @param projectId - The project ID
 * @param messageType - 'individual' or 'group'
 * @param recipientId - The recipient ID (for individual messages)
 * @returns Success status
 */
export function simulateResponse(
  projectId: string,
  messageType: 'individual' | 'group',
  recipientId: string | null = null
): boolean {
  try {
    // Get existing messages
    const storedMessages = localStorage.getItem(`messages_${projectId}`);
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
    
    // Get contractors for this project
    const contractors = getContractorsWithAliases(projectId);
    
    // Create response message
    let responseMsg: any;
    
    if (messageType === 'individual' && recipientId) {
      const contractor = contractors.find(c => c.id === recipientId);
      const contractorAlias = contractor?.alias || 'Unknown';
      responseMsg = {
        id: (Date.now() + 1).toString(),
        content: `This is a response from Contractor ${contractorAlias}`,
        senderId: recipientId,
        isOwn: false,
        isGroup: false,
        timestamp: new Date().toISOString()
      };
    } else {
      // For group messages, pick a random contractor to respond
      if (contractors.length === 0) {
        console.error('No contractors available for response');
        return false;
      }
      
      const randomIndex = Math.floor(Math.random() * contractors.length);
      const contractor = contractors[randomIndex] || contractors[0];
      
      if (!contractor || !contractor.id) {
        console.error('No valid contractor found for response');
        return false;
      }
      
      responseMsg = {
        id: (Date.now() + 1).toString(),
        content: 'This is a response to your group message',
        senderId: contractor.id,
        isOwn: false,
        isGroup: true,
        timestamp: new Date().toISOString()
      };
    }
    
    // Add to messages and save
    messages.push(responseMsg);
    localStorage.setItem(`messages_${projectId}`, JSON.stringify(messages));
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: `messages_${projectId}`,
      newValue: JSON.stringify(messages)
    }));
    
    return true;
  } catch (error) {
    console.error('Error simulating mock response:', error);
    return false;
  }
}
