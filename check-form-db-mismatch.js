/**
 * This script checks for mismatches between the BidCardForm fields and the database schema
 * It will identify any fields that are in the form but missing from the database
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from the credentials file
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Fields used in the BidCardForm component
const formFields = [
  'title',
  'description',
  'status',
  'bid_status',
  'job_size', // This is the field we know is missing
  'city',
  'state',
  'zip_code',
  'type',
  'job_type_id',
  'job_category_id',
  'service_type',
  'location',
  'property_type',
  'property_size',
  'square_footage',
  'timeline',
  'timeline_horizon_id',
  'timeline_start',
  'timeline_end',
  'bid_deadline',
  'special_requirements',
  'guidance_for_bidders',
  'group_bidding_enabled',
  'terms_accepted',
  'marketing_consent',
  'owner_id'
];

async function checkMismatches() {
  try {
    // Get the projects table schema
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error fetching projects table:', error);
      return;
    }
    
    // If we got data, extract the column names
    if (data && data.length > 0) {
      const dbColumns = Object.keys(data[0]);
      console.log('Database columns:', dbColumns);
      
      // Find fields in the form that are missing from the database
      const missingColumns = formFields.filter(field => !dbColumns.includes(field));
      console.log('Fields in form but missing from database:', missingColumns);
      
      // Generate SQL to add missing columns
      if (missingColumns.length > 0) {
        console.log('\nSQL to add missing columns:');
        const sql = missingColumns.map(column => 
          `ALTER TABLE projects ADD COLUMN IF NOT EXISTS ${column} TEXT;`
        ).join('\n');
        console.log(sql);
      } else {
        console.log('No missing columns found!');
      }
    } else {
      console.log('No data returned from projects table');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the check
checkMismatches();
