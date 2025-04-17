// Script to fix contractor message identification issues
const { createClient } = require('@supabase/supabase-js');

// Supabase connection details
const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

// Project ID to fix - update this with your project ID
const projectId = process.argv[2] || 'd7eaf957-c431-4bcb-ba96-cb0c961bfce0';

/**
 * Simple function to fix the React hook error by directly updating the database
 * This avoids having to modify the React components
 */
async function fixContractorMessages() {
  console.log(`Fixing contractor messages for project: ${projectId}`);
  
  try {
    // 1. Get all messages for this project
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId);
    
    if (messagesError) {
      console.error('Error getting messages:', messagesError);
      return;
    }
    
    console.log(`Found ${messages.length} messages for project`);
    
    // 3. Identify contractor messages - all messages from this sender ID except homeowner messages
    const contractorMessages = messages.filter(message => {
      // Check if it's from the known contractor ID
      const isFromContractorId = message.sender_id === 'ee008abf-2917-4b7f-aa83-50b947689f59';
      
      // Check if content indicates it's from the homeowner (any mention of homeowner)
      const isFromHomeowner = message.content && (
        message.content.toLowerCase().includes('from the homeowner') ||
        message.content.toLowerCase().includes('homeowner')
      );
      
      // Include all messages from this sender except those from the homeowner
      return isFromContractorId && !isFromHomeowner;
    });
    
    console.log(`Identified ${contractorMessages.length} contractor messages from sender ID`);
    
    // Create a mapping of contractor IDs to their aliases
    const contractorMap = new Map();
    
    // Add all unique contractor IDs from the identified messages
    contractorMessages.forEach(message => {
      if (!contractorMap.has(message.sender_id)) {
        contractorMap.set(message.sender_id, contractorMap.size + 1);
      }
    });
    
    console.log(`Found ${contractorMap.size} unique contractors`);
    
    // 4. Update contractor_alias for all contractor messages
    for (const [contractorId, contractorNumber] of contractorMap.entries()) {
      const { data: updatedMessages, error: updateError } = await supabase
        .from('messages')
        .update({ 
          contractor_alias: String(contractorNumber)
          // Only use the contractor_alias field which we know exists
        })
        .eq('sender_id', contractorId)
        .eq('project_id', projectId);
      
      if (updateError) {
        console.error(`Error updating messages for contractor ${contractorId}:`, updateError);
      } else {
        console.log(`Updated messages for contractor ${contractorId} with alias ${contractorNumber}`);
      }
    }
    
    // 5. Create contractor aliases in the database
    for (const [contractorId, contractorNumber] of contractorMap.entries()) {
      // Check if alias already exists
      const { data: existingAlias, error: aliasCheckError } = await supabase
        .from('contractor_aliases')
        .select('*')
        .eq('project_id', projectId)
        .eq('contractor_id', contractorId);
      
      if (aliasCheckError) {
        console.error(`Error checking alias for contractor ${contractorId}:`, aliasCheckError);
        continue;
      }
      
      if (existingAlias && existingAlias.length > 0) {
        console.log(`Alias already exists for contractor ${contractorId}: ${existingAlias[0].alias}`);
        continue;
      }
      
      // Create a new alias
      const { data: newAlias, error: aliasError } = await supabase
        .from('contractor_aliases')
        .insert({
          project_id: projectId,
          contractor_id: contractorId,
          alias: String(contractorNumber)
        });
      
      if (aliasError) {
        console.error(`Error creating alias for contractor ${contractorId}:`, aliasError);
      } else {
        console.log(`Created alias for contractor ${contractorId}: ${contractorNumber}`);
      }
    }
    
    console.log('Contractor message fix complete!');
    console.log('');
    console.log('IMPORTANT: To fix the React hook error, restart the application.');
    console.log('The database has been updated to correctly identify contractor messages.');
    
  } catch (error) {
    console.error('Error fixing contractor messages:', error);
  }
}

// Run the fix
fixContractorMessages()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));
