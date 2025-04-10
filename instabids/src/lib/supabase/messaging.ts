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
  bid_card_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at?: string;
  attachments?: Attachment[];
}

/**
 * Get messages between a homeowner and a contractor for a specific bid card
 */
export async function getMessages(
  bidCardId: string,
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
    
    // Fetch messages between the current user and the contractor
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', bidCardId)
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${contractorId}),and(sender_id.eq.${contractorId},recipient_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
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
 * Send a message to a contractor
 */
export async function sendMessage(
  bidCardId: string,
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
    
    // First, insert the message
    const { data: messageData, error } = await supabase
      .from('messages')
      .insert({
        project_id: bidCardId,
        sender_id: currentUserId,
        recipient_id: contractorId,
        content
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
    
    // If there are files, upload them and create attachments
    if (files.length > 0) {
      await Promise.all(
        files.map(async (file) => {
          // Upload the file to storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${messageData.id}-${Date.now()}.${fileExt}`;
          const filePath = `messages/${bidCardId}/${fileName}`;
          
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
            .from('attachments')
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
    
    // Fetch contractors who have bid on this project
    // Using the correct table name without schema prefix to fix the relationship error
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
      .eq('project_id', projectId);
      
    if (error) {
      console.error('Error fetching contractors:', error);
      throw error;
    }
    
    // Transform the data to match the format expected by the EnhancedMessaging component
    return (data || []).map(bid => {
      // Ensure contractor is properly typed as an object with the expected properties
      const profile = bid.profiles as {
        id?: string;
        full_name?: string;
        company_name?: string;
        avatar_url?: string;
      } || {};
      
      // Ensure proper type conversion for bidAmount
      const bidAmount = typeof bid.amount === 'number' ? bid.amount : undefined;
      
      return {
        id: bid.contractor_id || 'unknown',
        name: profile.full_name || 'Unknown Contractor',
        company: profile.company_name,
        bidAmount,
        status: (bid.status as 'pending' | 'accepted' | 'rejected') || 'pending',
        avatar: profile.avatar_url
      };
    });
  } catch (error) {
    console.error('Error in getContractorsForProject:', error);
    return [];
  }
}

/**
 * Get the homeowner for a bid card
 */
export async function getHomeownerForBidCard(bidCardId: string): Promise<User | null> {
  const supabase = createClient();
  
  try {
    // Fetch the bid card to get the creator_id
    const { data: bidCard, error: bidCardError } = await supabase
      .from('bidding.bid_cards')
      .select('creator_id')
      .eq('id', bidCardId)
      .single();
      
    if (bidCardError) {
      console.error('Error fetching bid card:', bidCardError);
      throw bidCardError;
    }
    
    if (!bidCard) {
      console.error('Bid card not found');
      return null;
    }
    
    // Fetch the homeowner profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', bidCard.creator_id)
      .single();
      
    if (profileError) {
      console.error('Error fetching homeowner profile:', profileError);
      throw profileError;
    }
    
    if (!profile) {
      console.error('Homeowner profile not found');
      return null;
    }
    
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
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
  bidCardId: string, 
  userId: string,
  callback: (message: Message) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`messaging:${bidCardId}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'messaging',
        table: 'messages',
        filter: `bid_card_id=eq.${bidCardId}`,
      },
      (payload) => {
        const message = payload.new as Message;
        
        // Only trigger callback if the message is relevant to this user
        if (message.sender_id === userId || message.recipient_id === userId) {
          callback(message);
        }
      }
    )
    .subscribe();
  
  // Return unsubscribe function
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
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      console.error('No authenticated user found');
      return null;
    }
    
    // Fetch the message
    const { data: message, error: messageError } = await supabase
      .from('messaging.messages')
      .select('*')
      .eq('id', messageId)
      .single();
      
    if (messageError) {
      console.error('Error fetching message:', messageError);
      throw messageError;
    }
    
    if (!message) {
      console.error('Message not found');
      return null;
    }
    
    // Check if the user has permission to view this message
    if (message.sender_id !== currentUserId && message.recipient_id !== currentUserId) {
      console.error('User does not have permission to view this message');
      return null;
    }
    
    // Fetch attachments for the message
    const { data: attachments, error: attachmentsError } = await supabase
      .from('attachments')
      .select('*')
      .eq('message_id', messageId);
      
    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError);
      throw attachmentsError;
    }
    
    // Return the message with attachments
    return {
      ...message,
      attachments: attachments || []
    };
  } catch (error) {
    console.error('Error in getMessageById:', error);
    return null;
  }
}
