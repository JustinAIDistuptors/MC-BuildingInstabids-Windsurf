/**
 * Fix Database Setup for InstaBids
 * 
 * This script will:
 * 1. Check database connection
 * 2. Verify if required tables exist
 * 3. Create missing tables if needed
 * 4. Create RLS policies
 * 5. Create test users
 * 
 * No manual intervention required!
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test accounts to create
const testAccounts = [
  { email: 'homeowner@instabids.com', password: 'Password123!', fullName: 'Henry Homeowner', userType: 'homeowner' },
  { email: 'contractor@instabids.com', password: 'Password123!', fullName: 'Carl Contractor', userType: 'contractor' },
  { email: 'property@instabids.com', password: 'Password123!', fullName: 'Patty PropertyManager', userType: 'property-manager' },
  { email: 'labor@instabids.com', password: 'Password123!', fullName: 'Larry LaborContractor', userType: 'labor-contractor' },
  { email: 'admin@instabids.com', password: 'Password123!', fullName: 'Adam Admin', userType: 'admin' }
];

/**
 * Execute SQL directly in the Supabase database
 */
async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error(`SQL Execution Error: ${error.message}`);
    
    // Try using REST API directly to execute SQL (alternative method)
    try {
      console.log("Trying alternative SQL execution method...");
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_string: sql })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${await response.text()}`);
      }
      
      return { success: true, data: await response.json() };
    } catch (fetchError) {
      console.error(`Alternative SQL Execution Error: ${fetchError.message}`);
      return { success: false, error };
    }
  }
}

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName);
    
  if (error) {
    console.error(`Error checking table existence: ${error.message}`);
    return false;
  }
  
  return data && data.length > 0;
}

/**
 * Create the exec_sql function if it doesn't exist
 */
async function createExecSqlFunction() {
  console.log("Creating exec_sql function...");
  
  try {
    const sql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_string TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        EXECUTE sql_string;
        result := '{"success": true}'::JSONB;
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        result := jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'detail', SQLSTATE
        );
        RETURN result;
      END;
      $$;
    `;
    
    // Execute directly via REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'params=single-object',
        'X-Client-Info': 'fixing-db-functions'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} - ${await response.text()}`);
    }
    
    console.log("✅ exec_sql function created successfully");
    return true;
  } catch (error) {
    console.error(`Failed to create exec_sql function: ${error.message}`);
    
    // Try directly from the SQL Editor in Supabase dashboard
    console.log("Please create this function manually in the Supabase SQL Editor:");
    console.log(`
      CREATE OR REPLACE FUNCTION exec_sql(sql_string TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        EXECUTE sql_string;
        result := '{"success": true}'::JSONB;
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        result := jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'detail', SQLSTATE
        );
        RETURN result;
      END;
      $$;
    `);
    
    return false;
  }
}

/**
 * Create the profiles table
 */
async function createProfilesTable() {
  console.log("Creating profiles table...");
  
  const sql = `
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
    
    -- Set up Row Level Security
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
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
      
    -- Add a function to automatically create profiles for new users
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
    
    -- Add the trigger to automatically create profiles
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `;
  
  const result = await executeSql(sql);
  
  if (result.success) {
    console.log("✅ Profiles table created successfully");
    return true;
  } else {
    console.error(`Failed to create profiles table: ${result.error?.message}`);
    return false;
  }
}

/**
 * Create the projects table
 */
async function createProjectsTable() {
  console.log("Creating projects table...");
  
  const sql = `
    CREATE TABLE IF NOT EXISTS public.projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
      owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      project_type TEXT NOT NULL,
      budget DECIMAL(12,2),
      location TEXT,
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Set up Row Level Security
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
    CREATE POLICY "Users can view their own projects"
      ON public.projects
      FOR SELECT
      USING (auth.uid() = owner_id);
    
    DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
    CREATE POLICY "Users can create their own projects"
      ON public.projects
      FOR INSERT
      WITH CHECK (auth.uid() = owner_id);
    
    DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
    CREATE POLICY "Users can update their own projects"
      ON public.projects
      FOR UPDATE
      USING (auth.uid() = owner_id);
      
    DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
    CREATE POLICY "Users can delete their own projects"
      ON public.projects
      FOR DELETE
      USING (auth.uid() = owner_id);
      
    DROP POLICY IF EXISTS "Service role can manage all projects" ON public.projects;
    CREATE POLICY "Service role can manage all projects"
      ON public.projects
      USING (auth.role() = 'service_role');
  `;
  
  const result = await executeSql(sql);
  
  if (result.success) {
    console.log("✅ Projects table created successfully");
    return true;
  } else {
    console.error(`Failed to create projects table: ${result.error?.message}`);
    return false;
  }
}

/**
 * Create test users in the database
 */
async function createTestUsers() {
  console.log("\nCreating test users...");
  let successCount = 0;
  
  for (const account of testAccounts) {
    const { email, password, fullName, userType } = account;
    console.log(`\nCreating ${userType} account: ${email}`);
    
    try {
      // Check if user exists
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
        filter: `email eq '${email}'`
      });
      
      let user;
      
      if (listError) {
        console.error(`  Error checking user existence: ${listError.message}`);
      } else if (existingUsers.users.length > 0) {
        console.log(`  User already exists`);
        user = existingUsers.users[0];
      } else {
        // Create user with admin API
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            user_type: userType
          }
        });
        
        if (error) {
          console.error(`  Error creating user: ${error.message}`);
          continue;
        }
        
        user = data.user;
        console.log(`  ✅ Created user with ID: ${user.id}`);
      }
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error(`  Error checking profile: ${profileError.message}`);
      } else if (profile) {
        console.log(`  ✅ Profile exists`);
      } else {
        // Create profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: fullName,
            user_type: userType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`  Error creating profile: ${insertError.message}`);
        } else {
          console.log(`  ✅ Created profile`);
        }
      }
      
      successCount++;
    } catch (error) {
      console.error(`  Error processing user: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Completed creating ${successCount} out of ${testAccounts.length} test users`);
  return successCount;
}

/**
 * Main function to fix the database
 */
async function fixDatabase() {
  console.log('🔧 InstaBids Database Doctor 🔧');
  console.log('==============================');
  console.log('Running comprehensive database diagnostics and fixes...');
  
  // 1. Check connection
  console.log('\nChecking Supabase connection...');
  try {
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
    
    if (error) {
      console.error(`❌ Connection error: ${error.message}`);
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully!');
  } catch (error) {
    console.error(`❌ Fatal connection error: ${error.message}`);
    return false;
  }
  
  // 2. Create exec_sql function if needed
  await createExecSqlFunction();
  
  // 3. Check and create profiles table
  const profilesExist = await tableExists('profiles');
  console.log(`Profiles table exists: ${profilesExist ? 'Yes ✅' : 'No ❌'}`);
  
  if (!profilesExist) {
    await createProfilesTable();
  }
  
  // 4. Check and create projects table
  const projectsExist = await tableExists('projects');
  console.log(`Projects table exists: ${projectsExist ? 'Yes ✅' : 'No ❌'}`);
  
  if (!projectsExist) {
    await createProjectsTable();
  }
  
  // 5. Create test users
  const userCount = await createTestUsers();
  
  console.log('\n🎉 Database setup complete! 🎉');
  console.log('----------------------------');
  console.log(`Profiles table: ${await tableExists('profiles') ? 'Created ✅' : 'Failed ❌'}`);
  console.log(`Projects table: ${await tableExists('projects') ? 'Created ✅' : 'Failed ❌'}`);
  console.log(`Test users: ${userCount} created/verified ✅`);
  console.log('\nYou can now use the test accounts to log in:');
  
  testAccounts.forEach(account => {
    console.log(`- ${account.userType}: ${account.email} / ${account.password}`);
  });
}

// Run the database fixing script
fixDatabase().catch(error => {
  console.error('Fatal error:', error);
});
