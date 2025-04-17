// Script to insert test contractor messages
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data - replace projectId with your actual project ID
const projectId = 'd7eaf957-c431-4bcb-ba96-cb0c961bfce0';

// Create fake contractor IDs (these should be different from your user ID)
const fakeContractors = [
  {
    id: '11111111-1111-1111-1111-111111111111', // Fake UUID for Contractor 1
    name: 'Contractor 1'
  },
  {
    id: '22222222-2222-2222-2222-222222222222', // Fake UUID for Contractor 2
    name: 'Contractor 2'
  }
];

async function insertTestMessages() {
  try {
    console.log('Inserting test contractor messages...');
    
    // Insert messages from each fake contractor
    for (const contractor of fakeContractors) {
      // Insert a message from this contractor
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          project_id: projectId,
          sender_id: contractor.id, // This is the key - using a different sender_id
          content: `Hello from ${contractor.name}! This is a test message.`,
          message_type: 'individual',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (messageError) {
        console.error(`Error inserting message for ${contractor.name}:`, messageError);
        continue;
      }
      
      console.log(`Inserted message for ${contractor.name}:`, message);
      
      // Create an alias for this contractor
      const { data: alias, error: aliasError } = await supabase
        .from('contractor_aliases')
        .insert({
          project_id: projectId,
          contractor_id: contractor.id,
          alias: contractor.name.split(' ')[1] // Just use the number part
        })
        .select()
        .single();
      
      if (aliasError) {
        console.error(`Error creating alias for ${contractor.name}:`, aliasError);
      } else {
        console.log(`Created alias for ${contractor.name}:`, alias);
      }
    }
    
    console.log('Test data insertion complete!');
  } catch (err) {
    console.error('Error inserting test data:', err);
  }
}

// Run the insertion
insertTestMessages()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err));
