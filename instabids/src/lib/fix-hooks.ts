/**
 * Utility functions to help identify contractor messages
 */

import { FormattedMessage } from '@/services/ContractorMessagingService';

/**
 * Identify if a message is from a contractor based on multiple signals
 */
export function isContractorMessage(message: FormattedMessage): boolean {
  // Method 1: Check if message content contains or starts with "Contractor"
  if (message.content?.trim().toLowerCase().includes('contractor')) {
    return true;
  }
  
  // Method 2: Check if metadata has isFromContractor flag
  if (message.metadata?.isFromContractor === true) {
    return true;
  }
  
  // Method 3: Check if message has forceContractorDisplay flag
  if (message.metadata?.forceContractorDisplay === true) {
    return true;
  }
  
  // Method 4: Check if isOwn is explicitly false
  if (message.isOwn === false) {
    return true;
  }
  
  return false;
}

/**
 * Create a mapping of sender IDs to contractor labels
 */
export function createSenderLabelMap(messages: FormattedMessage[], userId: string | null): Map<string, string> {
  const senderLabelMap = new Map<string, string>();
  
  // First pass: find all unique contractor sender IDs
  let contractorCounter = 1;
  messages.forEach(message => {
    // A message is from a contractor if it matches our criteria
    // and the sender ID is not already in our map
    if (isContractorMessage(message) && !senderLabelMap.has(message.senderId)) {
      // Assign sequential numbers to different contractors
      senderLabelMap.set(message.senderId, String(contractorCounter++));
    }
  });
  
  return senderLabelMap;
}

/**
 * Process messages to identify contractor messages
 */
export function processMessages(
  messages: FormattedMessage[], 
  senderLabelMap: Map<string, string>
): FormattedMessage[] {
  return messages.map(message => {
    // Determine if this is a contractor message
    const isFromContractor = isContractorMessage(message);
    
    // Get the consistent label for this sender
    const contractorLabel = isFromContractor ? senderLabelMap.get(message.senderId) || "1" : null;
    
    return {
      ...message,
      // Override isOwn based on our contractor detection
      isOwn: !isFromContractor, // If it's a contractor message, it's not own
      // Store the contractor ID for filtering
      contractorId: message.senderId,
      // Use the consistent contractor label for all messages from the same sender
      senderAlias: contractorLabel || ''
    };
  });
}

/**
 * Add metadata type to FormattedMessage interface
 */
declare module '@/services/ContractorMessagingService' {
  interface FormattedMessage {
    metadata?: {
      isFromContractor?: boolean;
      forceContractorDisplay?: boolean;
      [key: string]: any;
    };
  }
}
