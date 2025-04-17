/**
 * Utility functions to help fix contractor message identification
 */
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

/**
 * Force update message display settings for a specific project
 * This will mark messages as being from contractors based on content
 */
export async function fixContractorMessageDisplay(projectId: string) {
  const supabase = createClientComponentClient<Database>();
  
  try {
    console.log('Fixing contractor message display for project:', projectId);
    
    // 1. Get all messages for this project
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId);
      
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return { success: false, error: messagesError.message };
    }
    
    if (!messages || messages.length === 0) {
      console.log('No messages found for this project');
      return { success: true, message: 'No messages to fix' };
    }
    
    console.log(`Found ${messages.length} messages for project`);
    
    // 2. Identify contractor messages based on content
    const contractorMessages = messages.filter(message => 
      message.content.toLowerCase().includes('contractor') ||
      message.content.toLowerCase().startsWith('contractor')
    );
    
    console.log(`Identified ${contractorMessages.length} contractor messages`);
    
    if (contractorMessages.length === 0) {
      return { success: true, message: 'No contractor messages identified' };
    }
    
    // 3. Create contractor aliases for these messages
    const uniqueContractorIds = new Set(contractorMessages.map(m => m.sender_id));
    console.log(`Found ${uniqueContractorIds.size} unique contractors`);
    
    let contractorCounter = 1;
    const updates = [];
    
    // 4. For each contractor, create or update an alias
    for (const contractorId of uniqueContractorIds) {
      const alias = String(contractorCounter++);
      
      // Check if alias already exists
      const { data: existingAlias } = await supabase
        .from('contractor_aliases')
        .select('*')
        .eq('project_id', projectId)
        .eq('contractor_id', contractorId)
        .single();
        
      if (existingAlias) {
        console.log(`Alias already exists for contractor ${contractorId}: ${existingAlias.alias}`);
        continue;
      }
      
      // Create a new alias
      const { data: newAlias, error: aliasError } = await supabase
        .from('contractor_aliases')
        .insert({
          project_id: projectId,
          contractor_id: contractorId,
          alias: alias
        })
        .select()
        .single();
        
      if (aliasError) {
        console.error(`Error creating alias for contractor ${contractorId}:`, aliasError);
        continue;
      }
      
      console.log(`Created alias for contractor ${contractorId}: ${alias}`);
      updates.push(newAlias);
    }
    
    return { 
      success: true, 
      message: `Fixed ${updates.length} contractor aliases`,
      updates
    };
  } catch (err) {
    console.error('Error fixing contractor message display:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Update a specific message to mark it as from a contractor
 */
export async function markMessageAsFromContractor(messageId: string) {
  const supabase = createClientComponentClient<Database>();
  
  try {
    // First get the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();
      
    if (messageError) {
      console.error('Error fetching message:', messageError);
      return { success: false, error: messageError.message };
    }
    
    if (!message) {
      return { success: false, error: 'Message not found' };
    }
    
    // Update message metadata to mark as from contractor
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({
        metadata: { 
          ...message.metadata,
          isFromContractor: true 
        }
      })
      .eq('id', messageId)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating message:', updateError);
      return { success: false, error: updateError.message };
    }
    
    return { success: true, message: updatedMessage };
  } catch (err) {
    console.error('Error marking message as from contractor:', err);
    return { success: false, error: String(err) };
  }
}
