// fix-contractor-messaging.js
// This script fixes the contractor messaging system by ensuring:
// 1. All contractors who have sent messages have proper aliases
// 2. All messages from contractors have the contractor_alias field set
// 3. The homeowner can see and respond to contractor messages

const { createClient } = require('@supabase/supabase-js');

// Supabase connection details
const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

// Project ID to fix - update this with your project ID
const projectId = process.argv[2];

if (!projectId) {
  console.error('Please provide a project ID as the first argument');
  process.exit(1);
}

async function fixContractorMessaging() {
  console.log(`Fixing contractor messaging for project: ${projectId}`);
  
  try {
    // Step 1: Get all messages for this project
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId);
    
    if (messagesError) {
      console.error('Error getting messages:', messagesError);
      return;
    }
    
    console.log(`Found ${messages.length} messages for project`);
    
    // Step 2: Get all unique sender IDs from messages
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    console.log('Unique sender IDs:', senderIds);
    
    // Step 3: Get existing contractor aliases
    const { data: existingAliases, error: aliasesError } = await supabase
      .from('contractor_aliases')
      .select('*')
      .eq('project_id', projectId);
    
    if (aliasesError) {
      console.error('Error getting existing aliases:', aliasesError);
      return;
    }
    
    console.log(`Found ${existingAliases?.length || 0} existing contractor aliases`);
    
    // Create a map of existing aliases by contractor ID
    const aliasMap = new Map();
    if (existingAliases && existingAliases.length > 0) {
      existingAliases.forEach(alias => {
        aliasMap.set(alias.contractor_id, alias.alias);
      });
    }
    
    // Step 4: Assign aliases to contractors who don't have them
    const contractorsNeedingAliases = senderIds.filter(id => !aliasMap.has(id));
    console.log('Contractors needing aliases:', contractorsNeedingAliases);
    
    if (contractorsNeedingAliases.length > 0) {
      // Find the highest existing alias letter
      let highestAlias = 64; // ASCII before 'A'
      aliasMap.forEach(alias => {
        const aliasCode = alias.charCodeAt(0);
        if (aliasCode > highestAlias) {
          highestAlias = aliasCode;
        }
      });
      
      // Create new aliases for contractors that don't have them
      const newAliases = contractorsNeedingAliases.map((contractorId, index) => {
        const alias = String.fromCharCode(highestAlias + 1 + index);
        aliasMap.set(contractorId, alias); // Update the map for later use
        return {
          project_id: projectId,
          contractor_id: contractorId,
          alias
        };
      });
      
      console.log('New aliases to insert:', newAliases);
      
      if (newAliases.length > 0) {
        const { error: insertError } = await supabase
          .from('contractor_aliases')
          .insert(newAliases);
        
        if (insertError) {
          console.error('Error inserting aliases:', insertError);
        } else {
          console.log(`Successfully inserted ${newAliases.length} new aliases`);
        }
      }
    }
    
    // Step 5: Update contractor_alias field in messages
    const messagesToUpdate = messages.filter(message => {
      // Skip messages that already have the correct alias
      if (message.contractor_alias === aliasMap.get(message.sender_id)) {
        return false;
      }
      
      // Only update messages from contractors who have an alias
      return aliasMap.has(message.sender_id);
    });
    
    console.log(`Found ${messagesToUpdate.length} messages that need contractor_alias updated`);
    
    // Update messages in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < messagesToUpdate.length; i += batchSize) {
      const batch = messagesToUpdate.slice(i, i + batchSize);
      const updatePromises = batch.map(message => {
        const alias = aliasMap.get(message.sender_id);
        console.log(`Updating message ${message.id} with alias ${alias}`);
        
        return supabase
          .from('messages')
          .update({ contractor_alias: alias })
          .eq('id', message.id);
      });
      
      await Promise.all(updatePromises);
      console.log(`Updated batch ${i / batchSize + 1} of ${Math.ceil(messagesToUpdate.length / batchSize)}`);
    }
    
    console.log('Contractor messaging fix completed successfully');
  } catch (error) {
    console.error('Error fixing contractor messaging:', error);
  }
}

// Run the fix
fixContractorMessaging()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));
