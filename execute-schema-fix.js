// Script to execute SQL commands in Supabase to fix the database schema
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL script
const sqlScript = fs.readFileSync('./fix-database-schema.sql', 'utf8');

// Split into individual commands
const commands = sqlScript
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0);

async function executeCommands() {
  console.log(`Executing ${commands.length} SQL commands to fix the database schema...`);
  
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`\nExecuting command ${i + 1}/${commands.length}:`);
    console.log(command);
    
    try {
      // Execute the SQL command directly using the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          query: command
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error executing command: ${errorText}`);
      } else {
        console.log('Command executed successfully!');
      }
    } catch (error) {
      console.error(`Error executing command: ${error.message}`);
    }
  }
  
  console.log('\nAll commands executed. Checking the result...');
  
  // Verify the changes by creating a test project
  try {
    const testProject = {
      title: 'Test Project After Schema Fix',
      description: 'This is a test project after fixing the schema',
      status: 'published',
      bid_status: 'accepting_bids',
      budget_min: 1000,
      budget_max: 5000,
      zip_code: '12345',
      location: 'Test Location',
      type: 'Test Type',
      job_type_id: 'test',
      job_category_id: 'test',
      group_bidding_enabled: true
    };
    
    console.log('\nAttempting to create a test project with all fields:');
    console.log(testProject);
    
    const { data, error } = await supabase
      .from('projects')
      .insert([testProject])
      .select();
    
    if (error) {
      console.error('Error creating test project:', error);
    } else {
      console.log('Test project created successfully!');
      console.log('Project data:', data);
      console.log('\nSchema fix was successful! All columns are now available.');
    }
  } catch (error) {
    console.error('Error testing the schema fix:', error);
  }
}

executeCommands();
