#!/usr/bin/env node

/**
 * Test script for the contractor messaging component
 * This script will set up development fallbacks and test the messaging functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Test project ID - using an existing project
const TEST_PROJECT_ID = '515aea6d-bfd1-4cb1-b66e-8faa2fb74e8e';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Get real user IDs from the database
async function getRealUserIds() {
  try {
    console.log('Fetching real user IDs from the database...');
    
    // Get a contractor ID
    const { data: contractorData, error: contractorError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'contractor')
      .limit(1);
    
    if (contractorError || !contractorData || contractorData.length === 0) {
      console.error('Error getting contractor ID:', contractorError || 'No contractors found');
      return { contractorId: null, homeownerId: null };
    }
    
    const contractorId = contractorData[0].id;
    console.log('Found contractor ID:', contractorId);
    
    // Get project owner (homeowner) ID
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', TEST_PROJECT_ID)
      .single();
    
    let homeownerId = null;
    
    if (projectError || !projectData || !projectData.owner_id) {
      console.log('Project owner ID not found or is null, looking for a homeowner user...');
      
      // Try to get any user who is a homeowner
      const { data: homeownerData, error: homeownerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'homeowner')
        .limit(1);
      
      if (homeownerError || !homeownerData || homeownerData.length === 0) {
        console.error('Error getting homeowner ID:', homeownerError || 'No homeowners found');
        
        // As a last resort, use any user who is not the contractor
        const { data: anyUserData, error: anyUserError } = await supabase
          .from('profiles')
          .select('id')
          .neq('id', contractorId)
          .limit(1);
        
        if (anyUserError || !anyUserData || anyUserData.length === 0) {
          console.error('Error getting any user ID:', anyUserError || 'No other users found');
          return { contractorId, homeownerId: null };
        }
        
        homeownerId = anyUserData[0].id;
        console.log('Found fallback user ID (any non-contractor):', homeownerId);
      } else {
        homeownerId = homeownerData[0].id;
        console.log('Found homeowner ID (from profiles):', homeownerId);
      }
    } else {
      homeownerId = projectData.owner_id;
      console.log('Found project owner ID:', homeownerId);
    }
    
    return { contractorId, homeownerId };
  } catch (error) {
    console.error('Error in getRealUserIds:', error);
    return { contractorId: null, homeownerId: null };
  }
}

// Set up development fallbacks
async function setupDevFallbacks() {
  console.log('Setting up development fallbacks...');
  
  // Get real user IDs
  const { contractorId, homeownerId } = await getRealUserIds();
  
  if (!contractorId || !homeownerId) {
    console.error('Failed to get real user IDs. Cannot continue.');
    process.exit(1);
  }
  
  // Store real IDs in localStorage for the web app to use
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('dev_user_id', contractorId);
    localStorage.setItem('dev_homeowner_id', homeownerId);
    localStorage.setItem('dev_auth_fallback', 'true');
    console.log('Development fallbacks set in localStorage');
  } else {
    console.log('localStorage not available in Node.js environment');
    console.log('Please run the following in your browser console:');
    console.log(`localStorage.setItem('dev_user_id', '${contractorId}');`);
    console.log(`localStorage.setItem('dev_homeowner_id', '${homeownerId}');`);
    console.log(`localStorage.setItem('dev_auth_fallback', 'true');`);
  }
  
  return { contractorId, homeownerId };
}

// Test message sending
async function testMessageSending(contractorId, homeownerId) {
  try {
    console.log('Testing message sending...');
    
    // Create a test message from contractor to homeowner
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        project_id: TEST_PROJECT_ID,
        sender_id: contractorId,
        recipient_id: homeownerId,
        content: 'Test message from contractor to homeowner via test script',
        message_type: 'individual',
        created_at: new Date().toISOString()
      })
      .select();
    
    if (messageError) {
      console.error('Error creating test message:', messageError);
      return false;
    }
    
    console.log('Test message created:', messageData[0].id);
    
    // Create message recipient
    const { data: recipientData, error: recipientError } = await supabase
      .from('message_recipients')
      .insert({
        message_id: messageData[0].id,
        recipient_id: homeownerId,
        created_at: new Date().toISOString()
      })
      .select();
    
    if (recipientError) {
      console.error('Error creating message recipient:', recipientError);
      return false;
    }
    
    console.log('Message recipient created:', recipientData[0].id);
    
    // Create contractor alias if it doesn't exist
    const { data: aliasData, error: aliasError } = await supabase
      .from('contractor_aliases')
      .select('*')
      .eq('project_id', TEST_PROJECT_ID)
      .eq('contractor_id', contractorId);
    
    if (aliasError) {
      console.error('Error checking contractor alias:', aliasError);
    } else if (!aliasData || aliasData.length === 0) {
      // Create alias
      const { data: newAliasData, error: newAliasError } = await supabase
        .from('contractor_aliases')
        .insert({
          project_id: TEST_PROJECT_ID,
          contractor_id: contractorId,
          alias: 'Z', // Special test alias
          created_at: new Date().toISOString()
        })
        .select();
      
      if (newAliasError) {
        console.error('Error creating contractor alias:', newAliasError);
      } else {
        console.log('Contractor alias created:', newAliasData[0].id);
      }
    } else {
      console.log('Contractor alias already exists:', aliasData[0].id);
    }
    
    return true;
  } catch (error) {
    console.error('Error in testMessageSending:', error);
    return false;
  }
}

// Test message retrieval
async function testMessageRetrieval() {
  try {
    console.log('Testing message retrieval...');
    
    // Get messages for the test project
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        project_id,
        sender_id,
        recipient_id,
        content,
        message_type,
        created_at,
        read_at
      `)
      .eq('project_id', TEST_PROJECT_ID)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (messagesError) {
      console.error('Error retrieving messages:', messagesError);
      return false;
    }
    
    console.log(`Retrieved ${messages.length} messages:`);
    messages.forEach(message => {
      console.log(`- ${message.id}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`);
    });
    
    return true;
  } catch (error) {
    console.error('Error in testMessageRetrieval:', error);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting messaging test...');
    
    // Set up development fallbacks
    const { contractorId, homeownerId } = await setupDevFallbacks();
    
    // Test message sending
    const sendingSuccess = await testMessageSending(contractorId, homeownerId);
    console.log('Message sending test:', sendingSuccess ? 'SUCCESS' : 'FAILED');
    
    // Test message retrieval
    const retrievalSuccess = await testMessageRetrieval();
    console.log('Message retrieval test:', retrievalSuccess ? 'SUCCESS' : 'FAILED');
    
    console.log('\nTest completed. To use the messaging component:');
    console.log('1. Open the web app in your browser');
    console.log('2. Navigate to a project page with the ContractorBidMessaging component');
    console.log('3. The component should automatically use the development fallbacks');
    console.log('4. You should be able to send and receive messages');
    
    console.log('\nDevelopment fallback IDs:');
    console.log(`- Contractor ID: ${contractorId}`);
    console.log(`- Homeowner ID: ${homeownerId}`);
    console.log(`- Test Project ID: ${TEST_PROJECT_ID}`);
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Run the script
main();
