// Script to create necessary SQL functions in Supabase
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

async function createSqlFunctions() {
  console.log('Creating necessary SQL functions in Supabase...');
  
  try {
    // 1. Create execute_sql function
    console.log('\n1. Creating execute_sql function...');
    
    const { data: executeSqlResult, error: executeSqlError } = await supabase
      .rpc('create_execute_sql_function');
    
    if (executeSqlError) {
      console.error('Error creating execute_sql function:', executeSqlError);
      
      // Try direct SQL approach
      console.log('Attempting direct SQL creation...');
      
      // This is a special case - we need to create this function using the REST API
      // because we can't call a function that doesn't exist yet
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/create_execute_sql_function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to create execute_sql function via REST API:', await response.text());
        
        console.log('Creating execute_sql function using direct SQL...');
        // Create the function using direct SQL through the Supabase API
        const sqlQuery = `
          CREATE OR REPLACE FUNCTION execute_sql(sql text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$;
        `;
        
        // We'll use the REST API to execute this SQL directly
        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: sqlQuery })
        });
        
        if (!sqlResponse.ok) {
          console.error('Failed to create execute_sql function via direct SQL:', await sqlResponse.text());
        } else {
          console.log('execute_sql function created successfully via direct SQL!');
        }
      } else {
        console.log('execute_sql function created successfully via REST API!');
      }
    } else {
      console.log('execute_sql function created or already exists.');
    }
    
    // 2. Create describe_table function
    console.log('\n2. Creating describe_table function...');
    
    const { error: describeTableError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION describe_table(table_name text)
        RETURNS TABLE(column_name text, data_type text, is_nullable text)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY EXECUTE format('
            SELECT column_name::text, data_type::text, is_nullable::text
            FROM information_schema.columns
            WHERE table_name = %L
            ORDER BY ordinal_position
          ', table_name);
        END;
        $$;
      `
    });
    
    if (describeTableError) {
      console.error('Error creating describe_table function:', describeTableError);
    } else {
      console.log('describe_table function created successfully!');
    }
    
    // 3. Create list_tables function
    console.log('\n3. Creating list_tables function...');
    
    const { error: listTablesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION list_tables()
        RETURNS TABLE(table_name text)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY EXECUTE '
            SELECT table_name::text
            FROM information_schema.tables
            WHERE table_schema = ''public''
            ORDER BY table_name
          ';
        END;
        $$;
      `
    });
    
    if (listTablesError) {
      console.error('Error creating list_tables function:', listTablesError);
    } else {
      console.log('list_tables function created successfully!');
    }
    
    console.log('\nSQL functions creation completed!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
createSqlFunctions();
