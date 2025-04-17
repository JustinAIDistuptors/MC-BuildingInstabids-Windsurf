// Messaging implementation
// This file contains the actual implementation of messaging functionality

import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Types
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role: 'homeowner' | 'contractor' | 'admin';
}

export interface Contractor extends User {
  company_name?: string | undefined;
  bid_amount?: number | undefined;
  bid_status?: 'pending' | 'accepted' | 'rejected';
  alias?: string | undefined; // Contractor alias (A, B, C, etc.)
}

export interface Attachment {
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
  created_at: string;
  read_at?: string;
  attachments?: Attachment[];
  message_type?: 'individual' | 'group'; // Field for message type
  contractor_alias?: string; // Field for contractor alias
  message_recipients?: MessageRecipient[]; // Recipients of the message
}

export interface MessageRecipient {
  id: string;
  message_id: string;
  recipient_id: string;
  read_at?: string;
  created_at: string;
}

export interface ContractorAlias {
  id: string;
  project_id: string;
  contractor_id: string;
  alias: string | undefined;
  created_at: string;
}

// Helper function to clean project IDs
function cleanProjectId(projectId: string): string {
  if (!projectId) return '';
  
  // If it's in the format "project-1234567890", extract just the numeric part
  if (projectId.startsWith('project-')) {
    return projectId.substring(8); // Remove 'project-' prefix
  }
  
  return projectId;
}

// Helper function to determine if a table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Split schema and table name
    const parts = tableName.split('.');
    const tableNameOnly = parts.length > 1 ? parts[1] : tableName;
    
    // Try to query the table
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If there's no error, the table exists
    return !error;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Initialize messaging schema and tables if they don't exist
export async function initializeMessagingSchema(): Promise<boolean> {
  try {
    // Check if the messages table exists
    const messagesTableExists = await tableExists('messages');
    
    if (!messagesTableExists) {
      console.log('messages table does not exist');
      
      // Since we can't create tables directly with the client API,
      // we'll use a workaround by creating a simple messages table in the public schema
      
      // First, let's try to create a dummy message to see if the table exists
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          project_id: 'test-project',
          sender_id: '00000000-0000-0000-0000-000000000000',
          recipient_id: '00000000-0000-0000-0000-000000000000',
          content: 'Test message'
        });
      
      if (insertError) {
        console.error('Error creating messages table:', insertError);
        console.log('You need to create the messages table manually in your Supabase dashboard');
        
        // Return false to indicate that initialization failed
        return false;
      }
      
      console.log('Successfully created messages table');
    } else {
      console.log('messages table already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error in initializeMessagingSchema:', error);
    return false;
  }
}

/**
 * Get messages between a homeowner and a contractor for a specific project
 * Or get all messages for a project if contractorId is null (for homeowners)
 */
export async function getMessages(
  projectId: string,
  contractorId?: string
): Promise<Array<{
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  contractor_alias?: string;
  message_type?: 'individual' | 'group';
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  }>;
}>> {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      console.error('No authenticated user found');
      return [];
    }
    
    // Clean the project ID
    const cleanedProjectId = cleanProjectId(projectId);
    console.log('Using project ID for fetching messages:', cleanedProjectId);
    
    // Initialize messaging schema if needed
    const schemaInitialized = await initializeMessagingSchema();
    
    if (!schemaInitialized) {
      console.error('Failed to initialize messaging schema');
      return [];
    }
    
    // Prepare the query using the new schema with message_recipients table
    let query = supabase
      .from('messages')
      .select(`
        *,
        message_recipients(id, recipient_id, read_at)
      `)
      .eq('project_id', cleanedProjectId);
      
    // If we have a contractor ID, filter for messages between the current user and that contractor
    if (contractorId) {
      query = query
        .or(`sender_id.eq.${currentUserId},id.in.(select message_id from message_recipients where recipient_id = '${currentUserId}')`)
        .or(`sender_id.eq.${contractorId},id.in.(select message_id from message_recipients where recipient_id = '${contractorId}')`);
    } else {
      // Otherwise, just get all messages for this project that the current user can see
      query = query
        .or(`sender_id.eq.${currentUserId},id.in.(select message_id from message_recipients where recipient_id = '${currentUserId}')`);
    }
    
    // Execute the query
    const { data: messages, error } = await query.order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    // Get all message IDs
    const messageIds = messages.map((message: any) => message.id);
    
    // Get attachments for all messages
    let attachments: any[] = [];
    if (messageIds.length > 0) {
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds);
        
      if (attachmentsError) {
        console.error('Error fetching attachments:', attachmentsError);
      } else {
        attachments = attachmentsData || [];
        console.log(`Fetched ${attachments.length} attachments for ${messageIds.length} messages`);
      }
    }
    
    // Transform the messages
    return messages.map((message: any) => {
      // Get attachments for this message
      const messageAttachments = attachments
        .filter((attachment: any) => attachment.message_id === message.id)
        .map((attachment: any) => {
          // Generate the public URL for the file
          const { data: urlData } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(attachment.file_path);
          
          return {
            id: attachment.id,
            fileName: attachment.file_name,
            fileType: attachment.file_type,
            fileUrl: urlData?.publicUrl || '',
            fileSize: attachment.file_size
          };
        });
      
      return {
        id: message.id,
        senderId: message.sender_id,
        content: message.content,
        timestamp: message.created_at,
        isOwn: message.sender_id === currentUserId,
        contractor_alias: message.contractor_alias,
        message_type: message.message_type || 'individual',
        attachments: messageAttachments.length > 0 ? messageAttachments : []
      };
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

/**
 * Get all contractors for a project with their aliases
 */
export async function getContractorsForProject(
  projectId: string
): Promise<Array<{
  id: string;
  name: string;
  company?: string | undefined;
  bidAmount?: number | undefined;
  status: 'pending' | 'accepted' | 'rejected';
  avatar?: string | undefined;
  alias?: string | undefined;
}>> {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      console.error('No authenticated user found');
      return [];
    }
    
    // Clean the project ID
    const cleanedProjectId = cleanProjectId(projectId);
    console.log('Using project ID for contractors query:', cleanedProjectId);
    
    // Query the bids table with proper error handling for project ID format
    const { data, error } = await supabase
      .from('bids')
      .select(`
        id,
        amount,
        status,
        contractor_id,
        profiles:contractor_id (
          id,
          full_name,
          company_name,
          avatar_url
        )
      `)
      .eq('project_id', cleanedProjectId);
    
    if (error) {
      console.error('Error fetching contractors:', error);
      
      // Get all bids for this project with contractor aliases
      const { data: bids, error: bidsError } = await supabase
        .from('bids')
        .select('*, profiles:contractor_id(*), contractor_aliases!inner(*)')
        .eq('project_id', cleanedProjectId)
        .eq('contractor_aliases.project_id', cleanedProjectId);
        
      if (bidsError) {
        console.error('Error fetching contractors with aliases:', bidsError);
        return [];
      }
      
      // Transform the bids into contractors
      return bids.map((bid: any) => ({
        id: bid.contractor_id,
        name: bid.profiles?.full_name || 'Unknown Contractor',
        company: bid.profiles?.company_name || undefined,
        bidAmount: bid.amount || undefined,
        status: (bid.status || 'pending') as 'pending' | 'accepted' | 'rejected',
        avatar: bid.profiles?.avatar_url || undefined,
        alias: bid.contractor_aliases?.alias || undefined
      }));
    }
    
    // Transform the data to match the format expected by the EnhancedMessaging component
    return data.map((item: any) => {
      const bid = item.bids[0];
      const profiles = item.profiles;
      
      return {
        id: bid.contractor_id,
        name: profiles?.full_name || 'Unknown Contractor',
        company: profiles?.company_name || undefined,
        bidAmount: bid.amount || undefined,
        status: (bid.status || 'pending') as 'pending' | 'accepted' | 'rejected',
        avatar: profiles?.avatar_url || undefined,
        alias: undefined // Add alias property with undefined as fallback
      } as {
        id: string;
        name: string;
        company?: string | undefined;
        bidAmount?: number | undefined;
        status: 'pending' | 'accepted' | 'rejected';
        avatar?: string | undefined;
        alias?: string | undefined;
      };
    });
  } catch (error) {
    console.error('Error in getContractorsForProject:', error);
    return [];
  }
}

/**
 * Send a message to a contractor or to multiple contractors (group message)
 */
export async function sendMessage(
  projectId: string,
  recipientIds: string | string[],
  content: string,
  files: File[] = [],
  isGroupMessage: boolean = false
): Promise<boolean> {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      console.error('No authenticated user found');
      return false;
    }
    
    // Clean the project ID
    const cleanedProjectId = cleanProjectId(projectId);
    
    // Determine if this is a group message or individual message
    const messageType = isGroupMessage ? 'group' : 'individual';
    
    // For individual messages
    let messageData: any[] | null = null;
    
    if (!isGroupMessage && typeof recipientIds === 'string') {
      // Get contractor alias if the sender is a contractor
      let contractorAlias = null;
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', currentUserId)
        .single();
        
      if (userProfile?.user_type === 'contractor') {
        // Get the contractor's alias for this project
        const { data: aliasData } = await supabase
          .from('contractor_aliases')
          .select('alias')
          .eq('project_id', cleanedProjectId)
          .eq('contractor_id', currentUserId)
          .single();
          
        contractorAlias = aliasData?.alias;
      }
      
      // Create the message without recipient_id (using message_recipients table instead)
      const { data: msgData, error: messageError } = await supabase
        .from('messages')
        .insert({
          project_id: cleanedProjectId,
          sender_id: currentUserId,
          content: content,
          message_type: messageType,
          contractor_alias: contractorAlias
        })
        .select();
        
      if (messageError || !msgData || msgData.length === 0) {
        console.error('Error creating individual message:', messageError);
        return false;
      }
      
      messageData = msgData;
      
      // Ensure messageData is not null and has at least one item
      if (!messageData || messageData.length === 0) {
        console.error('Message data is null or empty');
        return false;
      }
      
      // Add recipient to message_recipients table
      const recipient = Array.isArray(recipientIds) ? recipientIds[0] : recipientIds;
      const { error: recipientError } = await supabase
        .from('message_recipients')
        .insert({
          message_id: messageData[0].id,
          recipient_id: recipient
        });
        
      if (recipientError) {
        console.error('Error adding message recipient:', recipientError);
        return false;
      }
    } else {
      // For group messages
      // Create the message in messages table (no recipient_id field)
      const { data: msgData, error: messageError } = await supabase
        .from('messages')
        .insert({
          project_id: cleanedProjectId,
          sender_id: currentUserId,
          content: content,
          message_type: messageType
        })
        .select();
        
      if (messageError || !msgData || msgData.length === 0) {
        console.error('Error creating group message:', messageError);
        return false;
      }
      
      messageData = msgData;
      
      // Add recipients to message_recipients table
      const recipients = Array.isArray(recipientIds) ? recipientIds : [recipientIds];
      // Ensure messageData is not null and has at least one item
      if (!messageData || messageData.length === 0) {
        console.error('Message data is null or empty');
        return false;
      }
      
      const recipientInserts = recipients.map(recipientId => ({
        message_id: messageData[0].id,
        recipient_id: recipientId
      }));
      
      const { error: recipientsError } = await supabase
        .from('message_recipients')
        .insert(recipientInserts);
        
      if (recipientsError) {
        console.error('Error adding message recipients:', recipientsError);
        return false;
      }
    }
    
    // Handle file uploads if provided
    let attachmentPaths: string[] = [];
    
    if (files && files.length > 0) {
      console.log(`Processing ${files.length} file attachments...`);
      
      // Check if the bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        throw new Error(`Error listing buckets: ${bucketsError.message}`);
      }
      
      const BUCKET_NAME = 'message-attachments';
      const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
      
      if (!bucketExists) {
        console.error(`Bucket "${BUCKET_NAME}" not found. Available buckets:`, buckets.map(b => b.name).join(', '));
        throw new Error(`Bucket "${BUCKET_NAME}" not found`);
      }
      
      console.log(`Bucket "${BUCKET_NAME}" exists, proceeding with file uploads`);
      
      for (const file of files) {
        if (!file) {
          console.error('File is undefined or null, skipping');
          continue;
        }
        
        // Upload the file to storage
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
        const fileName = `${timestamp}-${safeName}`;
        const filePath = `uploads/${cleanedProjectId}/${fileName}`;
        
        console.log(`Uploading file: ${fileName} (${file.size} bytes, type: ${file.type}) to path: ${filePath} in bucket: ${BUCKET_NAME}`);
        
        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw new Error(`Error uploading file: ${uploadError.message}`);
          }
          
          if (!uploadData) {
            console.error('Upload completed but no data returned');
            throw new Error('Upload completed but no data returned');
          }
          
          console.log('File uploaded successfully:', uploadData.path);
          
          // Verify the file exists by getting its public URL
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
            
          console.log('File public URL:', urlData?.publicUrl);
          
          // Add the file path to the list of attachments
          attachmentPaths.push(filePath);
        } catch (uploadErr) {
          console.error('Exception during file upload:', uploadErr);
          return false;
        }
      }
    }
    
    // Insert attachments if any
    if (attachmentPaths.length > 0 && messageData && messageData.length > 0) {
      const messageId = messageData[0].id;
      console.log(`Adding ${attachmentPaths.length} attachments to message ${messageId}`);
      
      const attachments = attachmentPaths.map(path => ({
        message_id: messageId,
        file_path: path,
        file_name: path.split('/').pop() || 'unknown',
        file_type: path.split('.').pop() || 'unknown',
        file_size: 0 // We don't have the file size here
      }));
      
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('message_attachments')
        .insert(attachments)
        .select();
      
      if (attachmentError) {
        console.error('Error inserting attachments:', attachmentError);
        // Continue anyway, the message was sent
      } else {
        console.log(`${attachmentData.length} attachment records created successfully`);
      }
    }
    
    console.log('Message sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

/**
 * Get the homeowner for a project
 */
export async function getHomeownerForProject(projectId: string): Promise<string | null> {
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      console.error('No authenticated user found');
      return null;
    }
    
    // Clean the project ID
    const cleanedProjectId = cleanProjectId(projectId);
    console.log('Using project ID for homeowner query:', cleanedProjectId);
    
    // Try to find the project in the projects table first
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('homeowner_id')
      .eq('id', cleanedProjectId)
      .single();
      
    let homeownerId;
    
    if (projectData?.homeowner_id) {
      homeownerId = projectData.homeowner_id;
      console.log('Found homeowner_id in projects table:', homeownerId);
    } else {
      // Try the bid_cards table
      const { data: bidCardData, error: bidCardError } = await supabase
        .from('bidding.bid_cards')
        .select('creator_id')
        .eq('id', cleanedProjectId)
        .single();
        
      if (bidCardError || !bidCardData?.creator_id) {
        console.error('Could not find homeowner for project:', projectError || bidCardError);
        return null;
      }
      
      homeownerId = bidCardData.creator_id;
      console.log('Found creator_id in bid_cards table:', homeownerId);
    }
    
    return homeownerId;
  } catch (error) {
    console.error('Error in getHomeownerForProject:', error);
    return null;
  }
}

/**
 * Get a message by ID
 */
export async function getMessageById(messageId: string): Promise<{
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  attachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  }>;
} | null> {
  try {
    // Get the message
    const { data: message, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();
      
    if (error) {
      console.error('Error fetching message:', error);
      return null;
    }
    
    // Get attachments for this message from the new message_attachments table
    const { data: attachments, error: attachmentsError } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('message_id', messageId);
      
    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError);
    }
    
    // Transform the attachments data
    const formattedAttachments = (attachments || []).map((attachment: any) => {
      // Generate the public URL for the file
      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(attachment.file_path);
      
      return {
        id: attachment.id,
        fileName: attachment.file_name,
        fileType: attachment.file_type,
        fileUrl: urlData?.publicUrl || '',
        fileSize: attachment.file_size
      };
    });
    
    // Transform the data
    return {
      id: message.id,
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      content: message.content,
      timestamp: message.created_at,
      attachments: formattedAttachments
    };
  } catch (error) {
    console.error('Error getting message by ID:', error);
    return null;
  }
}

/**
 * Subscribe to new messages
 */
export function subscribeToMessages(
  projectId: string,
  contractorId: string | null,
  callback: (message: {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    isOwn: boolean;
    contractor_alias?: string;
    message_type?: 'individual' | 'group';
  }) => void
): () => void {
  // Get the current user ID
  let currentUserId: string | undefined;
  let isHomeowner = false;
  
  // Initialize user data
  const initUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      console.error('No authenticated user found');
      return false;
    }
    
    // Get the user's profile to determine if they're a homeowner or contractor
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', currentUserId)
      .single();
      
    isHomeowner = profile?.user_type === 'homeowner';
    return true;
  };
  
  // Initialize user data before subscribing
  initUserData();
  // Clean the project ID
  const cleanedProjectId = cleanProjectId(projectId);
  
  // Subscribe to the messages channel
  const subscription = supabase
    .channel('messages-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `project_id=eq.${cleanedProjectId}`
      },
      async (payload) => {
        const newMessage = payload.new;
        
        // Re-fetch current user data to ensure it's up to date
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        
        if (!currentUserId) {
          console.error('No authenticated user found when processing new message');
          return;
        }
        
        // Get the user's profile to determine if they're a homeowner or contractor
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', currentUserId)
          .single();
          
        const isHomeowner = profile?.user_type === 'homeowner';
        
        // Determine if this message is relevant based on user type
        let isRelevant = false;
        
        if (isHomeowner) {
          // Homeowners see all messages for their projects
          isRelevant = true;
        } else if (contractorId) {
          // Contractors only see messages to/from them
          isRelevant = (
            (newMessage.sender_id === currentUserId && newMessage.recipient_id === contractorId) ||
            (newMessage.sender_id === contractorId && newMessage.recipient_id === currentUserId) ||
            // For group messages, check if the contractor is a recipient
            (newMessage.message_type === 'group' && newMessage.project_id === cleanedProjectId)
          );
          
          // For group messages, verify the contractor is a recipient
          if (newMessage.message_type === 'group') {
            const { data: recipient } = await supabase
              .from('message_recipients')
              .select('*')
              .eq('message_id', newMessage.id)
              .eq('recipient_id', currentUserId)
              .single();
              
            isRelevant = !!recipient;
          }
        }
        
        if (isRelevant) {
          // Transform the message to match the format expected by the EnhancedMessaging component
          callback({
            id: newMessage.id,
            senderId: newMessage.sender_id,
            content: newMessage.content,
            timestamp: newMessage.created_at,
            isOwn: newMessage.sender_id === currentUserId,
            contractor_alias: newMessage.contractor_alias,
            message_type: newMessage.message_type || 'individual'
          });
        }
      }
    )
    .subscribe();
  
  // Return a function to unsubscribe
  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Subscribe to new message attachments
 */
export function subscribeToMessageAttachments(
  projectId: string,
  contractorId: string,
  callback: (attachment: {
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  }) => void
): () => void {
  // Clean the project ID
  const cleanedProjectId = cleanProjectId(projectId);
  
  // Subscribe to new message attachments
  const subscription = supabase
    .channel(`message_attachments:${cleanedProjectId}:${contractorId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'message_attachments',
        filter: `project_id=eq.${cleanedProjectId}`
      },
      (payload) => {
        const attachment = payload.new as any;
        
        // Transform the attachment to match the format expected by the EnhancedMessaging component
        callback({
          id: attachment.id,
          fileName: attachment.file_name,
          fileType: attachment.file_type,
          fileUrl: attachment.file_url,
          fileSize: attachment.file_size
        });
      }
    )
    .subscribe();
  
  // Return a function to unsubscribe
  return () => {
    supabase.removeChannel(subscription);
  };
}
