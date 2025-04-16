// Test script to diagnose contractor alias issues
const { createClient } = require('@supabase/supabase-js');

// Supabase connection details
const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjI3NjMsImV4cCI6MjA1OTQzODc2M30.5Ew9RyW6umw_xB-mubmcp30Qo9eWOQ8J4fuk8li7yzo';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get project ID from command line arguments
const projectId = process.argv[2];

if (!projectId) {
  console.error('Please provide a project ID as an argument');
  console.log('Usage: node test-contractor-aliases.js PROJECT_ID');
  process.exit(1);
}

async function testContractorAliases() {
  console.log(`Running contractor alias tests for project: ${projectId}`);
  console.log('----------------------------------------');

  try {
    // Test 1: Check if the contractor_aliases table exists and has the right structure
    console.log('\n1. Checking contractor_aliases table structure:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('contractor_aliases')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing contractor_aliases table:', tableError.message);
    } else {
      console.log('✓ contractor_aliases table exists and is accessible');
      
      if (tableInfo.length > 0) {
        const sampleRecord = tableInfo[0];
        console.log('Sample record structure:', Object.keys(sampleRecord));
      }
    }

    // Test 2: Check if there are aliases for this project
    console.log('\n2. Checking aliases for this project:');
    const { data: projectAliases, error: aliasError } = await supabase
      .from('contractor_aliases')
      .select('*')
      .eq('project_id', projectId);
    
    if (aliasError) {
      console.error('Error getting aliases for project:', aliasError.message);
    } else {
      console.log(`Found ${projectAliases.length} aliases for this project`);
      if (projectAliases.length > 0) {
        console.table(projectAliases);
      }
    }

    // Test 3: Check if there are bids for this project
    console.log('\n3. Checking bids for this project:');
    const { data: projectBids, error: bidsError } = await supabase
      .from('bids')
      .select(`
        id,
        project_id,
        contractor_id,
        amount,
        status,
        created_at
      `)
      .eq('project_id', projectId);
    
    if (bidsError) {
      console.error('Error getting bids for project:', bidsError.message);
    } else {
      console.log(`Found ${projectBids.length} bids for this project`);
      if (projectBids.length > 0) {
        console.table(projectBids.map(bid => ({
          id: bid.id,
          contractor_id: bid.contractor_id,
          amount: bid.amount,
          status: bid.status,
          created_at: bid.created_at
        })));
      }
    }

    // Test 4: Check if there are messages for this project
    console.log('\n4. Checking messages for this project:');
    const { data: projectMessages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        project_id,
        sender_id,
        content,
        created_at
      `)
      .eq('project_id', projectId);
    
    if (messagesError) {
      console.error('Error getting messages for project:', messagesError.message);
    } else {
      console.log(`Found ${projectMessages.length} messages for this project`);
      if (projectMessages.length > 0) {
        console.table(projectMessages.map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          content: msg.content ? msg.content.substring(0, 30) + '...' : '',
          created_at: msg.created_at
        })));
      }
    }

    // Test 5: Attempt to manually assign aliases
    console.log('\n5. Attempting to manually assign aliases:');
    
    // Get all contractors who have interacted with this project
    const contractorInteractions = [];
    
    // From bids
    if (projectBids && projectBids.length > 0) {
      projectBids.forEach(bid => {
        contractorInteractions.push({
          contractorId: bid.contractor_id,
          timestamp: bid.created_at
        });
      });
    }
    
    // From messages
    if (projectMessages && projectMessages.length > 0) {
      projectMessages.forEach(msg => {
        if (msg.sender_id) {
          contractorInteractions.push({
            contractorId: msg.sender_id,
            timestamp: msg.created_at
          });
        }
      });
    }
    
    // Sort by timestamp and get unique contractor IDs
    contractorInteractions.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const uniqueContractorIds = [];
    contractorInteractions.forEach(interaction => {
      if (!uniqueContractorIds.includes(interaction.contractorId)) {
        uniqueContractorIds.push(interaction.contractorId);
      }
    });
    
    console.log(`Found ${uniqueContractorIds.length} unique contractors who have interacted with this project`);
    console.log('Contractors in order of first interaction:', uniqueContractorIds);
    
    // Check if these contractors already have aliases
    if (uniqueContractorIds.length > 0) {
      const { data: existingAliases } = await supabase
        .from('contractor_aliases')
        .select('contractor_id, alias')
        .eq('project_id', projectId)
        .in('contractor_id', uniqueContractorIds);
      
      console.log('\nExisting aliases:');
      if (existingAliases && existingAliases.length > 0) {
        console.table(existingAliases);
        
        // Find contractors without aliases
        const contractorsWithoutAliases = uniqueContractorIds.filter(id => 
          !existingAliases.some(a => a.contractor_id === id)
        );
        
        console.log(`\n${contractorsWithoutAliases.length} contractors need aliases assigned`);
        
        // Assign aliases to contractors without them
        if (contractorsWithoutAliases.length > 0) {
          const newAliases = contractorsWithoutAliases.map((contractorId, index) => {
            const originalIndex = uniqueContractorIds.indexOf(contractorId);
            const alias = String.fromCharCode(65 + originalIndex);
            
            return {
              project_id: projectId,
              contractor_id: contractorId,
              alias
            };
          });
          
          console.log('New aliases to insert:', newAliases);
          
          // Insert new aliases
          const { data: insertResult, error: insertError } = await supabase
            .from('contractor_aliases')
            .insert(newAliases)
            .select();
          
          if (insertError) {
            console.error('Error inserting aliases:', insertError.message);
          } else {
            console.log('Successfully inserted aliases:', insertResult);
          }
        }
      } else {
        console.log('No existing aliases found');
        
        // Create aliases for all contractors
        const aliases = uniqueContractorIds.map((contractorId, index) => {
          const alias = String.fromCharCode(65 + index);
          return {
            project_id: projectId,
            contractor_id: contractorId,
            alias
          };
        });
        
        console.log('Aliases to insert:', aliases);
        
        // Insert aliases
        const { data: insertResult, error: insertError } = await supabase
          .from('contractor_aliases')
          .insert(aliases)
          .select();
        
        if (insertError) {
          console.error('Error inserting aliases:', insertError.message);
        } else {
          console.log('Successfully inserted aliases:', insertResult);
        }
      }
    }

    // Test 6: Verify the final state of aliases
    console.log('\n6. Final state of contractor aliases:');
    const { data: finalAliases, error: finalError } = await supabase
      .from('contractor_aliases')
      .select('*')
      .eq('project_id', projectId);
    
    if (finalError) {
      console.error('Error getting final aliases:', finalError.message);
    } else {
      console.log(`Found ${finalAliases.length} aliases for this project`);
      if (finalAliases.length > 0) {
        console.table(finalAliases);
      }
    }

  } catch (error) {
    console.error('Unexpected error during testing:', error.message);
  }
}

testContractorAliases();
