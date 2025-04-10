// Test script to diagnose messaging issues
import { createClient } from '@/lib/supabase/client';

async function testMessagingSystem() {
  const supabase = createClient();
  
  console.log('=== MESSAGING SYSTEM DIAGNOSTIC TEST ===');
  
  // 1. Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error('❌ No authenticated user found. Please log in first.');
    return;
  }
  console.log('✅ Authenticated as:', session.user.email);
  console.log('User ID:', session.user.id);
  
  // 2. List available projects
  console.log('\n=== PROJECTS ===');
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, homeowner_id')
    .limit(5);
    
  if (projectsError) {
    console.error('❌ Error fetching projects:', projectsError);
  } else if (!projects || projects.length === 0) {
    console.log('❌ No projects found. Try querying bidding.bid_cards instead.');
    
    // Try alternative table
    const { data: bidCards, error: bidCardsError } = await supabase
      .from('bidding.bid_cards')
      .select('id, title, creator_id')
      .limit(5);
      
    if (bidCardsError) {
      console.error('❌ Error fetching bid cards:', bidCardsError);
    } else if (!bidCards || bidCards.length === 0) {
      console.log('❌ No bid cards found either.');
    } else {
      console.log('✅ Found bid cards:', bidCards);
      
      // Test with the first bid card
      if (bidCards[0]) {
        await testWithProject(bidCards[0].id, 'bid_card');
      }
    }
  } else {
    console.log('✅ Found projects:', projects);
    
    // Test with the first project
    if (projects[0]) {
      await testWithProject(projects[0].id, 'project');
    }
  }
}

async function testWithProject(projectId: string, type: 'project' | 'bid_card') {
  const supabase = createClient();
  console.log(`\n=== TESTING WITH ${type.toUpperCase()} ID: ${projectId} ===`);
  
  // 1. Check for bids on this project
  console.log('\n=== BIDS ===');
  const { data: bids, error: bidsError } = await supabase
    .from('bids')
    .select(`
      id, 
      amount, 
      status, 
      contractor_id,
      project_id,
      profiles:contractor_id (
        id,
        full_name,
        company_name,
        avatar_url
      )
    `)
    .eq(type === 'project' ? 'project_id' : 'bid_card_id', projectId);
    
  if (bidsError) {
    console.error(`❌ Error fetching bids for ${type}:`, bidsError);
    
    // Try alternative field name
    const altFieldName = type === 'project' ? 'bid_card_id' : 'project_id';
    const { data: altBids, error: altBidsError } = await supabase
      .from('bids')
      .select(`
        id, 
        amount, 
        status, 
        contractor_id,
        ${altFieldName},
        profiles:contractor_id (
          id,
          full_name,
          company_name,
          avatar_url
        )
      `)
      .eq(altFieldName, projectId);
      
    if (altBidsError) {
      console.error(`❌ Error fetching bids with alternative field name:`, altBidsError);
    } else if (!altBids || altBids.length === 0) {
      console.log(`❌ No bids found with alternative field name either.`);
    } else {
      console.log(`✅ Found bids using ${altFieldName}:`, altBids);
      
      // Test messages with the first contractor
      if (altBids[0] && altBids[0].contractor_id) {
        await testMessages(projectId, altBids[0].contractor_id);
      }
    }
  } else if (!bids || bids.length === 0) {
    console.log(`❌ No bids found for this ${type}.`);
  } else {
    console.log(`✅ Found bids:`, bids);
    
    // Test messages with the first contractor
    if (bids[0] && bids[0].contractor_id) {
      await testMessages(projectId, bids[0].contractor_id);
    }
  }
}

async function testMessages(projectId: string, contractorId: string) {
  const supabase = createClient();
  console.log(`\n=== MESSAGES between project ${projectId} and contractor ${contractorId} ===`);
  
  // Get current user
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;
  
  if (!currentUserId) {
    console.error('❌ No authenticated user found');
    return;
  }
  
  // Try different table names and field combinations
  const tableOptions = ['messages', 'messaging.messages'];
  const fieldOptions = ['project_id', 'bid_card_id'];
  
  let messagesFound = false;
  
  for (const table of tableOptions) {
    for (const field of fieldOptions) {
      console.log(`\nTrying table: ${table}, field: ${field}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(field, projectId)
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${contractorId}),and(sender_id.eq.${contractorId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error(`❌ Error with ${table}.${field}:`, error);
      } else if (!data || data.length === 0) {
        console.log(`❌ No messages found with ${table}.${field}`);
      } else {
        console.log(`✅ Found messages with ${table}.${field}:`, data);
        messagesFound = true;
      }
    }
  }
  
  if (!messagesFound) {
    console.log('\n❌ No messages found with any combination. Creating a test message...');
    
    // Try to create a test message
    for (const table of tableOptions) {
      for (const field of fieldOptions) {
        console.log(`\nTrying to create message with table: ${table}, field: ${field}`);
        
        const { data, error } = await supabase
          .from(table)
          .insert({
            [field]: projectId,
            sender_id: currentUserId,
            recipient_id: contractorId,
            content: 'Test message from diagnostic script'
          })
          .select();
          
        if (error) {
          console.error(`❌ Error creating message with ${table}.${field}:`, error);
        } else {
          console.log(`✅ Successfully created message with ${table}.${field}:`, data);
        }
      }
    }
  }
}

// Run the test
testMessagingSystem().catch(console.error);
