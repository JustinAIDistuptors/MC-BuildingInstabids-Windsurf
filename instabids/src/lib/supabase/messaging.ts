// Messaging implementation
// This file contains the actual implementation of messaging functionality

import { createClient } from '@/lib/supabase/client';

// Types
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role: 'homeowner' | 'contractor' | 'admin';
}

export interface Contractor extends User {
  company_name?: string;
  bid_amount?: number;
  bid_status?: 'pending' | 'accepted' | 'rejected';
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
  recipient_id: string;
  content: string;
  created_at: string;
  read_at?: string;
  attachments?: Attachment[];
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
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
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
  const supabase = createClient();
  
  try {
    // Check if the messages table exists
    const messagesTableExists = await tableExists(supabase, 'messages');
    
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
 */
export async function getMessages(
  projectId: string,
  contractorId: string
): Promise<Array<{
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}>> {
  const supabase = createClient();
  
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
    console.log('Using project ID for messages query:', cleanedProjectId);
    
    // Initialize messaging schema if needed
    const schemaInitialized = await initializeMessagingSchema();
    
    if (!schemaInitialized) {
      console.error('Failed to initialize messaging schema');
      return [];
    }
    
    // Query messages with proper handling of project ID
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', cleanedProjectId)
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .or(`sender_id.eq.${contractorId},recipient_id.eq.${contractorId}`)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    // Transform the data to match the format expected by the EnhancedMessaging component
    return (data || []).map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      content: msg.content,
      timestamp: msg.created_at,
      isOwn: msg.sender_id === currentUserId
    }));
  } catch (error) {
    console.error('Error in getMessages:', error);
    return [];
  }
}

/**
 * Get all contractors for a project
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
}>> {
  const supabase = createClient();
  
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
      
      // Try a more basic query as fallback
      const { data: basicData, error: basicError } = await supabase
        .from('bids')
        .select('id, contractor_id, amount, status')
        .eq('project_id', cleanedProjectId);
        
      if (basicError) {
        console.error('Error with basic contractor query:', basicError);
        return [];
      }
      
      // If we got basic data but no profiles, fetch profiles separately
      const contractorIds = basicData.map((bid: any) => bid.contractor_id);
      
      if (contractorIds.length === 0) {
        console.log('No contractors found for this project');
        return [];
      }
      
      // Fetch profiles for the contractors
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, avatar_url')
        .in('id', contractorIds);
        
      if (profilesError) {
        console.error('Error fetching contractor profiles:', profilesError);
        
        // Map the basic data without profiles
        return basicData.map((bid: any) => ({
          id: bid.contractor_id,
          name: `Contractor ${bid.contractor_id.substring(0, 8)}`,
          bidAmount: bid.amount,
          status: bid.status || 'pending',
          avatar: undefined
        }));
      }
      
      // Map the basic data with profiles
      return basicData.map((bid: any) => {
        const profile = profilesData.find((p: any) => p.id === bid.contractor_id);
        return {
          id: bid.contractor_id,
          name: profile?.full_name || `Contractor ${bid.contractor_id.substring(0, 8)}`,
          company: profile?.company_name,
          bidAmount: bid.amount,
          status: bid.status || 'pending',
          avatar: profile?.avatar_url
        };
      });
    }
    
    // Transform the data to match the format expected by the EnhancedMessaging component
    return (data || []).map((bid: any) => {
      // Properly handle the profiles object which might be null or undefined
      const profiles = bid.profiles as { 
        id?: string; 
        full_name?: string; 
        company_name?: string; 
        avatar_url?: string;
      } | null;
      
      return {
        id: bid.contractor_id,
        name: profiles?.full_name || `Contractor ${bid.contractor_id.substring(0, 8)}`,
        company: profiles?.company_name,
        bidAmount: bid.amount,
        status: bid.status || 'pending',
        avatar: profiles?.avatar_url
      };
    });
  } catch (error) {
    console.error('Error in getContractorsForProject:', error);
    return [];
  }
}

/**
 * Send a message to a contractor
 */
export async function sendMessage(
  projectId: string,
  contractorId: string,
  content: string,
  files?: File[]
): Promise<boolean> {
  const supabase = createClient();
  
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
    console.log('Using project ID for sending message:', cleanedProjectId);
    
    // Initialize messaging schema if needed
    const schemaInitialized = await initializeMessagingSchema();
    
    if (!schemaInitialized) {
      console.error('Failed to initialize messaging schema');
      return false;
    }
    
    // Insert the message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        project_id: cleanedProjectId,
        sender_id: currentUserId,
        recipient_id: contractorId,
        content
      })
      .select();
    
    if (messageError) {
      console.error('Error sending message:', messageError);
      return false;
    }
    
    // Handle file uploads if provided
    if (files && files.length > 0 && messageData && messageData.length > 0) {
      const messageId = messageData[0].id;
      
      for (const file of files) {
        // Upload the file to storage
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `messages/${messageId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }
        
        // Get the public URL for the file
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);
          
        const fileUrl = urlData?.publicUrl;
        
        if (!fileUrl) {
          console.error('Failed to get public URL for file');
          continue;
        }
        
        // Insert attachment record
        const { error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            message_id: messageId,
            file_name: fileName,
            file_size: file.size,
            file_type: file.type,
            file_url: fileUrl
          });
        
        if (attachmentError) {
          console.error('Error inserting attachment record:', attachmentError);
        }
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
  const supabase = createClient();
  
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
 * Subscribe to new messages
 */
export function subscribeToMessages(
  projectId: string,
  contractorId: string,
  callback: (message: {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    isOwn: boolean;
  }) => void
): () => void {
  const supabase = createClient();
  
  // Clean the project ID
  const cleanedProjectId = cleanProjectId(projectId);
  
  // Subscribe to new messages
  const subscription = supabase
    .channel(`messages:${cleanedProjectId}:${contractorId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `project_id=eq.${cleanedProjectId}`
      },
      (payload) => {
        const message = payload.new as any;
        
        // Get the current user ID
        supabase.auth.getSession().then(({ data: { session } }) => {
          const currentUserId = session?.user?.id;
          
          // Check if the message is relevant to this conversation
          if (
            (message.sender_id === currentUserId && message.recipient_id === contractorId) ||
            (message.sender_id === contractorId && message.recipient_id === currentUserId)
          ) {
            // Transform the message to match the format expected by the EnhancedMessaging component
            callback({
              id: message.id,
              senderId: message.sender_id,
              content: message.content,
              timestamp: message.created_at,
              isOwn: message.sender_id === currentUserId
            });
          }
        });
      }
    )
    .subscribe();
  
  // Return a function to unsubscribe
  return () => {
    supabase.removeChannel(subscription);
  };
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
  const supabase = createClient();
  
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
    
    // Get attachments for this message
    const { data: attachments, error: attachmentsError } = await supabase
      .from('attachments')
      .select('*')
      .eq('message_id', messageId);
      
    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError);
    }
    
    // Transform the data
    return {
      id: message.id,
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      content: message.content,
      timestamp: message.created_at,
      attachments: (attachments || []).map((attachment: any) => ({
        id: attachment.id,
        fileName: attachment.file_name,
        fileType: attachment.file_type,
        fileUrl: attachment.file_url,
        fileSize: attachment.file_size
      }))
    };
  } catch (error) {
    console.error('Error in getMessageById:', error);
    return null;
  }
}
