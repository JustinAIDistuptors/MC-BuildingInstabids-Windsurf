// Fix for project owner lookup
// This script will check the projects table structure and provide the correct column name

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || ''; // You'll need to provide your key when running

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectsTable() {
  console.log('Checking projects table structure...');
  
  try {
    // First, try to get the column names from the projects table
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying projects table:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No projects found. Creating a test query to see column names...');
      
      // Try to get the column information using a raw query
      const { data: columnInfo, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: 'projects' });
      
      if (columnError) {
        console.error('Error getting column information:', columnError);
        return;
      }
      
      console.log('Projects table columns:', columnInfo);
      
      // Look for owner-related columns
      const ownerColumns = columnInfo.filter(col => 
        col.column_name.includes('owner') || 
        col.column_name.includes('user')
      );
      
      console.log('Potential owner columns:', ownerColumns);
    } else {
      // We got a project, show its structure
      console.log('Project structure:', Object.keys(data[0]));
      
      // Look for owner-related fields
      const ownerFields = Object.keys(data[0]).filter(key => 
        key.includes('owner') || 
        key.includes('user')
      );
      
      console.log('Potential owner fields:', ownerFields);
      
      // Test each field to see if it contains a user ID
      for (const field of ownerFields) {
        const value = data[0][field];
        console.log(`Field ${field} value:`, value);
        
        if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
          console.log(`Field ${field} appears to contain a UUID, likely the owner ID`);
        }
      }
    }
  } catch (err) {
    console.error('Error checking projects table:', err);
  }
}

// Run the check
checkProjectsTable();
