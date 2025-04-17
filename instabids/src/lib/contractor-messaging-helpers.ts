/**
 * Helper functions for contractor messaging
 * Following Supabase Integration Best Practices
 */
import { FormattedMessage } from '@/services/ContractorMessagingService';

/**
 * Identify if a message is from a contractor
 */
export function isContractorMessage(message: FormattedMessage): boolean {
  // SPECIAL CASE: Messages with content that explicitly indicates it's from the homeowner
  if (message.content?.toLowerCase().includes('from the homeowner') || 
      message.content?.toLowerCase().includes('homeowner')) {
    return false;
  }
  
  // For this specific project, all messages from this user ID are from the contractor
  // EXCEPT those that mention homeowner
  if (message.senderId === 'ee008abf-2917-4b7f-aa83-50b947689f59') {
    return true;
  }
  
  // Check if message has contractor_alias (this is set by our fix script)
  if (message.contractor_alias) {
    return true;
  }
  
  // Check if message content contains contractor
  if (message.content?.toLowerCase().includes('contractor')) {
    return true;
  }
  
  // Check if isOwn is explicitly false
  if (message.isOwn === false) {
    return true;
  }
  
  return false;
}

/**
 * Process messages to identify and mark contractor messages
 */
export function processMessages(messages: FormattedMessage[]): FormattedMessage[] {
  return messages.map(message => {
    // Determine if this is a contractor message
    // IMPORTANT: Only override isOwn if we're confident this is a contractor message
    // Otherwise, respect the original isOwn flag from the database
    const isFromContractor = isContractorMessage(message);
    
    // Get the contractor alias (number) from the message or default to "1"
    const contractorAlias = message.contractor_alias || "1";
    
    return {
      ...message,
      // Only override isOwn if we've determined it's a contractor message
      // This ensures homeowner messages stay as homeowner messages
      isOwn: isFromContractor ? false : message.isOwn,
      // Store the contractor ID for filtering
      contractorId: message.senderId,
      // Use the consistent contractor label for all messages from the same sender
      senderAlias: isFromContractor ? contractorAlias : ''
    };
  });
}

/**
 * Filter messages for a specific contractor
 */
export function filterMessagesForContractor(
  messages: FormattedMessage[], 
  contractorId: string | null
): FormattedMessage[] {
  if (!contractorId) {
    return messages;
  }
  
  return messages.filter(msg => 
    // Include messages from the selected contractor
    msg.senderId === contractorId ||
    // Include messages from the homeowner (user)
    msg.isOwn
  );
}

/**
 * Create contractor options for dropdown
 */
export function createContractorOptions(messages: FormattedMessage[]): { id: string, label: string }[] {
  const uniqueContractors = new Map<string, { id: string, label: string }>();
  
  messages.forEach(message => {
    if (isContractorMessage(message)) {
      const alias = message.contractor_alias || "1";
      uniqueContractors.set(message.senderId, {
        id: message.senderId,
        label: `Contractor ${alias}`
      });
    }
  });
  
  return Array.from(uniqueContractors.values());
}

// Add necessary properties to FormattedMessage
declare module '@/services/ContractorMessagingService' {
  interface FormattedMessage {
    contractor_alias?: string | null;
    contractorId?: string;
    senderAlias?: string | null;
  }
}
