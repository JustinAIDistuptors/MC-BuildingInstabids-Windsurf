// Script to check Supabase schema and fix issues
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure .env.local file exists with proper values.');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixSchema() {
  console.log('Checking Supabase schema and fixing issues...');
  
  try {
    // 1. Check if projects table exists and get its structure
    console.log('\n1. Checking projects table structure...');
    
    // First, try to query the projects table to see if it exists
    const { data: projectsTest, error: projectsTestError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsTestError) {
      console.error('Error accessing projects table:', projectsTestError);
      
      // If table doesn't exist, create it
      if (projectsTestError.code === 'PGRST204') {
        console.log('Projects table does not exist. Creating it...');
        
        // Create projects table with all necessary columns
        const { error: createTableError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS projects (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              title TEXT NOT NULL,
              description TEXT,
              status TEXT DEFAULT 'draft',
              budget_min INTEGER,
              budget_max INTEGER,
              zip_code TEXT,
              location TEXT,
              type TEXT,
              job_type_id TEXT,
              job_category_id TEXT,
              group_bidding_enabled BOOLEAN DEFAULT false,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });
        
        if (createTableError) {
          console.error('Error creating projects table:', createTableError);
        } else {
          console.log('Projects table created successfully!');
        }
      }
    } else {
      console.log('Projects table exists. Checking columns...');
      
      // Get table structure
      const { data: columns, error: columnsError } = await supabase.rpc('describe_table', {
        table_name: 'projects'
      });
      
      if (columnsError) {
        console.error('Error getting table structure:', columnsError);
        
        // Try to create the describe_table function if it doesn't exist
        console.log('Creating describe_table function...');
        const { error: createFunctionError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE OR REPLACE FUNCTION describe_table(table_name text)
            RETURNS TABLE(column_name text, data_type text, is_nullable text)
            LANGUAGE plpgsql
            AS $$
            BEGIN
              RETURN QUERY EXECUTE format('
                SELECT column_name::text, data_type::text, is_nullable::text
                FROM information_schema.columns
                WHERE table_name = %L
                ORDER BY ordinal_position
              ', table_name);
            END;
            $$;
          `
        });
        
        if (createFunctionError) {
          console.error('Error creating describe_table function:', createFunctionError);
        } else {
          console.log('describe_table function created. Please run this script again.');
          return;
        }
      } else {
        console.log('Table structure:', columns);
        
        // Check if bid_status column exists
        const hasBidStatus = columns.some(col => col.column_name === 'bid_status');
        
        if (!hasBidStatus) {
          console.log('bid_status column does not exist. Adding it...');
          
          // Add bid_status column
          const { error: addColumnError } = await supabase.rpc('execute_sql', {
            sql: `
              ALTER TABLE projects
              ADD COLUMN IF NOT EXISTS bid_status TEXT DEFAULT 'accepting_bids';
            `
          });
          
          if (addColumnError) {
            console.error('Error adding bid_status column:', addColumnError);
          } else {
            console.log('bid_status column added successfully!');
          }
        } else {
          console.log('bid_status column already exists.');
        }
      }
    }
    
    // 2. Check if project_media table exists
    console.log('\n2. Checking project_media table...');
    
    const { data: mediaTest, error: mediaTestError } = await supabase
      .from('project_media')
      .select('*')
      .limit(1);
    
    if (mediaTestError) {
      console.error('Error accessing project_media table:', mediaTestError);
      
      // If table doesn't exist, create it
      if (mediaTestError.code === 'PGRST204') {
        console.log('project_media table does not exist. Creating it...');
        
        // Create project_media table
        const { error: createMediaTableError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS project_media (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              project_id UUID NOT NULL,
              media_url TEXT NOT NULL,
              media_type TEXT,
              file_name TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
          `
        });
        
        if (createMediaTableError) {
          console.error('Error creating project_media table:', createMediaTableError);
        } else {
          console.log('project_media table created successfully!');
        }
      }
    } else {
      console.log('project_media table exists.');
    }
    
    // 3. Check if storage bucket exists
    console.log('\n3. Checking storage buckets...');
    
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
    } else {
      console.log('Storage buckets:', buckets.map(b => b.name));
      
      // Check if project_media bucket exists
      const hasMediaBucket = buckets.some(b => b.name === 'project_media');
      
      if (!hasMediaBucket) {
        console.log('project_media bucket does not exist. Creating it...');
        
        // Create project_media bucket
        const { data: newBucket, error: createBucketError } = await supabase
          .storage
          .createBucket('project_media', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/*']
          });
        
        if (createBucketError) {
          console.error('Error creating project_media bucket:', createBucketError);
        } else {
          console.log('project_media bucket created successfully!');
        }
      } else {
        console.log('project_media bucket already exists.');
      }
    }
    
    console.log('\nSchema check and fixes completed!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
checkAndFixSchema();
