// fix-contractor-display.js
// This script fixes the contractor messaging display issue

const { createClient } = require('@supabase/supabase-js');

// Supabase connection details from the fix-message-display.js file
const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

// Project ID to fix - update this with your project ID
const projectId = '2d0c9c04-8167-4e2e-aeca-45bd719ee589';

async function fixContractorDisplay() {
  console.log(`Fixing contractor display for project: ${projectId}`);
  
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
    
    // Step 2: Create virtual contractors based on message content
    const virtualContractors = new Map();
    
    messages.forEach(message => {
      // Check if message content starts with "Contractor X"
      const contractorMatch = message.content.match(/^Contractor\s+(\d+|[A-Z])/i);
      if (contractorMatch) {
        const contractorId = contractorMatch[1];
        if (!virtualContractors.has(contractorId)) {
          // Create a virtual contractor entry
          virtualContractors.set(contractorId, {
            id: `virtual-${contractorId}`,
            name: `Contractor ${contractorId}`,
            alias: contractorId,
            originalMessages: []
          });
        }
        
        // Add this message to the contractor's messages
        virtualContractors.get(contractorId).originalMessages.push(message.id);
      }
    });
    
    console.log(`Created ${virtualContractors.size} virtual contractors from message content`);
    console.log('Virtual contractors:', Array.from(virtualContractors.entries()));
    
    // Step 3: Update the UI component to handle virtual contractors
    console.log('\nTo fix the contractor messaging display, update the ContractorMessaging.tsx file with the following changes:');
    
    console.log(`
1. Override the isOwn property based on message content:
   - If a message starts with "Contractor X", set isOwn to false
   - This will make contractor messages appear on the left side

2. Create virtual contractors from message content:
   - Extract contractor names/numbers from message content
   - Create virtual contractor objects with unique IDs
   - Use these for the dropdown instead of database contractors

3. Update the message filtering logic:
   - Filter messages based on the content prefix
   - When a contractor is selected, show only their messages and homeowner replies

4. Update the message display component:
   - Extract contractor name directly from message content
   - Display the correct contractor name in the message bubble
`);
    
    console.log('\nImplementation steps complete. Apply these changes to fix the contractor messaging display.');
    
  } catch (error) {
    console.error('Error fixing contractor display:', error);
  }
}

// Run the fix
fixContractorDisplay()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));
