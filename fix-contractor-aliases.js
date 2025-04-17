// fix-contractor-aliases.js
// This script fixes contractor aliases for a specific project
// It ensures each contractor gets a unique alias (A, B, C, etc.)

const { createClient } = require('@supabase/supabase-js');

// Supabase connection details
const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

// Project ID to fix
const projectId = '0e2447bd-519c-4ab6-92a2-d795b9221cb6';

async function fixContractorAliases() {
  console.log(`Fixing contractor aliases for project: ${projectId}`);
  
  try {
    // Step 1: Get all contractors who have interacted with this project
    const contractorInteractions = [];
    
    // Get contractors from bids
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select('contractor_id, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (bidsError) {
      console.error('Error getting bids:', bidsError);
    } else if (bids && bids.length > 0) {
      console.log(`Found ${bids.length} bids`);
      bids.forEach(bid => {
        contractorInteractions.push({
          contractorId: bid.contractor_id,
          timestamp: bid.created_at
        });
      });
    }
    
    // Get contractors from messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('sender_id, created_at')
      .eq('project_id', projectId)
      .not('sender_id', 'is', null)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error('Error getting messages:', messagesError);
    } else if (messages && messages.length > 0) {
      console.log(`Found ${messages.length} messages`);
      messages.forEach(message => {
        contractorInteractions.push({
          contractorId: message.sender_id,
          timestamp: message.created_at
        });
      });
    }
    
    // No interactions found
    if (contractorInteractions.length === 0) {
      console.log('No contractor interactions found for this project');
      return;
    }
    
    // Sort interactions by timestamp (earliest first)
    contractorInteractions.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    // Get unique contractor IDs while preserving order (first interaction)
    const uniqueContractorIds = [];
    contractorInteractions.forEach(interaction => {
      if (!uniqueContractorIds.includes(interaction.contractorId)) {
        uniqueContractorIds.push(interaction.contractorId);
      }
    });
    
    console.log('Unique contractor IDs in order of first interaction:', uniqueContractorIds);
    
    // Step 2: Get existing aliases for this project
    const { data: existingAliases, error: aliasError } = await supabase
      .from('contractor_aliases')
      .select('id, contractor_id, alias')
      .eq('project_id', projectId);
    
    if (aliasError) {
      console.error('Error getting existing aliases:', aliasError);
      return;
    }
    
    console.log('Existing aliases:', existingAliases);
    
    // Create a map of existing aliases
    const existingAliasMap = new Map();
    if (existingAliases && existingAliases.length > 0) {
      existingAliases.forEach(alias => {
        existingAliasMap.set(alias.contractor_id, {
          id: alias.id,
          alias: alias.alias
        });
      });
    }
    
    // Step 3: Delete any incorrect aliases
    const deletePromises = [];
    existingAliases.forEach(alias => {
      // If the contractor ID is not in our unique list, delete the alias
      if (!uniqueContractorIds.includes(alias.contractor_id)) {
        console.log(`Deleting invalid alias for contractor ${alias.contractor_id}`);
        deletePromises.push(
          supabase
            .from('contractor_aliases')
            .delete()
            .eq('id', alias.id)
        );
      }
    });
    
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`Deleted ${deletePromises.length} invalid aliases`);
    }
    
    // Step 4: Assign aliases to contractors who don't have them
    const contractorsNeedingAliases = uniqueContractorIds.filter(
      id => !existingAliasMap.has(id)
    );
    
    console.log('Contractors needing aliases:', contractorsNeedingAliases);
    
    if (contractorsNeedingAliases.length > 0) {
      // Find the highest existing alias letter to start from
      let highestAlias = 64; // ASCII before 'A'
      existingAliasMap.forEach(({ alias }) => {
        const aliasCode = alias.charCodeAt(0);
        if (aliasCode > highestAlias) {
          highestAlias = aliasCode;
        }
      });
      
      // Create new aliases for contractors that don't have them
      const newAliases = contractorsNeedingAliases.map((contractorId, index) => {
        // Start assigning from the next letter after the highest existing alias
        const alias = String.fromCharCode(highestAlias + 1 + index);
        return {
          project_id: projectId,
          contractor_id: contractorId,
          alias
        };
      });
      
      console.log('New aliases to insert:', newAliases);
      
      if (newAliases.length > 0) {
        const { error: insertError } = await supabase
          .from('contractor_aliases')
          .insert(newAliases);
        
        if (insertError) {
          console.error('Error inserting aliases:', insertError);
        } else {
          console.log(`Successfully inserted ${newAliases.length} new aliases`);
        }
      }
    }
    
    // Step 5: Verify all contractors now have aliases
    const { data: finalAliases, error: finalError } = await supabase
      .from('contractor_aliases')
      .select('contractor_id, alias')
      .eq('project_id', projectId);
    
    if (finalError) {
      console.error('Error getting final aliases:', finalError);
    } else {
      console.log('Final aliases:', finalAliases);
      
      // Check if all contractors have aliases
      const missingContractors = uniqueContractorIds.filter(
        id => !finalAliases.some(a => a.contractor_id === id)
      );
      
      if (missingContractors.length > 0) {
        console.error('Some contractors are still missing aliases:', missingContractors);
      } else {
        console.log('All contractors now have aliases!');
      }
    }
    
    console.log('Contractor alias fix completed successfully');
  } catch (error) {
    console.error('Error fixing contractor aliases:', error);
  }
}

// Run the fix
fixContractorAliases()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));
