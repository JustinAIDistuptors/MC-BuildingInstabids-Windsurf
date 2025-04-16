'use client';

import { getSupabaseClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface ContractorAlias {
  id: string;
  project_id: string;
  contractor_id: string;
  alias: string;
  created_at: string;
}

export interface MessageRecipient {
  id: string;
  message_id: string;
  recipient_id: string;
  read_at: string | null;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  message_type: 'individual' | 'group';
  contractor_alias: string | null;
  created_at: string;
  read_at: string | null;
  attachments?: MessageAttachment[];
}

export interface ContractorWithAlias {
  id: string;
  name: string;
  alias: string | null;
  avatar?: string | null;
  bidAmount: number | null;
}

export interface FormattedMessage {
  id: string;
  senderId: string;
  senderAlias?: string | null;
  content: string;
  timestamp: string;
  isOwn: boolean;
  isGroup: boolean;
  clientId?: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
}

/**
 * Get the current user ID from Supabase auth
 * @returns The user ID if authenticated, null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    
    // First try to get user from getUser method
    const { data: userData } = await supabase.auth.getUser();
    
    if (userData?.user?.id) {
      return userData.user.id;
    }
    
    // If that fails, try to get from session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData?.session?.user?.id) {
      return sessionData.session.user.id;
    }
    
    // For development environments only, try anonymous sign-in as fallback
    if (process.env.NODE_ENV === 'development') {
      try {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (!anonError && anonData?.user?.id) {
          console.log('Development fallback: Signed in anonymously');
          return anonData.user.id;
        }
      } catch (anonError) {
        console.error('Anonymous sign-in failed:', anonError);
      }
    }
    
    // No authenticated user found
    console.log('No authenticated user found');
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * Assign aliases (A, B, C, D, E) to contractors who have interacted with a project
 * Priority is given to contractors who interacted first (either through bids or messages)
 * @param projectId The project ID
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function assignContractorAliases(projectId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    // Check if we already have aliases assigned for this project
    const { data: existingAliases } = await supabase
      .from('contractor_aliases')
      .select('*')
      .eq('project_id', projectId);
    
    if (existingAliases && existingAliases.length > 0) {
      console.log('Aliases already assigned for this project');
      return true;
    }
    
    // Get all contractors who have interacted with this project
    const contractorInteractions: Array<{contractorId: string, timestamp: string}> = [];
    
    // 1. Get contractors from bids
    try {
      const { data: bids, error: bidsError } = await supabase
        .from('bids')
        .select('contractor_id, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (!bidsError && bids && bids.length > 0) {
        bids.forEach((bid: any) => {
          contractorInteractions.push({
            contractorId: bid.contractor_id,
            timestamp: bid.created_at
          });
        });
      }
    } catch (err) {
      console.error('Error getting bids:', err);
      // Continue to try getting contractors from messages
    }
    
    // 2. Get contractors from messages
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('sender_id, created_at')
        .eq('project_id', projectId)
        .not('sender_id', 'is', null)
        .order('created_at', { ascending: true });
      
      if (!messagesError && messages && messages.length > 0) {
        messages.forEach((message: any) => {
          contractorInteractions.push({
            contractorId: message.sender_id,
            timestamp: message.created_at
          });
        });
      }
    } catch (err) {
      console.error('Error getting messages:', err);
    }
    
    // No interactions found
    if (contractorInteractions.length === 0) {
      console.log('No contractor interactions found for this project');
      return false;
    }
    
    // Sort interactions by timestamp (earliest first)
    contractorInteractions.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    // Get unique contractor IDs while preserving order (first interaction)
    const uniqueContractorIds: string[] = [];
    contractorInteractions.forEach(interaction => {
      if (!uniqueContractorIds.includes(interaction.contractorId)) {
        uniqueContractorIds.push(interaction.contractorId);
      }
    });
    
    console.log('Unique contractor IDs in order of first interaction:', uniqueContractorIds);
    
    // Generate aliases (A, B, C, D, E, etc.)
    const aliases = uniqueContractorIds.map((contractorId, index) => {
      const alias = String.fromCharCode(65 + index); // A, B, C, D, E, ...
      return {
        project_id: projectId,
        contractor_id: contractorId,
        alias
      };
    });
    
    // Insert aliases into the database
    const { error: insertError } = await supabase
      .from('contractor_aliases')
      .insert(aliases);
    
    if (insertError) {
      console.error('Error inserting aliases:', insertError);
      return false;
    }
    
    console.log('Aliases assigned successfully:', aliases);
    return true;
  } catch (error) {
    console.error('Error assigning aliases:', error);
    return false;
  }
}

/**
 * Get the alias for a specific contractor on a project
 * @param projectId The project ID
 * @param contractorId The contractor ID
 * @returns Promise resolving to the alias or null
 */
export async function getContractorAlias(projectId: string, contractorId: string): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('contractor_aliases')
      .select('alias')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .single();
    
    if (error) {
      console.error('Error getting contractor alias:', error);
      return null;
    }
    
    return data?.alias || null;
  } catch (error) {
    console.error('Error getting contractor alias:', error);
    return null;
  }
}

/**
 * Get all contractors with aliases for a project
 * @param projectId The project ID
 * @returns Promise resolving to an array of contractors with aliases
 */
export async function getContractorsWithAliases(projectId: string): Promise<ContractorWithAlias[]> {
  try {
    const supabase = getSupabaseClient();
    const result: ContractorWithAlias[] = [];
    
    // First try to get contractors from messages
    try {
      // Get unique sender IDs from messages for this project
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('project_id', projectId)
        .not('sender_id', 'is', null);
      
      if (!messagesError && messages && messages.length > 0) {
        // Get unique sender IDs
        const senderIds = [...new Set(messages.map(m => m.sender_id))];
        
        // Get contractor profiles for these IDs
        if (senderIds.length > 0) {
          const { data: contractors, error: contractorsError } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', senderIds);
          
          if (!contractorsError && contractors && contractors.length > 0) {
            // Get aliases for these contractors
            const { data: aliases } = await supabase
              .from('contractor_aliases')
              .select('contractor_id, alias')
              .eq('project_id', projectId);
            
            // Add contractors from messages to the result
            contractors.forEach(contractor => {
              const alias = aliases?.find(a => a.contractor_id === contractor.id)?.alias || null;
              
              result.push({
                id: contractor.id,
                name: contractor.name || 'Unknown Contractor',
                alias,
                avatar: contractor.avatar_url,
                bidAmount: null // No bid amount for contractors from messages
              });
            });
          }
        }
      }
    } catch (err) {
      console.error('Error getting contractors from messages:', err);
      // Continue to try getting contractors from bids
    }
    
    // Then try to get contractors from bids
    try {
      // Get all bids for this project with contractor information
      const { data: bids, error: bidsError } = await supabase
        .from('bids')
        .select(`
          id,
          amount,
          contractor_id,
          contractors (
            id,
            name,
            avatar_url
          )
        `)
        .eq('project_id', projectId);
      
      if (!bidsError && bids && bids.length > 0) {
        // Get aliases for all contractors
        const { data: aliases } = await supabase
          .from('contractor_aliases')
          .select('contractor_id, alias')
          .eq('project_id', projectId);
        
        // Map bids to contractors with aliases
        bids.forEach((bid: any) => {
          const contractor = bid.contractors;
          
          // Skip if contractor is null or undefined
          if (!contractor) return;
          
          // Skip if this contractor is already in the result
          if (result.some(c => c.id === contractor.id)) return;
          
          const alias = aliases?.find((a: any) => a.contractor_id === bid.contractor_id)?.alias || null;
          
          result.push({
            id: contractor.id || bid.contractor_id,
            name: contractor.name || 'Unknown Contractor',
            alias,
            avatar: contractor.avatar_url,
            bidAmount: bid.amount
          });
        });
      }
    } catch (err) {
      console.error('Error getting contractors from bids:', err);
    }
    
    // If no contractors found, return empty array
    if (result.length === 0) {
      console.log('No contractors found for this project');
    }
    
    return result;
  } catch (error) {
    console.error('Error getting contractors with aliases:', error);
    return [];
  }
}

/**
 * Upload file attachments for a message
 * @param messageId The message ID
 * @param files Array of files to upload
 * @returns Promise resolving to an array of attachment objects
 */
export async function uploadAttachments(messageId: string, files: File[]): Promise<MessageAttachment[]> {
  try {
    const supabase = getSupabaseClient();
    const attachments: MessageAttachment[] = [];
    
    for (const file of files) {
      const fileId = uuidv4();
      const fileExt = file.name.split('.').pop();
      const fileName = `${fileId}.${fileExt}`;
      const filePath = `message-attachments/${messageId}/${fileName}`;
      
      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message_attachments')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue;
      }
      
      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('message_attachments')
        .getPublicUrl(filePath);
      
      const fileUrl = urlData?.publicUrl;
      
      // Create attachment record
      const { data: attachment, error: attachmentError } = await supabase
        .from('message_attachments')
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: fileUrl
        })
        .select()
        .single();
      
      if (attachmentError) {
        console.error('Error creating attachment record:', attachmentError);
        continue;
      }
      
      attachments.push(attachment as unknown as MessageAttachment);
    }
    
    return attachments;
  } catch (error) {
    console.error('Error uploading attachments:', error);
    toast({
      title: 'Error',
      description: 'Failed to upload attachments. Please try again.',
      variant: 'destructive',
    });
    return [];
  }
}

/**
 * Send an individual message to a specific recipient
 * @param projectId - The project ID
 * @param recipientId - The recipient ID
 * @param content - The message content
 * @param files - Optional files to attach
 * @returns Success status
 */
export async function sendIndividualMessage(
  projectId: string,
  recipientId: string,
  content: string,
  files: File[] = []
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    // Get the current user ID - require authentication
    const senderId = await getUserId();
  
    if (!senderId) {
      console.error('Authentication required to send messages');
      return false;
    }
  
    console.log('Sending individual message:', {
      projectId,
      senderId,
      recipientId,
      content,
      filesCount: files.length
    });
  
    // Step 1: Create the message in the messages table (without recipient_id)
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: senderId,
        content,
        message_type: 'individual'
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('Error creating message:', messageError);
      return false;
    }
  
    
    console.log('Message created successfully:', message);
    
    // Step 2: Create an entry in the message_recipients table
    const { error: recipientError } = await supabase
      .from('message_recipients')
      .insert({
        message_id: message.id,
        recipient_id: recipientId
      });
    
    if (recipientError) {
      console.error('Error creating message recipient:', recipientError);
      return false;
    }
    
    console.log('Message recipient created successfully for:', recipientId);
    
    // Step 3: Upload files if any
    if (files.length > 0) {
      await uploadAttachments(message.id, files);
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendIndividualMessage:', error);
    return false;
  }
}

/**
 * Send a group message to all contractors for a project
 * @param projectId The project ID
 * @param content The message content
 * @param files Optional array of files to attach
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function sendGroupMessage(
  projectId: string,
  content: string,
  files: File[] = []
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    // Get the current user ID - require authentication
    const senderId = await getUserId();
    
    if (!senderId) {
      throw new Error('Authentication required to send messages');
    }
    
    // Get all contractors for this project
    const { data: contractors, error: contractorsError } = await supabase
      .from('bids')
      .select('contractor_id')
      .eq('project_id', projectId)
      .eq('status', 'submitted');
    
    if (contractorsError) {
      console.error('Error getting contractors:', contractorsError);
      return false;
    }
    
    if (!contractors || contractors.length === 0) {
      console.error('No contractors found for this project');
      return false;
    }
    
    // Get unique contractor IDs
    const contractorIds = [...new Set(contractors.map((c: any) => c.contractor_id))];
    
    // Step 1: Create the group message in the messages table
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: senderId,
        content,
        message_type: 'group'
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('Error creating group message:', messageError);
      return false;
    }
    
    console.log('Group message created successfully:', message);
    
    // Step 2: Create entries in the message_recipients table for all contractors
    const messageRecipients = contractorIds.map(contractorId => ({
      message_id: message.id,
      recipient_id: contractorId
    }));
    
    const { error: recipientsError } = await supabase
      .from('message_recipients')
      .insert(messageRecipients);
    
    if (recipientsError) {
      console.error('Error creating message recipients:', recipientsError);
      return false;
    }
    
    console.log('Message recipients created successfully for contractors:', contractorIds);
    
    // Step 3: Upload files if any
    if (files.length > 0) {
      await uploadAttachments(message.id, files);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending group message:', error);
    return false;
  }
}

/**
 * Get messages for a project
 * @param projectId - The project ID
 * @param contractorId - Optional contractor ID for filtering individual messages
 * @returns Array of formatted messages
 */
export async function getProjectMessages(
  projectId: string,
  contractorId?: string
): Promise<FormattedMessage[]> {
  try {
    const supabase = getSupabaseClient();
    
    // Get the current user ID (or fallback for development)
    const userId = await getUserId();
    
    console.log('Getting messages for project:', projectId, 'and user:', userId);
    
    // Step 1: Get all messages for this project
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        project_id,
        sender_id,
        content,
        message_type,
        contractor_alias,
        created_at,
        message_attachments (
          id,
          file_name,
          file_size,
          file_type,
          file_url,
          created_at
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error('Error getting messages:', messagesError);
      return [];
    }
    
    if (!messages || messages.length === 0) {
      console.log('No messages found for project:', projectId);
      return [];
    }
    
    console.log(`Found ${messages.length} messages for project:`, projectId);
    
    // Step 2: Get all message IDs
    const messageIds = messages.map(m => m.id);
    
    // Step 3: Get recipients for these messages
    const { data: recipients, error: recipientsError } = await supabase
      .from('message_recipients')
      .select('message_id, recipient_id')
      .in('message_id', messageIds);
    
    if (recipientsError) {
      console.error('Error getting message recipients:', recipientsError);
    }
    
    // Step 4: Get contractor aliases
    const { data: aliases, error: aliasesError } = await supabase
      .from('contractor_aliases')
      .select('contractor_id, alias')
      .eq('project_id', projectId);
    
    if (aliasesError) {
      console.error('Error getting contractor aliases:', aliasesError);
    }
    
    // Step 5: Format messages
    const formattedMessages: FormattedMessage[] = messages.map(message => {
      // Get recipients for this message
      const messageRecipients = recipients?.filter(r => r.message_id === message.id) || [];
      
      // For contractors, show all messages in the project
      // This ensures the full conversation thread is visible
      // and avoids client-side exceptions from complex filtering
      
      // Get sender alias if it's a contractor
      const senderAlias = message.contractor_alias || 
        aliases?.find(a => a.contractor_id === message.sender_id)?.alias || null;
      
      // Format attachments
      const formattedAttachments = message.message_attachments?.map((attachment: any) => ({
        id: attachment.id,
        fileName: attachment.file_name,
        fileUrl: attachment.file_url,
        fileType: attachment.file_type,
        fileSize: attachment.file_size
      })) || [];
      
      return {
        id: message.id,
        senderId: message.sender_id,
        senderAlias,
        content: message.content,
        timestamp: message.created_at,
        isOwn: message.sender_id === userId,
        isGroup: message.message_type === 'group',
        attachments: formattedAttachments
      };
    }).filter(Boolean) as FormattedMessage[];
    
    return formattedMessages;
  } catch (error) {
    console.error('Error getting project messages:', error);
    return [];
  }
}

/**
 * Subscribe to real-time messages for a project
 * @param projectId The project ID
 * @param userId The current user ID
 * @param callback Function to call when a new message is received
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  projectId: string,
  userId: string,
  callback: (message: FormattedMessage) => void
): () => void {
  try {
    const supabase = getSupabaseClient();
    
    console.log('Setting up real-time subscription for messages:', { projectId, userId });
    
    // Subscribe to new messages in the messages table
    const subscription = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('New message received via subscription:', payload);
          
          const newMessage = payload.new as any;
          
          // Check if this message is relevant to the current user
          // (they are either the sender or a recipient)
          if (newMessage.sender_id !== userId) {
            // Check if the user is a recipient of this message
            const { data: recipient, error: recipientError } = await supabase
              .from('message_recipients')
              .select('*')
              .eq('message_id', newMessage.id)
              .eq('recipient_id', userId)
              .single();
            
            if (recipientError || !recipient) {
              console.log('Message is not for this user, ignoring');
              return;
            }
          }
          
          // Get attachments for this message
          const { data: messageAttachments, error: attachmentsError } = await supabase
            .from('message_attachments')
            .select('*')
            .eq('message_id', newMessage.id);
          
          if (attachmentsError) {
            console.error('Error getting attachments:', attachmentsError);
          }
          
          // Get sender alias if it's a contractor
          let senderAlias = newMessage.contractor_alias;
          
          if (!senderAlias && newMessage.sender_id !== userId) {
            const { data: alias, error: aliasError } = await supabase
              .from('contractor_aliases')
              .select('alias')
              .eq('project_id', projectId)
              .eq('contractor_id', newMessage.sender_id)
              .single();
            
            if (!aliasError && alias) {
              senderAlias = alias.alias;
            }
          }
          
          // Format attachments
          const formattedAttachments = messageAttachments?.map((attachment: any) => ({
            id: attachment.id,
            fileName: attachment.file_name,
            fileUrl: attachment.file_url,
            fileType: attachment.file_type,
            fileSize: attachment.file_size
          })) || [];
          
          // Format the message
          const formattedMessage: FormattedMessage = {
            id: newMessage.id,
            senderId: newMessage.sender_id,
            senderAlias,
            content: newMessage.content,
            timestamp: newMessage.created_at,
            isOwn: newMessage.sender_id === userId,
            isGroup: newMessage.message_type === 'group',
            attachments: formattedAttachments
          };
          
          // Call the callback with the formatted message
          callback(formattedMessage);
        }
      )
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      console.log('Unsubscribing from messages channel');
      supabase.channel('messages-channel').unsubscribe();
    };
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    return () => {};
  }
}

/**
 * Mark a message as read
 * @param messageId The message ID
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    // Get the current user ID (or fallback for development)
    const userId = await getUserId();
    
    // Update the message recipient record
    const { error } = await supabase
      .from('message_recipients')
      .update({ read_at: new Date().toISOString() })
      .eq('message_id', messageId)
      .eq('recipient_id', userId);
    
    if (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
}