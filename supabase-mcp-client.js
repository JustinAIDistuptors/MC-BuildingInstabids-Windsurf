// Supabase MCP Client
// This file provides functions to interact with the Supabase MCP server

const MCP_SERVER_URL = 'http://localhost:4567';

/**
 * Execute a SQL query on the Supabase database
 * @param {string} sql - The SQL query to execute
 * @returns {Promise<object>} - The result of the query
 */
async function executeSql(sql) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to execute SQL: ${errorData.error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

/**
 * Query a table in the Supabase database
 * @param {string} table - The table to query
 * @param {object} query - Query parameters
 * @returns {Promise<object>} - The result of the query
 */
async function queryTable(table, query = {}) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/query-table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table, query }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to query table: ${errorData.error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error querying table:', error);
    throw error;
  }
}

/**
 * Create a table in the Supabase database
 * @param {string} table - The table to create
 * @param {object} schema - The schema definition
 * @returns {Promise<object>} - The result of the operation
 */
async function createTable(table, schema) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/create-table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table, schema }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create table: ${errorData.error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
}

/**
 * Insert data into a table in the Supabase database
 * @param {string} table - The table to insert into
 * @param {object|array} data - The data to insert
 * @returns {Promise<object>} - The result of the operation
 */
async function insertData(table, data) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/insert-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table, data }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to insert data: ${errorData.error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error inserting data:', error);
    throw error;
  }
}

/**
 * Update data in a table in the Supabase database
 * @param {string} table - The table to update
 * @param {object} data - The data to update
 * @param {object} condition - The condition for the update
 * @returns {Promise<object>} - The result of the operation
 */
async function updateData(table, data, condition) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/update-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table, data, condition }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update data: ${errorData.error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
}

/**
 * Delete data from a table in the Supabase database
 * @param {string} table - The table to delete from
 * @param {object} condition - The condition for the deletion
 * @returns {Promise<object>} - The result of the operation
 */
async function deleteData(table, condition) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/delete-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table, condition }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to delete data: ${errorData.error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting data:', error);
    throw error;
  }
}

// Export all functions
module.exports = {
  executeSql,
  queryTable,
  createTable,
  insertData,
  updateData,
  deleteData,
};
