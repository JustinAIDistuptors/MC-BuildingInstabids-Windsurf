// Simple Supabase connection test
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjI3NjMsImV4cCI6MjA1OTQzODc2M30.5Ew9RyW6umw_xB-mubmcp30Qo9eWOQ8J4fuk8li7yzo';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase clients with debug options
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  console.log('=== Supabase Connection Test ===');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Time:', new Date().toISOString());
  console.log('===========================');
  
  // Test 1: Basic auth status check
  try {
    console.log('\nTest 1: Checking auth status with anon key');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth check failed:', authError.message);
    } else {
      console.log('✅ Auth check successful');
      console.log('Session data:', authData);
    }
  } catch (error) {
    console.error('❌ Auth check exception:', error.message);
  }
  
  // Test 2: Try to access a known table
  try {
    console.log('\nTest 2: Checking table access with anon key');
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access failed:', error.message);
    } else {
      console.log('✅ Table access successful');
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('❌ Table access exception:', error.message);
  }
  
  // Test 3: Try with service role key
  try {
    console.log('\nTest 3: Checking table access with service role key');
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Admin table access failed:', error.message);
    } else {
      console.log('✅ Admin table access successful');
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('❌ Admin table access exception:', error.message);
  }
  
  // Test 4: Check storage access
  try {
    console.log('\nTest 4: Checking storage access');
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    
    if (error) {
      console.error('❌ Storage access failed:', error.message);
    } else {
      console.log('✅ Storage access successful');
      console.log('Buckets:', data.map(b => b.name).join(', '));
    }
  } catch (error) {
    console.error('❌ Storage access exception:', error.message);
  }
  
  // Test 5: Try a simple REST API call
  try {
    console.log('\nTest 5: Testing REST API access');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/messages?limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    const status = response.status;
    const text = await response.text();
    
    console.log('REST API Status:', status);
    console.log('REST API Response:', text);
    
    if (status >= 200 && status < 300) {
      console.log('✅ REST API access successful');
    } else {
      console.error('❌ REST API access failed');
    }
  } catch (error) {
    console.error('❌ REST API access exception:', error.message);
  }
  
  console.log('\n===========================');
  console.log('Connection test completed');
  console.log('===========================');
}

// Run the test
testConnection();
