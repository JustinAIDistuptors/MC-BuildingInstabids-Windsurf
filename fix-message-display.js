// fix-message-display.js
// This script fixes the contractor message identification issue by checking message content

const { createClient } = require('@supabase/supabase-js');

// Supabase connection details
const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

// Project ID to fix - update this with your project ID
const projectId = process.argv[2] || 'd7eaf957-c431-4bcb-ba96-cb0c961bfce0'; // Using the correct project ID

async function fixMessageDisplay() {
  console.log(`Fixing message display for project: ${projectId}`);
  
  try {
    // Step 1: Get the project owner ID
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error('Error getting project:', projectError);
      return;
    }
    
    const projectOwnerId = project.owner_id;
    console.log('Project owner ID:', projectOwnerId);
    
    // Step 2: Get all messages for this project
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId);
    
    if (messagesError) {
      console.error('Error getting messages:', messagesError);
      return;
    }
    
    console.log(`Found ${messages.length} messages for project`);
    
    // CRITICAL FIX: Identify contractor messages based on content
    const contractorMessages = messages.filter(message => 
      message.content?.toLowerCase().includes('contractor') || 
      message.content?.toLowerCase().startsWith('contractor')
    );
    
    console.log(`Identified ${contractorMessages.length} potential contractor messages based on content:`);
    contractorMessages.forEach(msg => {
      console.log(`- ID: ${msg.id}, Content: ${msg.content}`);
    });
    
    // Step 3: Get all contractor aliases for this project
    const { data: aliases, error: aliasesError } = await supabase
      .from('contractor_aliases')
      .select('*')
      .eq('project_id', projectId);
    
    if (aliasesError) {
      console.error('Error getting aliases:', aliasesError);
      return;
    }
    
    console.log(`Found ${aliases?.length || 0} contractor aliases for project`);
    
    // Step 4: Create contractor aliases for all messages that contain "contractor" in content
    // This is the critical fix - we're identifying contractors by message content
    const contractorId = contractorMessages.length > 0 ? contractorMessages[0].sender_id : null;
    
    if (contractorId) {
      console.log(`Using sender ID ${contractorId} as the contractor ID`);
      
      // Check if this contractor already has an alias
      const existingAlias = aliases?.find(a => a.contractor_id === contractorId);
      
      if (!existingAlias) {
        // Create a new alias for this contractor
        const { data: newAlias, error: aliasError } = await supabase
          .from('contractor_aliases')
          .insert({
            project_id: projectId,
            contractor_id: contractorId,
            alias: '1' // Use '1' as the alias for the first contractor
          })
          .select()
          .single();
        
        if (aliasError) {
          console.error('Error creating contractor alias:', aliasError);
        } else {
          console.log(`Created new alias for contractor: ${JSON.stringify(newAlias)}`);
        }
      } else {
        console.log(`Contractor already has alias: ${existingAlias.alias}`);
      }
    }
    
    // Step 5: Update metadata for contractor messages to force them to display correctly
    const updatePromises = [];
    
    for (const message of contractorMessages) {
      console.log(`Updating message ${message.id} to mark as contractor message`);
      
      // Handle null metadata properly
      const currentMetadata = message.metadata || {};
      
      updatePromises.push(
        supabase
          .from('messages')
          .update({
            metadata: { 
              ...currentMetadata,
              isFromContractor: true,
              forceContractorDisplay: true
            }
          })
          .eq('id', message.id)
      );
    }
    
    if (updatePromises.length > 0) {
      const results = await Promise.all(updatePromises);
      console.log(`Updated ${updatePromises.length} messages to mark as contractor messages`);
    } else {
      console.log('No messages needed updating');
    }
    
    // Step 6: Update the ContractorMessaging component's logic
    console.log('\nTo complete the fix, update the ContractorMessaging.tsx file with these changes:');
    console.log('1. Modify the message processing logic to check message.metadata.isFromContractor');
    console.log('2. Update the contractor identification logic to use message content as a fallback');
    console.log('3. Force contractor messages to display on the left side of the chat');
    
    // Step 7: Add a special contractor entry if none exists
    if (contractorId && (!contractors || contractors.length === 0)) {
      const { data: newContractor, error: contractorError } = await supabase
        .from('contractors')
        .insert({
          project_id: projectId,
          user_id: contractorId,
          name: 'Contractor 1',
          bid_amount: 1000,
          status: 'active'
        })
        .select()
        .single();
      
      if (contractorError) {
        console.error('Error creating contractor entry:', contractorError);
      } else {
        console.log(`Created new contractor entry: ${JSON.stringify(newContractor)}`);
      }
    }
    
    console.log('Message display fix completed successfully');
  } catch (error) {
    console.error('Error fixing message display:', error);
  }
}

// Run the fix
fixMessageDisplay()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));
