/**
 * InstaBids Database and User Setup Script
 * 
 * This script will:
 * 1. Check if necessary tables exist
 * 2. Create them if they don't
 * 3. Set up test users
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create Supabase client using the environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Table creation SQL stored as strings
const CREATE_PROFILES_TABLE = `
  CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('homeowner', 'contractor', 'property-manager', 'labor-contractor', 'admin')),
    avatar_url TEXT,
    company_name TEXT,
    website TEXT,
    phone TEXT,
    bio TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  -- Enable RLS on profiles
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  
  -- Create policies for profiles
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
  CREATE POLICY "Users can view their own profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
  
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
  
  DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
  CREATE POLICY "Service role can manage all profiles"
      ON public.profiles
      USING (auth.role() = 'service_role');
`;

// User trigger creation SQL
const CREATE_USER_TRIGGER = `
  -- Create trigger function for user profiles
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
      INSERT INTO public.profiles (id, full_name, user_type)
      VALUES (
          NEW.id,
          NEW.raw_user_meta_data->>'full_name',
          COALESCE(NEW.raw_user_meta_data->>'user_type', 'homeowner')
      );
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  -- Add trigger to create profiles for new users
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

// Test users to create
const TEST_USERS = [
  { email: 'homeowner@instabids.com', password: 'Password123!', fullName: 'Henry Homeowner', userType: 'homeowner' },
  { email: 'contractor@instabids.com', password: 'Password123!', fullName: 'Carl Contractor', userType: 'contractor' },
  { email: 'property@instabids.com', password: 'Password123!', fullName: 'Patty PropertyManager', userType: 'property-manager' },
  { email: 'labor@instabids.com', password: 'Password123!', fullName: 'Larry LaborContractor', userType: 'labor-contractor' },
  { email: 'admin@instabids.com', password: 'Password123!', fullName: 'Adam Admin', userType: 'admin' }
];

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  try {
    console.log(`Checking if ${tableName} table exists...`);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Error code for "relation does not exist"
      console.log(`Table ${tableName} does not exist.`);
      return false;
    } else {
      console.log(`Table ${tableName} exists.`);
      return true;
    }
  } catch (error) {
    console.log(`Error checking if ${tableName} exists:`, error.message);
    return false;
  }
}

/**
 * Run a SQL query directly using Supabase's REST API
 */
async function runSQL(sql) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SQL execution failed: ${response.status} - ${text}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error(`SQL error:`, error.message);
    return { success: false, error };
  }
}

/**
 * Create a test user
 */
async function createTestUser(userData) {
  const { email, password, fullName, userType } = userData;
  console.log(`\nCreating ${userType} user: ${email}`);
  
  try {
    // Check if user exists already
    const { data: existingUsers, error: usersError } = await supabase.auth.admin.listUsers({
      filter: `email eq '${email}'`
    });
    
    if (usersError) {
      console.error(`  Error checking user existence:`, usersError.message);
    } else if (existingUsers.users.length > 0) {
      console.log(`  User ${email} already exists, skipping creation.`);
      return { success: true, userId: existingUsers.users[0].id };
    }
    
    // Create user with Supabase Auth Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: fullName,
        user_type: userType
      }
    });
    
    if (error) {
      throw error;
    }
    
    console.log(`  ✅ User created successfully with ID: ${data.user.id}`);
    return { success: true, userId: data.user.id };
  } catch (error) {
    console.error(`  ❌ Error creating user:`, error.message);
    return { success: false, error };
  }
}

/**
 * Ensure profile exists for a user
 */
async function ensureProfileExists(userId, fullName, userType) {
  try {
    console.log(`  Checking if profile exists for user ${userId}...`);
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is the "no rows returned" error
      throw profileError;
    }
    
    if (profile) {
      console.log(`  ✅ Profile already exists`);
      return { success: true };
    }
    
    // Create profile manually
    console.log(`  Creating profile for user ${userId}...`);
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        full_name: fullName,
        user_type: userType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (insertError) {
      throw insertError;
    }
    
    console.log(`  ✅ Profile created successfully`);
    return { success: true };
  } catch (error) {
    console.error(`  ❌ Error with profile:`, error.message);
    return { success: false, error };
  }
}

/**
 * Main setup function
 */
async function setupDatabaseAndUsers() {
  console.log('🔧 InstaBids Database and User Setup 🔧');
  console.log('=====================================');
  
  // 1. Verify connection
  try {
    console.log(`\nConnecting to Supabase at: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Connected successfully to Supabase`);
  } catch (error) {
    console.error(`❌ Connection failed:`, error.message);
    return;
  }
  
  // 2. Create profiles table if it doesn't exist
  const profilesExist = await tableExists('profiles');
  
  if (!profilesExist) {
    console.log('\nCreating profiles table...');
    try {
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql_string: CREATE_PROFILES_TABLE });
      
      if (sqlError) {
        console.error('Error creating profiles table with RPC:', sqlError.message);
        console.log('Trying alternative method...');
        
        // Try direct SQL execution
        const result = await runSQL(CREATE_PROFILES_TABLE);
        
        if (result.success) {
          console.log('✅ Profiles table created');
        } else {
          console.error('❌ Failed to create profiles table');
        }
      } else {
        console.log('✅ Profiles table created');
      }
    } catch (error) {
      console.error('❌ Error creating profiles table:', error.message);
    }
  }
  
  // 3. Set up user trigger if profiles table exists
  if (profilesExist || await tableExists('profiles')) {
    console.log('\nSetting up user trigger...');
    try {
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql_string: CREATE_USER_TRIGGER });
      
      if (sqlError) {
        console.error('Error creating user trigger with RPC:', sqlError.message);
        console.log('Trying alternative method...');
        
        // Try direct SQL execution
        const result = await runSQL(CREATE_USER_TRIGGER);
        
        if (result.success) {
          console.log('✅ User trigger created');
        } else {
          console.error('❌ Failed to create user trigger');
        }
      } else {
        console.log('✅ User trigger created');
      }
    } catch (error) {
      console.error('❌ Error creating user trigger:', error.message);
    }
  }
  
  // 4. Create test users
  console.log('\nCreating test users...');
  let successCount = 0;
  
  for (const user of TEST_USERS) {
    const result = await createTestUser(user);
    
    if (result.success) {
      // Ensure profile exists
      await ensureProfileExists(result.userId, user.fullName, user.userType);
      successCount++;
    }
  }
  
  // 5. Summary
  console.log('\n🎉 Setup Complete 🎉');
  console.log('====================');
  console.log(`✅ Created/verified ${successCount} of ${TEST_USERS.length} test users`);
  console.log('\nTest account credentials:');
  TEST_USERS.forEach(user => {
    console.log(`- ${user.userType}: ${user.email} / ${user.password}`);
  });
  console.log('\nTest the accounts at: http://localhost:3000/test-auth');
}

// Run the setup
setupDatabaseAndUsers().catch(error => {
  console.error('Fatal error:', error);
});
