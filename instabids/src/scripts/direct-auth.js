/**
 * Direct Authentication Diagnostics for InstaBids
 * 
 * This script tests direct authentication to Supabase without relying
 * on our custom database functions. It will help diagnose what's
 * going wrong with authentication.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with admin credentials
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

// Log environment and connection status
console.log('Environment Diagnostics:');
console.log('=======================');
console.log(`SUPABASE URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Defined' : 'MISSING'}`);
console.log(`SERVICE KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Defined (starts with: ' + 
  process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 3) + '...)' : 'MISSING'}`);
console.log('');

async function runDiagnostics() {
  try {
    // 1. Test basic connection
    console.log('Testing Supabase Connection...');
    // Simple query to verify connection works
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connection working!');
    }
    
    // 2. Test auth admin API
    console.log('\nTesting Auth Admin API...');
    try {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      
      if (usersError) {
        console.error('Auth admin API test failed:', usersError.message);
      } else {
        console.log('✅ Auth Admin API working!');
        console.log(`   Found ${users.users.length > 0 ? users.users.length : 'no'} users.`);
      }
    } catch (err) {
      console.error('Auth admin API test exception:', err.message);
    }
    
    // 3. Try creating user directly with minimal data
    console.log('\nAttempting simple user creation...');
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    try {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (createError) {
        console.error('User creation failed:', createError.message);
      } else {
        console.log(`✅ Created test user: ${testEmail}`);
        console.log(`   User ID: ${createData.user.id}`);
        
        // 4. Try inserting directly to profiles table
        console.log('\nTesting direct profile insertion...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: createData.user.id,
            full_name: 'Test User',
            user_type: 'homeowner',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
          
        if (profileError) {
          console.error('Profile creation failed:', profileError.message);
          
          // Check if the profiles table exists
          console.log('\nChecking profiles table existence...');
          const { data: tableExists, error: tableError } = await supabase.rpc('check_table_exists', {
            table_name: 'profiles'
          });
          
          if (tableError) {
            console.error('Failed to check table:', tableError.message);
          } else {
            console.log(`Profiles table exists: ${tableExists ? 'Yes' : 'No'}`);
            
            if (!tableExists) {
              console.log('\nAttempting to create profiles table...');
              const { data: createTableData, error: createTableError } = await supabase.rpc('create_profiles_table');
              
              if (createTableError) {
                console.error('Table creation failed:', createTableError.message);
              } else {
                console.log('✅ Profiles table created!');
              }
            }
          }
        } else {
          console.log('✅ Profile created successfully!');
        }
      }
    } catch (err) {
      console.error('User creation exception:', err.message);
    }
    
    console.log('\nDiagnostics complete. Check the log above for issues.');
  } catch (error) {
    console.error('Fatal error during diagnostics:', error.message);
  }
}

// Run diagnostics
runDiagnostics();
