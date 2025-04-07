/**
 * Database Setup Script for InstaBids
 * 
 * This script uses the Supabase REST API to check if tables exist
 * and create them if needed.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const { 
  NEXT_PUBLIC_SUPABASE_URL, 
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

async function main() {
  console.log('🔧 InstaBids Database Setup 🔧');
  console.log('------------------------------');

  // Check for required environment variables
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing required environment variables.');
    console.log('');
    console.log('Please create a .env.local file with the following variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>');
    console.log('SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
    console.log('NEXT_PUBLIC_APP_URL=http://localhost:3000');
    console.log('');
    console.log('You can find these values in your Supabase project dashboard');
    console.log('under Project Settings > API.');
    process.exit(1);
  }

  // Initialize Supabase client with service role key (required for schema execution)
  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('✅ Supabase client initialized');
  console.log(`🔗 Connected to: ${NEXT_PUBLIC_SUPABASE_URL}`);
  
  try {
    console.log('\n🧪 Testing database connection...');
    
    // Test for profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError && profilesError.message.includes('does not exist')) {
      console.log('ℹ️ The profiles table does not exist yet.');
      console.log('ℹ️ You need to create the required tables in your Supabase project.');
      console.log('\nPlease follow these steps:');
      console.log('1. Go to your Supabase dashboard: https://app.supabase.com/project/heqifyikpitzpwyasvop');
      console.log('2. Click on "SQL Editor" in the left menu');
      console.log('3. Click on "New Query"');
      console.log('4. Copy and paste the SQL code from src/scripts/schema.sql');
      console.log('5. Click "Run" to execute the SQL code and create all tables');
      console.log('\nAfter creating the tables, restart your Next.js server and go to:');
      console.log('http://localhost:3002/test-auth');
    } else if (profilesError) {
      console.error('❌ Error querying profiles:', profilesError.message);
    } else {
      console.log(`✅ Successfully connected to profiles table. Found ${profilesData.length} profiles.`);
      if (profilesData.length > 0) {
        console.log('Sample profile:');
        console.log(profilesData[0]);
      }
      
      console.log('\n🎉 Your database is already set up and working!');
      console.log('You can run the application with:');
      console.log('npm run dev');
      console.log('\nGo to http://localhost:3002/test-auth to test authentication!');
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    process.exit(1);
  }
}

main();
