#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bodyParser = require('body-parser');

// Configuration with the provided credentials
const PORT = 4567;
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjI3NjMsImV4cCI6MjA1OTQzODc2M30.5Ew9RyW6umw_xB-mubmcp30Qo9eWOQ8J4fuk8li7yzo';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    supabaseUrl: SUPABASE_URL,
    endpoints: [
      '/tables',
      '/table/:tableName',
      '/query',
      '/insert',
      '/update',
      '/delete',
      '/rpc/:functionName'
    ]
  });
});

// List all tables
app.get('/tables', async (req, res) => {
  try {
    // Information schema is not directly accessible via the Supabase client
    // Use a raw query instead
    const { data, error } = await supabase.rpc('list_tables');
    
    if (error) {
      // If RPC function doesn't exist, try a direct query
      console.error('Error using RPC function, trying direct query:', error);
      
      // Try to query using the REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_SERVICE_ROLE_KEY}`);
      if (!response.ok) {
        throw new Error(`Failed to get tables: ${response.statusText}`);
      }
      
      const tables = await response.json();
      console.log(`Found ${tables.length} tables via REST API`);
      return res.json({ tables: tables.map(t => t.name) });
    }
    
    console.log(`Found ${data.length} tables via RPC`);
    res.json({ tables: data });
  } catch (error) {
    console.error('Error listing tables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get table structure
app.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Create a describe_table function call
    const { data, error } = await supabase.rpc('describe_table', { 
      table_name: tableName 
    });
    
    if (error) {
      console.error(`Error getting structure for table ${tableName}:`, error);
      
      // Try to get table structure using a direct query to the table
      try {
        // Query a single row to get column names
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (sampleError) {
          return res.status(500).json({ error: sampleError.message });
        }
        
        if (sampleData && sampleData.length > 0) {
          // Extract column names from the sample data
          const columns = Object.keys(sampleData[0]).map(column_name => ({
            column_name,
            data_type: typeof sampleData[0][column_name],
            is_nullable: 'UNKNOWN',
            column_default: null
          }));
          
          console.log(`Retrieved structure for table ${tableName} via sample data`);
          return res.json({ columns });
        } else {
          // Table exists but is empty, try to get columns from an empty select
          const { error: emptyError } = await supabase
            .from(tableName)
            .select();
            
          if (emptyError) {
            return res.status(500).json({ error: emptyError.message });
          }
          
          console.log(`Table ${tableName} exists but couldn't determine structure`);
          return res.json({ columns: [], message: 'Table exists but structure could not be determined' });
        }
      } catch (directError) {
        console.error(`Error with direct query for table ${tableName}:`, directError);
        return res.status(500).json({ error: directError.message });
      }
    }
    
    console.log(`Retrieved structure for table ${tableName}`);
    res.json({ columns: data });
  } catch (error) {
    console.error('Error getting table structure:', error);
    res.status(500).json({ error: error.message });
  }
});

// Query data
app.post('/query', async (req, res) => {
  try {
    const { table, select = '*', filters = {}, limit = 100, offset = 0, order } = req.body;
    
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }
    
    console.log(`Querying table '${table}'`);
    
    // Build the query
    let query = supabase
      .from(table)
      .select(select)
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // Apply filters
    Object.entries(filters).forEach(([column, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle operators like gt, lt, etc.
        const operator = Object.keys(value)[0];
        const operand = value[operator];
        
        switch (operator) {
          case 'gt':
            query = query.gt(column, operand);
            break;
          case 'gte':
            query = query.gte(column, operand);
            break;
          case 'lt':
            query = query.lt(column, operand);
            break;
          case 'lte':
            query = query.lte(column, operand);
            break;
          case 'neq':
            query = query.neq(column, operand);
            break;
          case 'like':
            query = query.like(column, operand);
            break;
          case 'ilike':
            query = query.ilike(column, operand);
            break;
          case 'in':
            query = query.in(column, operand);
            break;
          default:
            console.warn(`Unsupported operator: ${operator}`);
        }
      } else {
        // Simple equality
        query = query.eq(column, value);
      }
    });
    
    // Apply ordering
    if (order) {
      const { column, ascending = true } = order;
      query = query.order(column, { ascending });
    }
    
    // Execute the query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Query error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`Query successful, returned ${data.length} rows`);
    res.json({ data, count });
  } catch (error) {
    console.error('Error querying data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Insert data
app.post('/insert', async (req, res) => {
  try {
    const { table, data } = req.body;
    
    if (!table || !data) {
      return res.status(400).json({ error: 'Table name and data are required' });
    }
    
    console.log(`Inserting data into table '${table}'`);
    
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) {
      console.error('Error inserting data:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`Data inserted successfully into table '${table}'`);
    res.json({ data: result });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update data
app.post('/update', async (req, res) => {
  try {
    const { table, data, match } = req.body;
    
    if (!table || !data || !match) {
      return res.status(400).json({ error: 'Table name, data, and match conditions are required' });
    }
    
    console.log(`Updating data in table '${table}'`);
    
    // Build the update query
    let query = supabase.from(table).update(data);
    
    // Apply match conditions
    Object.entries(match).forEach(([column, value]) => {
      query = query.eq(column, value);
    });
    
    // Execute the query
    const { data: result, error } = await query.select();
    
    if (error) {
      console.error('Error updating data:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`Data updated successfully in table '${table}'`);
    res.json({ data: result });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete data
app.post('/delete', async (req, res) => {
  try {
    const { table, match } = req.body;
    
    if (!table || !match) {
      return res.status(400).json({ error: 'Table name and match conditions are required' });
    }
    
    console.log(`Deleting data from table '${table}'`);
    
    // Build the delete query
    let query = supabase.from(table).delete();
    
    // Apply match conditions
    Object.entries(match).forEach(([column, value]) => {
      query = query.eq(column, value);
    });
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error deleting data:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`Data deleted successfully from table '${table}'`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Call RPC function
app.post('/rpc/:functionName', async (req, res) => {
  try {
    const { functionName } = req.params;
    const params = req.body;
    
    console.log(`Calling RPC function '${functionName}'`);
    
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`Error calling RPC function '${functionName}':`, error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`RPC function '${functionName}' called successfully`);
    res.json({ data });
  } catch (error) {
    console.error('Error calling RPC function:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Supabase MCP Server running at http://localhost:${PORT}/`);
  console.log(`Connected to Supabase URL: ${SUPABASE_URL}`);
  console.log('Server is ready to accept connections');
});

// Handle errors to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
