// Script to check the projects table schema and fix contractor messaging issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectsSchema() {
  console.log('Checking projects table schema...');
  
  try {
    // First, check if the table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing projects table:', tableError);
      console.log('Checking if table exists in a different schema...');
      
      // Try to query information_schema to find the table
      const { data: schemas, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name')
        .eq('table_name', 'projects');
      
      if (schemaError) {
        console.error('Error querying information_schema:', schemaError);
      } else {
        console.log('Projects table found in schemas:', schemas);
      }
      
      return;
    }
    
    // Get a sample project to analyze its structure
    if (tableExists && tableExists.length > 0) {
      console.log('Projects table exists. Sample project structure:');
      console.log(JSON.stringify(tableExists[0], null, 2));
      
      // Check for owner-related fields
      const ownerFields = Object.keys(tableExists[0]).filter(key => 
        key.includes('owner') || key.includes('user')
      );
      
      console.log('Owner-related fields:', ownerFields);
      
      // Check messages table to understand the relationship
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .limit(5);
      
      if (messagesError) {
        console.error('Error accessing messages table:', messagesError);
      } else if (messages && messages.length > 0) {
        console.log('Messages table exists. Sample message structure:');
        console.log(JSON.stringify(messages[0], null, 2));
        
        // Check if there's a project_id in messages
        if (messages[0].project_id) {
          console.log('Messages have project_id field. Checking relationship...');
          
          // Get the project for this message
          const { data: relatedProject, error: relatedError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', messages[0].project_id)
            .single();
          
          if (relatedError) {
            console.error('Error getting related project:', relatedError);
          } else if (relatedProject) {
            console.log('Related project found:');
            console.log(JSON.stringify(relatedProject, null, 2));
          }
        }
      }
    } else {
      console.log('Projects table exists but is empty.');
    }
  } catch (err) {
    console.error('Error checking projects schema:', err);
  }
}

// Run the check
checkProjectsSchema()
  .then(() => console.log('Schema check complete'))
  .catch(err => console.error('Error running schema check:', err));
