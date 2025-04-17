'use client';

import { supabase, ensureAuthentication } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
  recipient_id: string | null;
  content: string;
  message_type: 'individual' | 'group';
  contractor_alias: string | null;
  created_at: string;
  read_at: string | null;
  attachments?: MessageAttachment[];
}

export interface ContractorWithAlias {
  id: string;
  full_name: string;
  company_name?: string;
  alias: string;
  bid_amount?: number;
  bid_status?: string;
  avatar_url?: string;
}

export interface FormattedMessage {
  id: string;
  senderId: string;
  senderAlias?: string | undefined;
  content: string;
  timestamp: string;
  isOwn: boolean;
  isGroup: boolean;
  clientId?: string | undefined;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }> | undefined;
}

/**
 * Assign aliases (A, B, C, D, E) to contractors who have bid on a project
 * @param projectId The project ID
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function assignContractorAliases(projectId: string): Promise<boolean> {
  try {
    // Ensure we have authentication
    await ensureAuthentication();
    
    // Check if we already have aliases assigned for this project
    const { data: existingAliases } = await supabase
      .from('contractor_aliases')
      .select('*')
      .eq('project_id', projectId);
    
    if (existingAliases && existingAliases.length > 0) {
      console.log('Aliases already assigned for this project');
      return true;
    }
    
    // Get all bids for this project with contractor information
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select(`
        id,
        project_id,
        contractor_id,
        contractors (
          id,
          full_name,
          company_name
        )
      `)
      .eq('project_id', projectId);
    
    if (bidsError) {
      console.error('Error getting bids:', bidsError);
      return false;
    }
    
    if (!bids || bids.length === 0) {
      console.log('No bids found for this project');
      return false;
    }
    
    // Assign aliases (A, B, C, etc.) to contractors
    const aliases = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const contractorAliases = bids.map((bid, index) => ({
      project_id: projectId,
      contractor_id: bid.contractor_id,
      alias: aliases[index] || `Contractor ${index + 1}`
    }));
    
    // Insert aliases into the database
    const { error: insertError } = await supabase
      .from('contractor_aliases')
      .insert(contractorAliases);
    
    if (insertError) {
      console.error('Error inserting aliases:', insertError);
      return false;
    }
    
    console.log('Aliases assigned successfully');
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
export async function getContractorAlias(
  projectId: string, 
  contractorId: string
): Promise<string | null> {
  try {
    // Ensure we have authentication
    await ensureAuthentication();
    
    // Get the alias from the database
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
export async function getContractorsWithAliases(
  projectId: string
): Promise<ContractorWithAlias[]> {
  try {
    // Ensure we have authentication
    await ensureAuthentication();
    
    // Get all bids for this project with contractor information
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select(`
        id,
        amount,
        status,
        project_id,
        contractor_id,
        contractors (
          id,
          full_name,
          company_name,
          avatar_url
        )
      `)
      .eq('project_id', projectId);
    
    if (bidsError) {
      console.error('Error getting bids:', bidsError);
      return [];
    }
    
    if (!bids || bids.length === 0) {
      console.log('No bids found for this project');
      return [];
    }
    
    // Get aliases for this project
    const { data: aliases, error: aliasesError } = await supabase
      .from('contractor_aliases')
      .select('*')
      .eq('project_id', projectId);
    
    if (aliasesError) {
      console.error('Error getting aliases:', aliasesError);
      
      // If no aliases exist yet, try to assign them
      const assigned = await assignContractorAliases(projectId);
      if (!assigned) {
        return [];
      }
      
      // Get the newly assigned aliases
      const { data: newAliases, error: newAliasesError } = await supabase
        .from('contractor_aliases')
        .select('*')
        .eq('project_id', projectId);
      
      if (newAliasesError) {
        console.error('Error getting newly assigned aliases:', newAliasesError);
        return [];
      }
      
      // Map contractors to their aliases
      const contractorsWithAliases: ContractorWithAlias[] = bids.map((bid, index) => {
        const alias = newAliases[index]?.alias || String.fromCharCode(65 + index); // A, B, C, etc.
        
        // Find bid amount if available
        const bidAmount = bids.find(b => b.contractor_id === bid.contractor_id)?.amount;
        
        return {
          id: bid.contractor_id,
          full_name: bid.contractors?.full_name || '',
          company_name: bid.contractors?.company_name || undefined,
          alias,
          bid_amount: bidAmount || undefined,
          avatar_url: bid.contractors?.avatar_url || undefined
        };
      });
      
      return contractorsWithAliases;
    }
    
    // Map contractors to their aliases
    return bids.map(bid => {
      const alias = aliases?.find(a => a.contractor_id === bid.contractor_id);
      return {
        id: bid.contractor_id,
        full_name: bid.contractors?.full_name || 'Unknown Contractor',
        company_name: bid.contractors?.company_name,
        alias: alias?.alias || 'Unknown',
        bid_amount: bid.amount,
        bid_status: bid.status,
        avatar_url: bid.contractors?.avatar_url
      };
    });
  } catch (error) {
    console.error('Error getting contractors with aliases:', error);
    return [];
  }
}

/**
 * Helper function to handle file attachments for messages
 * @param messageId The message ID
 * @param files Array of files to attach
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function handleFileAttachments(messageId: string, files: File[]): Promise<boolean> {
  try {
    // Ensure we have authentication
    await ensureAuthentication();
    
    if (!files || files.length === 0) {
      return true; // No files to attach
    }
    
    console.log(`Processing ${files.length} attachments for message ${messageId}`);
    
    // Verify storage bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log('Available buckets:', buckets?.map(b => `${b.name} (public: ${b.public})`).join(', '));
    
    const BUCKET_NAME = 'message-attachments';
    const attachmentBucket = buckets?.find(b => b.name === BUCKET_NAME);
    
    if (!attachmentBucket) {
      console.error(`${BUCKET_NAME} bucket not found. Creating bucket...`);
      const { error: createBucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createBucketError) {
        console.error(`Error creating ${BUCKET_NAME} bucket:`, createBucketError);
        toast({
          title: 'Storage Error',
          description: 'Could not create storage bucket for attachments.',
          variant: 'destructive',
        });
        return false;
      }
    } else {
      console.log(`Using existing bucket: ${BUCKET_NAME} (public: ${attachmentBucket.public})`);
    }
    
    const attachments = [];
    
    // Upload each file to storage
    for (const file of files) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error(`File ${file.name} exceeds 5MB limit`);
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds the 5MB limit.`,
          variant: 'destructive',
        });
        continue;
      }
      
      // Create a unique file path with timestamp to prevent collisions
      const timestamp = new Date().getTime();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
      const filePath = `uploads/${messageId}/${timestamp}_${safeName}`;
      
      console.log(`Uploading file: ${file.name} (${file.size} bytes) to path: ${filePath}`);
      
      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast({
          title: 'Upload Failed',
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: 'destructive',
        });
        continue;
      }
      
      console.log('File uploaded successfully:', filePath);
      
      // Get the public URL for the file
      const { data: urlData } = await supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        console.error('Error getting public URL for file');
        continue;
      }
      
      console.log('Public URL:', urlData.publicUrl);
      
      // Add attachment to the list
      attachments.push({
        message_id: messageId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type
      });
      
      // Log successful upload for verification
      console.log(`File attachment record created for ${file.name}`);
    }
    
    // Insert attachments into the database
    if (attachments.length > 0) {
      console.log(`Inserting ${attachments.length} attachment records into message_attachments table`);
      
      const { data: insertData, error: insertError } = await supabase
        .from('message_attachments')
        .insert(attachments)
        .select();
      
      if (insertError) {
        console.error('Error inserting attachments:', insertError);
        toast({
          title: 'Database Error',
          description: 'Failed to save attachment information.',
          variant: 'destructive',
        });
        return false;
      }
      
      console.log('Attachment records inserted successfully:', insertData);
      
      // Verify attachments were saved correctly
      const { data: savedAttachments, error: verifyError } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('message_id', messageId);
      
      if (verifyError || !savedAttachments || savedAttachments.length === 0) {
        console.error('Error verifying attachments:', verifyError);
        return false;
      }
      
      console.log(`${savedAttachments.length} attachments saved successfully for message ${messageId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error handling file attachments:', error);
    toast({
      title: 'Error',
      description: 'Failed to process file attachments. Please try again.',
      variant: 'destructive',
    });
    return false;
  }
}

/**
 * Send a message to a specific contractor
 * @param projectId The project ID
 * @param contractorId The contractor ID
 * @param content The message content
 * @param files Optional array of files to attach
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function sendIndividualMessage(
  projectId: string,
  contractorId: string,
  content: string,
  files?: File[]
): Promise<boolean> {
  try {
    // Ensure we have authentication
    await ensureAuthentication();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to send messages.',
        variant: 'destructive',
      });
      return false;
    }
    
    // Get the contractor's alias
    const alias = await getContractorAlias(projectId, contractorId);
    
    // Create the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: user.id,
        recipient_id: contractorId,
        content,
        message_type: 'individual',
        contractor_alias: alias
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('Error sending message:', messageError);
      return false;
    }
    
    // Handle file attachments if any
    if (files && files.length > 0) {
      const attachmentsSuccess = await handleFileAttachments(message.id, files);
      if (!attachmentsSuccess) {
        console.error('Error handling file attachments');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending individual message:', error);
    return false;
  }
}

/**
 * Send a message to all contractors for a project
 * @param projectId The project ID
 * @param content The message content
 * @param files Optional array of files to attach
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function sendGroupMessage(
  projectId: string,
  content: string,
  files?: File[]
): Promise<boolean> {
  try {
    // Ensure we have authentication
    await ensureAuthentication();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to send messages.',
        variant: 'destructive',
      });
      return false;
    }
    
    // Get all contractors with aliases for this project
    const contractors = await getContractorsWithAliases(projectId);
    
    if (contractors.length === 0) {
      toast({
        title: 'No contractors',
        description: 'There are no contractors to message for this project.',
        variant: 'destructive',
      });
      return false;
    }
    
    // Create the group message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: user.id,
        recipient_id: null, // null for group messages
        content,
        message_type: 'group',
        contractor_alias: null // null for group messages
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('Error sending group message:', messageError);
      return false;
    }
    
    // Create message recipients (all contractors for this project)
    const recipients = contractors.map(contractor => ({
      message_id: message.id,
      recipient_id: contractor.id
    }));
    
    // Insert recipients
    const { error: recipientsError } = await supabase
      .from('message_recipients')
      .insert(recipients);
    
    if (recipientsError) {
      console.error('Error adding message recipients:', recipientsError);
    }
    
    // Handle file attachments if any
    if (files && files.length > 0) {
      const attachmentsSuccess = await handleFileAttachments(message.id, files);
      if (!attachmentsSuccess) {
        console.error('Error handling file attachments');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending group message:', error);
    return false;
  }
}

/**
 * Get messages for a project, including both individual and group messages
 * @param projectId The project ID
 * @param contractorId Optional contractor ID for filtering individual messages
 * @returns Promise resolving to an array of formatted messages
 */
export async function getProjectMessages(
  projectId: string,
  contractorId?: string
): Promise<FormattedMessage[]> {
  try {
    // Ensure we have authentication
    await ensureAuthentication();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to view messages.',
        variant: 'destructive',
      });
      return [];
    }
    
    // Get all contractors with aliases for this project
    const contractors = await getContractorsWithAliases(projectId);
    
    // Query for messages
    let query = supabase
      .from('messages')
      .select(`
        *,
        message_attachments (*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    // If contractorId is provided, filter for individual messages with that contractor
    if (contractorId) {
      query = query.or(`and(message_type.eq.individual,or(and(sender_id.eq.${user.id},recipient_id.eq.${contractorId}),and(sender_id.eq.${contractorId},recipient_id.eq.${user.id})))`);
    } else {
      // Otherwise, get all messages for this project (both individual and group)
      query = query.or(`or(message_type.eq.group,and(message_type.eq.individual,or(sender_id.eq.${user.id},recipient_id.eq.${user.id})))`);
    }
    
    const { data: messages, error: messagesError } = await query;
    
    if (messagesError) {
      console.error('Error getting messages:', messagesError);
      return [];
    }
    
    if (!messages || messages.length === 0) {
      return [];
    }
    
    // Process messages with attachments
    const formattedMessages: FormattedMessage[] = await Promise.all(
      messages.map(async (message) => {
        // Check if the current user is the sender
        const isOwn = message.sender_id === user.id;
        
        // Get sender alias if not own message
        let senderAlias: string | undefined = undefined;
        if (!isOwn && message.contractor_alias) {
          senderAlias = message.contractor_alias;
        } else if (!isOwn) {
          // Try to get alias from contractor_aliases table
          const { data: aliasData } = await supabase
            .from('contractor_aliases')
            .select('alias')
            .eq('project_id', projectId)
            .eq('contractor_id', message.sender_id)
            .single();
          
          senderAlias = aliasData?.alias;
        }
        
        // Get attachments if any
        const { data: attachments } = await supabase
          .from('message_attachments')
          .select('*')
          .eq('message_id', message.id);
        
        // Format attachments
        const formattedAttachments = attachments?.map((attachment: any) => ({
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
          isOwn,
          isGroup: message.message_type === 'group',
          clientId: `msg-${message.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          attachments: formattedAttachments.length > 0 ? formattedAttachments : undefined
        };
      })
    );
    
    return formattedMessages;
  } catch (error) {
    console.error('Error getting project messages:', error);
    return [];
  }
}

/**
 * Mark a message as read
 * @param messageId The message ID
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  try {
    // Ensure we have authentication
    await ensureAuthentication();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }
    
    // Check if this is an individual message where the user is the recipient
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();
    
    if (messageError) {
      console.error('Error getting message:', messageError);
      return false;
    }
    
    if (message.message_type === 'individual' && message.recipient_id === user.id) {
      // Mark the individual message as read
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
      
      if (updateError) {
        console.error('Error marking message as read:', updateError);
        return false;
      }
    } else if (message.message_type === 'group') {
      // For group messages, mark the recipient entry as read
      const { error: updateError } = await supabase
        .from('message_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('message_id', messageId)
        .eq('recipient_id', user.id);
      
      if (updateError) {
        console.error('Error marking group message as read:', updateError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
}

/**
 * Subscribe to new messages for a project
 * @param projectId The project ID
 * @param contractorId Optional contractor ID for filtering individual messages
 * @param callback Function to call when a new message is received
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  projectId: string,
  contractorId: string | null,
  callback: (message: FormattedMessage) => void
): () => void {
  // Initialize with a no-op unsubscribe function
  let unsubscribe = () => {};
  
  // Set up the subscription asynchronously
  (async () => {
    try {
      // Ensure we have authentication
      await ensureAuthentication();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated for subscription');
        return;
      }
      
      // Subscribe to new messages
      const subscription = supabase
        .channel(`messages:${projectId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        }, async (payload) => {
          // Process the new message
          const newMessage = payload.new as any;
          
          // Check if this is a message we should handle
          const isGroupMessage = newMessage.message_type === 'group';
          const isForSelectedContractor = contractorId 
            ? (newMessage.sender_id === contractorId || newMessage.recipient_id === contractorId)
            : true;
          const isForCurrentUser = newMessage.sender_id === user.id || newMessage.recipient_id === user.id;
          
          if ((isGroupMessage || (isForSelectedContractor && isForCurrentUser))) {
            // Format the message
            const formattedMessage: FormattedMessage = {
              id: newMessage.id,
              senderId: newMessage.sender_id,
              senderAlias: undefined, // Own messages don't need sender alias
              content: newMessage.content,
              timestamp: newMessage.created_at,
              isOwn: newMessage.sender_id === user.id,
              isGroup: isGroupMessage,
              clientId: `msg-${newMessage.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              attachments: undefined
            };
            
            // Get attachments if any
            const { data: attachments } = await supabase
              .from('message_attachments')
              .select('*')
              .eq('message_id', newMessage.id);
            
            // Format attachments
            const formattedAttachments = attachments?.map(attachment => ({
              id: attachment.id,
              fileName: attachment.file_name,
              fileUrl: attachment.file_url,
              fileType: attachment.file_type,
              fileSize: attachment.file_size
            })) || [];
            
            // Update formatted message with attachments
            formattedMessage.attachments = formattedAttachments.length > 0 ? formattedAttachments : undefined;
            
            // Call the callback with the new message
            callback(formattedMessage);
          }
        })
        .subscribe();
      
      // Update the unsubscribe function
      unsubscribe = () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up message subscription:', error);
    }
  })();
  
  // Return the unsubscribe function
  return () => unsubscribe();
}
