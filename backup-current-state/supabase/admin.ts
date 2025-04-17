/**
 * Admin-level Supabase client with service role access
 * This allows for database operations that bypass RLS policies
 * ONLY FOR SERVER-SIDE USE - NEVER EXPOSE IN CLIENT CODE
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Admin operations will not work properly.'
  );
}

// Create a Supabase client with the service role key for full database access
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Execute raw SQL queries with admin privileges
 * This is powerful and should be used carefully
 */
export async function executeSQL(sqlQuery: string, params?: any[]) {
  try {
    const { data, error } = await supabaseAdmin.rpc('execute_sql', {
      query: sqlQuery,
      params: params || [],
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('SQL execution error:', error);
    return { data: null, error: error.message || 'Unknown error executing SQL' };
  }
}

/**
 * Get schema information for the database
 */
export async function getDatabaseSchema() {
  const query = `
    SELECT 
      t.table_name, 
      c.column_name, 
      c.data_type,
      c.is_nullable,
      c.column_default
    FROM 
      information_schema.tables t
    JOIN 
      information_schema.columns c 
      ON t.table_name = c.table_name
    WHERE 
      t.table_schema = 'public'
    ORDER BY 
      t.table_name, 
      c.ordinal_position;
  `;

  return executeSQL(query);
}

/**
 * List all tables in the database
 */
export async function listTables() {
  const query = `
    SELECT 
      table_name
    FROM 
      information_schema.tables 
    WHERE 
      table_schema = 'public'
    ORDER BY 
      table_name;
  `;

  return executeSQL(query);
}

/**
 * Create a new table in the database
 */
export async function createTable(tableName: string, columns: Record<string, string>) {
  // Convert columns object to SQL column definitions
  const columnDefinitions = Object.entries(columns)
    .map(([name, type]) => `"${name}" ${type}`)
    .join(', ');

  const query = `
    CREATE TABLE IF NOT EXISTS "public"."${tableName}" (
      ${columnDefinitions}
    );
  `;

  return executeSQL(query);
}

/**
 * Get all rows from a table with optional filters
 */
export async function getTableData(
  tableName: string,
  options: {
    columns?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    filters?: Record<string, any>;
  } = {}
) {
  try {
    const { columns = '*', limit, offset, orderBy, filters } = options;
    
    let query = supabaseAdmin.from(tableName).select(columns);
    
    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    // Apply pagination
    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);
    
    // Apply ordering
    if (orderBy) {
      const [column, direction] = orderBy.split(':');
      query = query.order(column, { ascending: direction !== 'desc' });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching table data:', error);
    return { data: null, error: error.message || 'Unknown error fetching table data' };
  }
}

/**
 * Insert data into a table
 */
export async function insertData(tableName: string, data: Record<string, any> | Record<string, any>[]) {
  try {
    const { data: result, error } = await supabaseAdmin
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) throw error;
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error inserting data:', error);
    return { data: null, error: error.message || 'Unknown error inserting data' };
  }
}

/**
 * Update data in a table
 */
export async function updateData(
  tableName: string,
  data: Record<string, any>,
  filters: Record<string, any>
) {
  try {
    let query = supabaseAdmin.from(tableName).update(data);
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data: result, error } = await query.select();
    
    if (error) throw error;
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error updating data:', error);
    return { data: null, error: error.message || 'Unknown error updating data' };
  }
}

/**
 * Delete data from a table
 */
export async function deleteData(tableName: string, filters: Record<string, any>) {
  try {
    let query = supabaseAdmin.from(tableName).delete();
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data: result, error } = await query.select();
    
    if (error) throw error;
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error deleting data:', error);
    return { data: null, error: error.message || 'Unknown error deleting data' };
  }
}

/**
 * Set up Row Level Security (RLS) policies for a table
 */
export async function setupRowLevelSecurity(
  tableName: string,
  {
    enableRLS = true,
    policies = [],
  }: {
    enableRLS?: boolean;
    policies?: Array<{
      name: string;
      action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
      definition: string;
      check?: string;
    }>;
  }
) {
  try {
    // Enable or disable RLS on the table
    const rlsQuery = `
      ALTER TABLE "public"."${tableName}" 
      ${enableRLS ? 'ENABLE' : 'DISABLE'} ROW LEVEL SECURITY;
    `;
    
    await executeSQL(rlsQuery);
    
    // Create policies
    for (const policy of policies) {
      const { name, action, definition, check } = policy;
      
      // First drop the policy if it exists to avoid conflicts
      const dropQuery = `
        DROP POLICY IF EXISTS "${name}" ON "public"."${tableName}";
      `;
      
      await executeSQL(dropQuery);
      
      // Create the new policy
      const createPolicyQuery = `
        CREATE POLICY "${name}" 
        ON "public"."${tableName}"
        FOR ${action}
        TO authenticated
        USING (${definition})
        ${check ? `WITH CHECK (${check})` : ''};
      `;
      
      await executeSQL(createPolicyQuery);
    }
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error setting up RLS:', error);
    return { success: false, error: error.message || 'Unknown error setting up RLS' };
  }
}
