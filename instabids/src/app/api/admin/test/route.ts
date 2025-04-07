/**
 * Test endpoint to demonstrate database capabilities
 * This endpoint creates a test table in Supabase and returns the result
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// For demonstration only - in production, use environment variables
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

export async function GET() {
  try {
    // Create a Supabase client with admin privileges
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Step 1: First check if our test table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'cascade_test_table');
    
    if (tableCheckError) {
      console.error('Error checking table:', tableCheckError);
      return NextResponse.json({ error: tableCheckError.message }, { status: 500 });
    }
    
    // Step 2: Create the test table if it doesn't exist
    if (!tableExists || tableExists.length === 0) {
      // Use RPC to execute raw SQL (creating a table)
      const createTableSQL = `
        CREATE TABLE public.cascade_test_table (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `;
      
      const { error: createError } = await supabase.rpc('execute_sql', { 
        query: createTableSQL 
      });
      
      if (createError) {
        // Try an alternative approach if the RPC fails
        try {
          await supabase.query(createTableSQL);
        } catch (directError: any) {
          console.error('Error creating table:', directError);
          return NextResponse.json({ 
            error: 'Failed to create table', 
            details: directError.message || createError.message 
          }, { status: 500 });
        }
      }
      
      // Insert a test record
      const { data: insertData, error: insertError } = await supabase
        .from('cascade_test_table')
        .insert({
          name: 'Test Entry',
          description: 'Created by Cascade to demonstrate database capabilities'
        })
        .select();
      
      if (insertError) {
        console.error('Error inserting data:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Table created and test data inserted successfully',
        data: insertData
      });
    } else {
      // Table already exists, let's query it
      const { data: rows, error: queryError } = await supabase
        .from('cascade_test_table')
        .select('*');
      
      if (queryError) {
        console.error('Error querying table:', queryError);
        return NextResponse.json({ error: queryError.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Table already exists',
        data: rows
      });
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error.message 
    }, { status: 500 });
  }
}
