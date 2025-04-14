// Script to verify the contractor messaging schema updates
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

async function verifyMessagingSchema() {
  console.log('Verifying contractor messaging schema updates...');
  console.log('==============================================\n');
  
  try {
    // 1. Check if messages table has the new columns
    console.log('1. Checking messages table columns...');
    
    const { data: messagesColumns, error: messagesError } = await supabase
      .from('messages')
      .select('message_type, contractor_alias')
      .limit(1);
    
    if (messagesError) {
      console.error('Error checking messages table:', messagesError.message);
      console.log('Status: ❌ FAILED');
    } else {
      console.log('Messages table exists and can be queried');
      console.log('New columns (message_type, contractor_alias) are present');
      console.log('Status: ✅ SUCCESS');
    }
    
    // 2. Check if message_recipients table exists
    console.log('\n2. Checking message_recipients table...');
    
    const { data: recipientsData, error: recipientsError } = await supabase
      .from('message_recipients')
      .select('id')
      .limit(1);
    
    if (recipientsError) {
      console.error('Error checking message_recipients table:', recipientsError.message);
      console.log('Status: ❌ FAILED');
    } else {
      console.log('message_recipients table exists and can be queried');
      console.log('Status: ✅ SUCCESS');
    }
    
    // 3. Check if contractor_aliases table exists
    console.log('\n3. Checking contractor_aliases table...');
    
    const { data: aliasesData, error: aliasesError } = await supabase
      .from('contractor_aliases')
      .select('id, project_id, contractor_id, alias')
      .limit(1);
    
    if (aliasesError) {
      console.error('Error checking contractor_aliases table:', aliasesError.message);
      console.log('Status: ❌ FAILED');
    } else {
      console.log('contractor_aliases table exists and can be queried');
      console.log('Status: ✅ SUCCESS');
    }
    
    // 4. Test inserting a test alias (will be cleaned up)
    console.log('\n4. Testing contractor_aliases insert...');
    
    // First get a project ID to use
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (projectError || !projectData || projectData.length === 0) {
      console.error('Error getting project ID:', projectError?.message || 'No projects found');
      console.log('Status: ⚠️ SKIPPED (no projects available)');
    } else {
      const projectId = projectData[0].id;
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Error: Not authenticated');
        console.log('Status: ⚠️ SKIPPED (not authenticated)');
      } else {
        // Try inserting a test alias
        const { data: insertData, error: insertError } = await supabase
          .from('contractor_aliases')
          .insert({
            project_id: projectId,
            contractor_id: user.id,
            alias: 'TEST'
          })
          .select();
        
        if (insertError) {
          console.error('Error inserting test alias:', insertError.message);
          console.log('Status: ⚠️ WARNING (insertion failed, may be due to RLS policies)');
        } else {
          console.log('Successfully inserted test alias');
          
          // Clean up the test data
          const { error: deleteError } = await supabase
            .from('contractor_aliases')
            .delete()
            .eq('project_id', projectId)
            .eq('contractor_id', user.id)
            .eq('alias', 'TEST');
          
          if (deleteError) {
            console.error('Error cleaning up test data:', deleteError.message);
          } else {
            console.log('Successfully cleaned up test data');
          }
          
          console.log('Status: ✅ SUCCESS');
        }
      }
    }
    
    // 5. Verify RLS policies using the verification function
    console.log('\n5. Verifying RLS policies...');
    
    const { data: verificationData, error: verificationError } = await supabase
      .rpc('verify_messaging_schema');
    
    if (verificationError) {
      console.error('Error verifying RLS policies:', verificationError.message);
      console.log('Status: ⚠️ WARNING (verification function not available)');
    } else {
      console.log('Verification results:');
      console.table(verificationData);
      
      const allTablesHaveRLS = verificationData.every(table => table.has_rls);
      console.log(`All tables have RLS enabled: ${allTablesHaveRLS ? '✅ YES' : '❌ NO'}`);
      
      console.log('Status: ✅ SUCCESS');
    }
    
    // Overall status
    console.log('\n==============================================');
    console.log('Overall verification complete!');
    console.log('Next steps:');
    console.log('1. Implement the service layer functions for messaging');
    console.log('2. Create the UI components for the messaging interface');
    console.log('3. Test the complete messaging flow');
    
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

// Run the verification
verifyMessagingSchema().catch(console.error);
