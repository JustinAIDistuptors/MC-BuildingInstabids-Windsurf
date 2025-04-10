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
  
  // Check if the project ID is a numeric string that might be mistaken for a UUID
  // This handles the case where we get errors like "invalid input syntax for type uuid"
  if (/^\d+$/.test(projectId)) {
    console.log('Converting numeric project ID to string format');
    return projectId;
  }
  
  return projectId;
}

// Helper function to determine if a table exists
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
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

// Helper function to get the correct table name
async function getCorrectTableName(supabase: any, tableName: string): Promise<string> {
  try {
    // Check if the table exists with the messaging schema
    const messagingTableExists = await tableExists(supabase, `messaging.${tableName}`);
    
    if (messagingTableExists) {
      return `messaging.${tableName}`;
    }
    
    // If not, try without the schema prefix
    const publicTableExists = await tableExists(supabase, tableName);
    
    if (publicTableExists) {
      return tableName;
    }
    
    console.error(`Table ${tableName} does not exist`);
    throw new Error(`Table ${tableName} does not exist`);
  } catch (error) {
    console.error(`Error getting correct table name for ${tableName}:`, error);
    throw error;
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
    
    // Check if the messaging.messages table exists
    const messagesTableExists = await tableExists(supabase, 'messaging.messages');
    
    if (!messagesTableExists) {
      console.error('messaging.messages table does not exist');
      return [];
    }
    
    // Try with messaging schema
    const { data, error } = await supabase
      .from('messaging.messages')
      .select('*')
      .eq('project_id', cleanedProjectId)
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${contractorId}),and(sender_id.eq.${contractorId},recipient_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching messages:', error);
      
      // Try without schema prefix as fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', cleanedProjectId)
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${contractorId}),and(sender_id.eq.${contractorId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
        
      if (fallbackError) {
        console.error('Error fetching messages (fallback):', fallbackError);
        return [];
      }
      
      // Transform the fallback data
      return (fallbackData || []).map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        content: msg.content,
        timestamp: msg.created_at,
        isOwn: msg.sender_id === currentUserId
      }));
    }
    
    // Transform the data to match the format expected by the EnhancedMessaging component
    return (data || []).map(msg => ({
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
    
    // First, check if the project exists
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', cleanedProjectId)
      .single();
      
    if (projectError) {
      console.error('Error finding project:', projectError);
      console.log('Project may not exist or ID format is incorrect');
    }
    
    // Query the bids table with improved error handling
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
        
        // Return mock data for debugging
        console.log('Returning mock contractor data for debugging');
        return [{
          id: 'mock-contractor-1',
          name: 'Mock Contractor',
          company: 'Mock Company',
          bidAmount: 1000,
          status: 'pending',
          avatar: undefined
        }];
      }
      
      // If we got basic data but no profiles, fetch profiles separately
      const contractorIds = basicData.map(bid => bid.contractor_id);
      
      if (contractorIds.length === 0) {
        console.log('No contractors found for this project');
        return [];
      }
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, avatar_url')
        .in('id', contractorIds);
        
      if (profilesError) {
        console.error('Error fetching contractor profiles:', profilesError);
        
        // Map the basic data without profiles
        return basicData.map(bid => ({
          id: bid.contractor_id,
          name: `Contractor ${bid.contractor_id.substring(0, 8)}`,
          bidAmount: bid.amount,
          status: bid.status || 'pending',
          avatar: undefined
        }));
      }
      
      // Map the basic data with profiles
      return basicData.map(bid => {
        const profile = profilesData.find(p => p.id === bid.contractor_id);
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
    
    console.log('Contractor data:', data);
    
    // Transform the data to match the format expected by the EnhancedMessaging component
    return (data || []).map(bid => {
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
    
    // Return mock data for debugging
    return [{
      id: 'mock-contractor-1',
      name: 'Mock Contractor',
      company: 'Mock Company',
      bidAmount: 1000,
      status: 'pending',
      avatar: undefined
    }];
  }
}

/**
 * Send a message to a contractor
 */
export async function sendMessage(
  projectId: string,
  contractorId: string,
  content: string,
  files: File[] = []
): Promise<{
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}> {
  const supabase = createClient();
  
  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      throw new Error('No authenticated user found');
    }
    
    // Clean the project ID
    const cleanedProjectId = cleanProjectId(projectId);
    console.log('Using project ID for sending message:', cleanedProjectId);
    
    // Check if the messaging.messages table exists
    const messagesTableExists = await tableExists(supabase, 'messaging.messages');
    
    if (!messagesTableExists) {
      console.error('messaging.messages table does not exist');
      throw new Error('messaging.messages table does not exist');
    }
    
    // Try with messaging schema
    const { data: messageData, error } = await supabase
      .from('messaging.messages')
      .insert({
        project_id: cleanedProjectId,
        sender_id: currentUserId,
        recipient_id: contractorId,
        content
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error sending message:', error);
      
      // Try without schema prefix as fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('messages')
        .insert({
          project_id: cleanedProjectId,
          sender_id: currentUserId,
          recipient_id: contractorId,
          content
        })
        .select()
        .single();
        
      if (fallbackError) {
        console.error('Error sending message (fallback):', fallbackError);
        throw fallbackError;
      }
      
      return {
        id: fallbackData.id,
        senderId: fallbackData.sender_id,
        content: fallbackData.content,
        timestamp: fallbackData.created_at,
        isOwn: true
      };
    }
    
    // If there are files, upload them and create attachments
    if (files.length > 0 && messageData) {
      await Promise.all(
        files.map(async (file) => {
          // Upload the file to storage
          const fileExt = file.name.split('.').pop() || '';
          const fileName = `${messageData.id}-${Date.now()}.${fileExt}`;
          const filePath = `messages/${cleanedProjectId}/${fileName}`;
          
          const { error: uploadError } = await supabase
            .storage
            .from('message-attachments')
            .upload(filePath, file);
            
          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw uploadError;
          }
          
          // Get the public URL
          const { data: publicUrlData } = supabase
            .storage
            .from('message-attachments')
            .getPublicUrl(filePath);
          
          const publicUrl = publicUrlData?.publicUrl || '';
          
          // Create the attachment record
          const { error: attachmentError } = await supabase
            .from('messaging.attachments')
            .insert({
              message_id: messageData.id,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
              file_url: publicUrl
            });
            
          if (attachmentError) {
            console.error('Error creating attachment:', attachmentError);
            throw attachmentError;
          }
        })
      );
    }
    
    // Return the message in the format expected by the EnhancedMessaging component
    return {
      id: messageData.id,
      senderId: messageData.sender_id,
      content: messageData.content,
      timestamp: messageData.created_at,
      isOwn: true
    };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    // Return a default message in case of error
    return {
      id: 'error',
      senderId: '',
      content: 'Error sending message',
      timestamp: new Date().toISOString(),
      isOwn: true
    };
  }
}

/**
 * Get the homeowner for a bid card
 */
export async function getHomeownerForBidCard(projectId: string): Promise<User | null> {
  const supabase = createClient();
  
  try {
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
    
    if (!projectError && projectData?.homeowner_id) {
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
      console.log('Found creator_id in bidding.bid_cards table:', homeownerId);
    }
    
    // Fetch the homeowner profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', homeownerId)
      .single();
      
    if (profileError) {
      console.error('Error fetching homeowner profile:', profileError);
      throw profileError;
    }
    
    return {
      id: profileData.id,
      name: profileData.full_name || 'Unknown Homeowner',
      avatar_url: profileData.avatar_url,
      role: 'homeowner'
    };
  } catch (error) {
    console.error('Error in getHomeownerForBidCard:', error);
    return null;
  }
}

/**
 * Subscribe to new messages
 */
export function subscribeToMessages(
  projectId: string, 
  userId: string,
  callback: (message: Message) => void
): () => void {
  const supabase = createClient();
  const cleanedProjectId = cleanProjectId(projectId);
  
  // Try with both field names (project_id and bid_card_id)
  const channel = supabase
    .channel(`messages-${cleanedProjectId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'messaging',
      table: 'messages',
      filter: `project_id=eq.${cleanedProjectId}`,
    }, (payload) => {
      callback(payload.new as Message);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'messaging',
      table: 'messages',
      filter: `bid_card_id=eq.${cleanedProjectId}`,
    }, (payload) => {
      callback(payload.new as Message);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `project_id=eq.${cleanedProjectId}`,
    }, (payload) => {
      callback(payload.new as Message);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `bid_card_id=eq.${cleanedProjectId}`,
    }, (payload) => {
      callback(payload.new as Message);
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get a message by ID (with attachments)
 */
export async function getMessageById(messageId: string): Promise<Message | null> {
  const supabase = createClient();
  
  try {
    // Determine the correct table names
    const messagesTable = await getCorrectTableName(supabase, 'messages');
    const attachmentsTable = await getCorrectTableName(supabase, 'attachments');
    
    // Get the message
    const { data: message, error } = await supabase
      .from(messagesTable)
      .select('*')
      .eq('id', messageId)
      .single();
      
    if (error) {
      console.error('Error fetching message:', error);
      throw error;
    }
    
    // Get attachments for this message
    const { data: attachments, error: attachmentsError } = await supabase
      .from(attachmentsTable)
      .select('*')
      .eq('message_id', messageId);
      
    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError);
    }
    
    return {
      ...message,
      attachments: attachments || []
    };
  } catch (error) {
    console.error('Error in getMessageById:', error);
    return null;
  }
}

/**
 * Get attachments for a message
 */
export async function getAttachmentsForMessage(messageId: string): Promise<Attachment[]> {
  const supabase = createClient();
  
  try {
    // Check if the messaging.attachments table exists
    const attachmentsTableExists = await tableExists(supabase, 'messaging.attachments');
    
    if (!attachmentsTableExists) {
      console.error('messaging.attachments table does not exist');
      return [];
    }
    
    // Try with messaging schema
    const { data, error } = await supabase
      .from('messaging.attachments')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching attachments:', error);
      
      // Try without schema prefix as fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('attachments')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });
        
      if (fallbackError) {
        console.error('Error fetching attachments (fallback):', fallbackError);
        return [];
      }
      
      return fallbackData || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAttachmentsForMessage:', error);
    return [];
  }
}
