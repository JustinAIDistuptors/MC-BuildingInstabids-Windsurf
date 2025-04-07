/**
 * Execute Database Schema Script
 * 
 * This script reads the SQL schema file and executes it against our Supabase instance
 * using the admin client with service role access.
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../lib/supabase/admin';

async function main() {
  try {
    // Read the SQL file
    const sqlFilePath = path.resolve(__dirname, 'create-database-schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📊 Reading SQL schema file...');
    
    // Split the SQL into individual statements
    // This simple split works for our specific schema but might need to be more robust for complex SQL
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // Use our admin client to execute the SQL
      const { error } = await supabaseAdmin.rpc('execute_sql', { 
        query: statement 
      });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Continue with other statements even if one fails
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('🎉 Database schema setup completed!');
    
    // Verify tables were created
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('_tables')
      .select('table_name')
      .in('table_name', ['profiles', 'projects', 'bids', 'messages', 'project_attachments']);
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    } else {
      console.log('Tables created:');
      console.table(tables);
    }
    
  } catch (error) {
    console.error('Error executing schema script:', error);
    process.exit(1);
  }
}

main();
