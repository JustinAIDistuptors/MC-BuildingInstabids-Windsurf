// Direct fix for database schema issues
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure .env.local file exists with proper values.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseSchema() {
  console.log('Fixing database schema issues...');
  
  try {
    // 1. Check and update projects table structure
    console.log('Checking projects table structure...');
    
    // First, get the structure of the projects table
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsError) {
      console.error('Error querying projects table:', projectsError.message);
    } else {
      console.log('Projects table exists.');
      
      // Get a sample project to see the structure
      if (projectsData && projectsData.length > 0) {
        console.log('Sample project structure:', Object.keys(projectsData[0]));
      } else {
        console.log('Projects table is empty.');
      }
    }
    
    // 2. Direct SQL approach to fix the schema
    console.log('\nApplying direct SQL fixes...');
    
    // Create a function to execute SQL directly
    const executeSql = async (sql, description) => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: sql })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to ${description}:`, errorText);
          return { success: false, error: errorText };
        }
        
        console.log(`Successfully ${description}`);
        return { success: true };
      } catch (error) {
        console.error(`Error ${description}:`, error.message);
        return { success: false, error: error.message };
      }
    };
    
    // 3. Fix projects table - add bid_status column if it doesn't exist
    await executeSql(
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS bid_status TEXT DEFAULT 'accepting_bids';`,
      'added bid_status column to projects table'
    );
    
    // 4. Create project_media table if it doesn't exist
    await executeSql(
      `CREATE TABLE IF NOT EXISTS project_media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        media_url TEXT NOT NULL,
        media_type TEXT,
        file_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      'created project_media table'
    );
    
    // 5. Create storage bucket for project media
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const projectMediaBucket = buckets.find(b => b.name === 'project_media');
      
      if (!projectMediaBucket) {
        console.log('Creating project_media storage bucket...');
        const { data, error } = await supabase.storage.createBucket('project_media', {
          public: true
        });
        
        if (error) {
          console.error('Error creating storage bucket:', error.message);
        } else {
          console.log('Successfully created project_media storage bucket');
        }
      } else {
        console.log('project_media storage bucket already exists');
      }
    } catch (error) {
      console.error('Error checking storage buckets:', error.message);
    }
    
    console.log('\nDatabase schema fixes completed!');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Run the fix
fixDatabaseSchema();
