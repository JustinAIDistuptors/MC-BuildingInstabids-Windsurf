#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bodyParser = require('body-parser');

// Configuration
const PORT = 4567; // Random port as requested
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
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    supabaseUrl: SUPABASE_URL,
    endpoints: [
      '/execute-sql',
      '/query-table',
      '/create-table',
      '/insert-data',
      '/update-data',
      '/delete-data',
      '/execute-migration',
      '/check-table-exists',
      '/create-schema'
    ]
  });
});

// Execute raw SQL
app.post('/execute-sql', async (req, res) => {
  try {
    const { sql, params } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: sql,
      params: params || {}
    });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ result: data });
  } catch (error) {
    console.error('Error executing SQL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Query a table
app.post('/query-table', async (req, res) => {
  try {
    const { table, select, filters, order, limit, offset } = req.body;
    
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }
    
    let query = supabase.from(table).select(select || '*');
    
    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([column, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle operators like gt, lt, etc.
          const [operator, operand] = Object.entries(value)[0];
          query = query.filter(column, operator, operand);
        } else {
          // Simple equality
          query = query.eq(column, value);
        }
      });
    }
    
    // Apply ordering
    if (order) {
      const { column, ascending } = order;
      query = query.order(column, { ascending: ascending !== false });
    }
    
    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }
    
    if (offset) {
      query = query.offset(offset);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ data, count });
  } catch (error) {
    console.error('Error querying table:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a table
app.post('/create-table', async (req, res) => {
  try {
    const { table, schema } = req.body;
    
    if (!table || !schema) {
      return res.status(400).json({ error: 'Table name and schema are required' });
    }
    
    // Generate SQL for table creation
    let sql = `CREATE TABLE IF NOT EXISTS ${table} (\n`;
    
    // Add columns
    const columns = Object.entries(schema.columns).map(([name, def]) => {
      return `  ${name} ${def}`;
    });
    
    sql += columns.join(',\n');
    
    // Add primary key
    if (schema.primaryKey) {
      if (Array.isArray(schema.primaryKey)) {
        sql += `,\n  PRIMARY KEY (${schema.primaryKey.join(', ')})`;
      } else {
        sql += `,\n  PRIMARY KEY (${schema.primaryKey})`;
      }
    }
    
    // Add foreign keys
    if (schema.foreignKeys) {
      schema.foreignKeys.forEach(fk => {
        sql += `,\n  FOREIGN KEY (${fk.column}) REFERENCES ${fk.references}(${fk.referencedColumn})`;
        if (fk.onDelete) {
          sql += ` ON DELETE ${fk.onDelete}`;
        }
        if (fk.onUpdate) {
          sql += ` ON UPDATE ${fk.onUpdate}`;
        }
      });
    }
    
    // Close the statement
    sql += '\n);';
    
    // Add indexes
    if (schema.indexes) {
      schema.indexes.forEach(index => {
        sql += `\nCREATE INDEX IF NOT EXISTS idx_${table}_${index.columns.join('_')} ON ${table}(${index.columns.join(', ')});`;
      });
    }
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: sql
    });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, message: `Table ${table} created successfully` });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: error.message });
  }
});

// Insert data
app.post('/insert-data', async (req, res) => {
  try {
    const { table, data } = req.body;
    
    if (!table || !data) {
      return res.status(400).json({ error: 'Table name and data are required' });
    }
    
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update data
app.post('/update-data', async (req, res) => {
  try {
    const { table, data, match } = req.body;
    
    if (!table || !data || !match) {
      return res.status(400).json({ error: 'Table name, data, and match condition are required' });
    }
    
    let query = supabase.from(table).update(data);
    
    // Apply match conditions
    Object.entries(match).forEach(([column, value]) => {
      query = query.eq(column, value);
    });
    
    const { data: result, error } = await query.select();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete data
app.post('/delete-data', async (req, res) => {
  try {
    const { table, match } = req.body;
    
    if (!table || !match) {
      return res.status(400).json({ error: 'Table name and match condition are required' });
    }
    
    let query = supabase.from(table).delete();
    
    // Apply match conditions
    Object.entries(match).forEach(([column, value]) => {
      query = query.eq(column, value);
    });
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute a migration script
app.post('/execute-migration', async (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL migration script is required' });
    }
    
    // Split the SQL into statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    const results = [];
    
    // Execute each statement
    for (const statement of statements) {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_string: statement + ';'
      });
      
      if (error) {
        results.push({ statement, success: false, error: error.message });
      } else {
        results.push({ statement, success: true });
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error executing migration:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if a table exists
app.post('/check-table-exists', async (req, res) => {
  try {
    const { table } = req.body;
    
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }
    
    // Split schema and table name
    const parts = table.split('.');
    const schemaName = parts.length > 1 ? parts[0] : 'public';
    const tableName = parts.length > 1 ? parts[1] : parts[0];
    
    const sql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
        AND table_name = '${tableName}'
      );
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: sql
    });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    const exists = data && data[0] && data[0].exists;
    
    res.json({ exists });
  } catch (error) {
    console.error('Error checking if table exists:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a schema
app.post('/create-schema', async (req, res) => {
  try {
    const { schema } = req.body;
    
    if (!schema) {
      return res.status(400).json({ error: 'Schema name is required' });
    }
    
    const sql = `CREATE SCHEMA IF NOT EXISTS ${schema};`;
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: sql
    });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, message: `Schema ${schema} created successfully` });
  } catch (error) {
    console.error('Error creating schema:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Supabase MCP Server running at http://localhost:${PORT}/`);
  console.log('Supabase URL:', SUPABASE_URL);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down Supabase MCP Server');
  process.exit(0);
});
