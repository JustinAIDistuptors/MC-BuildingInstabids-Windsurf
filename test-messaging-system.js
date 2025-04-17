/**
 * Test Messaging System
 * 
 * This script tests the messaging functionality between contractors and homeowners.
 * It uses the Supabase client to interact with the database directly.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Development test IDs
const TEST_CONTRACTOR_ID = 'f609a4e1-243d-41bc-b2fa-69ee0c6e2ca1';
const TEST_HOMEOWNER_ID = '795bc458-a806-4d83-8677-780e22e3a5e3';
const TEST_PROJECT_ID = '515aea6d-bfd1-4cb1-b66e-8faa2fb74e8e';

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Test sending a message from contractor to homeowner
 */
async function testContractorToHomeownerMessage() {
  console.log('\n--- Testing Contractor to Homeowner Message ---');
  
  try {
    const messageContent = `Test message from contractor to homeowner: ${new Date().toISOString()}`;
    
    // Insert message into the messages table
    const { data, error } = await supabase
      .from('messages')
      .insert({
        project_id: TEST_PROJECT_ID,
        sender_id: TEST_CONTRACTOR_ID,
        recipient_id: TEST_HOMEOWNER_ID,
        content: messageContent
      })
      .select();
    
    if (error) {
      console.error('Error sending contractor message:', error);
      return false;
    }
    
    console.log('Message sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Exception in testContractorToHomeownerMessage:', error);
    return false;
  }
}

/**
 * Test sending a message from homeowner to contractor
 */
async function testHomeownerToContractorMessage() {
  console.log('\n--- Testing Homeowner to Contractor Message ---');
  
  try {
    const messageContent = `Test message from homeowner to contractor: ${new Date().toISOString()}`;
    
    // Insert message into the messages table
    const { data, error } = await supabase
      .from('messages')
      .insert({
        project_id: TEST_PROJECT_ID,
        sender_id: TEST_HOMEOWNER_ID,
        recipient_id: TEST_CONTRACTOR_ID,
        content: messageContent
      })
      .select();
    
    if (error) {
      console.error('Error sending homeowner message:', error);
      return false;
    }
    
    console.log('Message sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Exception in testHomeownerToContractorMessage:', error);
    return false;
  }
}

/**
 * Test retrieving messages between a contractor and homeowner
 */
async function testGetMessages() {
  console.log('\n--- Testing Get Messages ---');
  
  try {
    // Get messages between contractor and homeowner for the test project
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', TEST_PROJECT_ID)
      .or(`sender_id.eq.${TEST_CONTRACTOR_ID},recipient_id.eq.${TEST_CONTRACTOR_ID}`)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error retrieving messages:', error);
      return false;
    }
    
    console.log(`Retrieved ${data.length} messages:`);
    data.forEach(message => {
      const direction = message.sender_id === TEST_CONTRACTOR_ID ? 'Contractor → Homeowner' : 'Homeowner → Contractor';
      console.log(`- [${direction}] ${message.content}`);
    });
    
    return true;
  } catch (error) {
    console.error('Exception in testGetMessages:', error);
    return false;
  }
}

/**
 * Test storing development fallback IDs in localStorage
 */
function testStoreDevelopmentFallbacks() {
  console.log('\n--- Storing Development Fallback IDs ---');
  
  // This would normally be done in the browser, but we're simulating it here
  console.log(`Storing contractor ID: ${TEST_CONTRACTOR_ID}`);
  console.log(`Storing homeowner ID: ${TEST_HOMEOWNER_ID}`);
  console.log(`Storing project ID: ${TEST_PROJECT_ID}`);
  
  console.log('\nTo use these IDs in your browser, run the following in the browser console:');
  console.log(`localStorage.setItem('dev_contractor_id', '${TEST_CONTRACTOR_ID}');`);
  console.log(`localStorage.setItem('dev_homeowner_id', '${TEST_HOMEOWNER_ID}');`);
  console.log(`localStorage.setItem('dev_project_id', '${TEST_PROJECT_ID}');`);
  
  return true;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('=== Starting Messaging System Tests ===');
  
  // Store development fallback IDs
  const storeResult = testStoreDevelopmentFallbacks();
  console.log(`Store development fallbacks: ${storeResult ? 'SUCCESS' : 'FAILED'}`);
  
  // Test contractor to homeowner message
  const contractorResult = await testContractorToHomeownerMessage();
  console.log(`Contractor to homeowner message: ${contractorResult ? 'SUCCESS' : 'FAILED'}`);
  
  // Test homeowner to contractor message
  const homeownerResult = await testHomeownerToContractorMessage();
  console.log(`Homeowner to contractor message: ${homeownerResult ? 'SUCCESS' : 'FAILED'}`);
  
  // Test getting messages
  const getResult = await testGetMessages();
  console.log(`Get messages: ${getResult ? 'SUCCESS' : 'FAILED'}`);
  
  console.log('\n=== Test Summary ===');
  console.log(`Store development fallbacks: ${storeResult ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Contractor to homeowner message: ${contractorResult ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Homeowner to contractor message: ${homeownerResult ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Get messages: ${getResult ? 'SUCCESS' : 'FAILED'}`);
  
  const allSuccess = storeResult && contractorResult && homeownerResult && getResult;
  console.log(`\nOverall test result: ${allSuccess ? 'SUCCESS' : 'FAILED'}`);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
});
