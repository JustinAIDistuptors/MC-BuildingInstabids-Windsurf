/**
 * Direct Authentication Test for InstaBids
 * 
 * This script bypasses all application code and directly tests authentication
 * and database operations to identify the root cause of messaging issues.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjI3NjMsImV4cCI6MjA1OTQzODc2M30.5Ew9RyW6umw_xB-mubmcp30Qo9eWOQ8J4fuk8li7yzo';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test credentials (replace with actual test accounts)
const testAccounts = [
  { email: 'homeowner@instabids.com', password: 'password123', expectedRole: 'homeowner' },
  { email: 'contractor1@instabids.com', password: 'password123', expectedRole: 'contractor' },
  { email: 'contractor2@instabids.com', password: 'password123', expectedRole: 'contractor' }
];

// Function to test authentication and user role
async function testAuthentication(email, password, expectedRole) {
  console.log(`\n=== Testing authentication for ${email} ===`);
  
  try {
    // Sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error('Sign in error:', signInError);
      return;
    }
    
    console.log('Successfully signed in');
    console.log('User ID:', signInData.user.id);
    console.log('Session:', signInData.session ? 'Valid' : 'Invalid');
    
    // Get user role from user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', signInData.user.id)
      .single();
    
    if (roleError) {
      console.error('Error getting role from user_roles table:', roleError);
    } else {
      console.log('Role from user_roles table:', roleData?.role || 'No role found');
      console.log('Expected role:', expectedRole);
      console.log('Match?', (roleData?.role === expectedRole) ? 'YES' : 'NO');
    }
    
    // Test sending a message
    const projectId = '5547a893-8309-43e5-9c62-090486b1bf09'; // Replace with actual test project
    const content = `Test message from ${email} at ${new Date().toISOString()}`;
    
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: signInData.user.id,
        content,
        message_type: 'individual',
        sender_type: roleData?.role || expectedRole
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('Error sending message:', messageError);
    } else {
      console.log('Message sent successfully');
      console.log('Message ID:', messageData.id);
      console.log('Sender ID used:', messageData.sender_id);
      console.log('Sender type used:', messageData.sender_type);
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('Signed out');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run tests sequentially
async function runTests() {
  console.log('=== DIRECT AUTHENTICATION TEST ===');
  console.log('Testing authentication and messaging directly with Supabase');
  console.log('Bypassing all application code to identify issues');
  
  for (const account of testAccounts) {
    await testAuthentication(account.email, account.password, account.expectedRole);
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

// Run the tests
runTests();