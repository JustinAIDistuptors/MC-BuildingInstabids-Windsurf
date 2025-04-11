#!/usr/bin/env node

// Supabase MCP Client
// This file provides a reliable CLI to interact with the Supabase MCP server

const fetch = require('node-fetch');
const MCP_SERVER_URL = 'http://localhost:4567';

/**
 * Make a request to the MCP server
 * @param {string} endpoint - The endpoint to call
 * @param {string} method - The HTTP method to use
 * @param {object} body - The request body (for POST requests)
 * @returns {Promise<object>} - The response data
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    console.log(`Making ${method} request to ${endpoint}`);
    const response = await fetch(`${MCP_SERVER_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Check the server status
 * @returns {Promise<object>} - The server status
 */
async function checkServerStatus() {
  return makeRequest('/');
}

/**
 * List all tables in the database
 * @returns {Promise<object>} - The list of tables
 */
async function listTables() {
  return makeRequest('/tables');
}

/**
 * Describe a table's structure
 * @param {string} tableName - The name of the table to describe
 * @returns {Promise<object>} - The table structure
 */
async function describeTable(tableName) {
  return makeRequest(`/table/${tableName}`);
}

/**
 * Query a table
 * @param {string} table - The table to query
 * @param {string} select - The columns to select
 * @param {object} filters - Filter conditions
 * @param {number} limit - The maximum number of rows to return
 * @param {number} offset - The offset for pagination
 * @param {object} order - Ordering configuration
 * @returns {Promise<object>} - The query results
 */
async function queryTable(table, select = '*', filters = {}, limit = 100, offset = 0, order = null) {
  return makeRequest('/query', 'POST', { 
    table, 
    select, 
    filters, 
    limit, 
    offset, 
    order 
  });
}

/**
 * Insert data into a table
 * @param {string} table - The table to insert into
 * @param {object|array} data - The data to insert
 * @returns {Promise<object>} - The insert results
 */
async function insertData(table, data) {
  return makeRequest('/insert', 'POST', { table, data });
}

/**
 * Update data in a table
 * @param {string} table - The table to update
 * @param {object} data - The data to update
 * @param {object} match - The match conditions for the update
 * @returns {Promise<object>} - The update results
 */
async function updateData(table, data, match) {
  return makeRequest('/update', 'POST', { table, data, match });
}

/**
 * Delete data from a table
 * @param {string} table - The table to delete from
 * @param {object} match - The match conditions for the deletion
 * @returns {Promise<object>} - The delete results
 */
async function deleteData(table, match) {
  return makeRequest('/delete', 'POST', { table, match });
}

/**
 * Call an RPC function
 * @param {string} functionName - The name of the function to call
 * @param {object} params - The parameters to pass to the function
 * @returns {Promise<object>} - The function results
 */
async function callRpcFunction(functionName, params = {}) {
  return makeRequest(`/rpc/${functionName}`, 'POST', params);
}

/**
 * Print the results in a formatted way
 * @param {object} data - The data to print
 */
function printResults(data) {
  console.log(JSON.stringify(data, null, 2));
}

// Command line interface
async function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log(`
Supabase MCP Client

Usage:
  node supabase-mcp-client.js <command> [options]

Commands:
  status                    Check if the MCP server is running
  tables                    List all tables in the database
  table <name>              Describe the structure of a table
  query <table> [filters]   Query data from a table (JSON filters optional)
  insert <table> <data>     Insert data into a table (data as JSON)
  update <table> <data> <match>  Update data in a table (data and match as JSON)
  delete <table> <match>    Delete data from a table (match as JSON)
  rpc <function> [params]   Call an RPC function (params as JSON)
    `);
    return;
  }
  
  try {
    switch (command) {
      case 'status':
        const status = await checkServerStatus();
        console.log('Server status:');
        printResults(status);
        break;
        
      case 'tables':
        const tables = await listTables();
        console.log('Tables in database:');
        printResults(tables);
        break;
        
      case 'table':
        const tableName = process.argv[3];
        if (!tableName) {
          console.error('Error: Table name is required');
          return;
        }
        const tableInfo = await describeTable(tableName);
        console.log(`Structure of table '${tableName}':`);
        printResults(tableInfo);
        break;
        
      case 'query':
        const queryTableName = process.argv[3];
        if (!queryTableName) {
          console.error('Error: Table name is required');
          return;
        }
        
        let filters = {};
        if (process.argv[4]) {
          try {
            filters = JSON.parse(process.argv[4]);
          } catch (e) {
            console.error('Error: Filters must be valid JSON');
            return;
          }
        }
        
        const limit = process.argv[5] ? parseInt(process.argv[5]) : 100;
        const queryResult = await queryTable(queryTableName, '*', filters, limit);
        console.log(`Data from table '${queryTableName}' (limit ${limit}):`);
        printResults(queryResult);
        break;
        
      case 'insert':
        const insertTable = process.argv[3];
        const insertDataStr = process.argv[4];
        
        if (!insertTable || !insertDataStr) {
          console.error('Error: Table name and JSON data are required');
          return;
        }
        
        let insertData;
        try {
          insertData = JSON.parse(insertDataStr);
        } catch (e) {
          console.error('Error: Data must be valid JSON');
          return;
        }
        
        const insertResult = await insertData(insertTable, insertData);
        console.log('Insert result:');
        printResults(insertResult);
        break;
        
      case 'update':
        const updateTable = process.argv[3];
        const updateDataStr = process.argv[4];
        const updateMatchStr = process.argv[5];
        
        if (!updateTable || !updateDataStr || !updateMatchStr) {
          console.error('Error: Table name, data, and match conditions are required');
          return;
        }
        
        let updateData, updateMatch;
        try {
          updateData = JSON.parse(updateDataStr);
          updateMatch = JSON.parse(updateMatchStr);
        } catch (e) {
          console.error('Error: Data and match must be valid JSON');
          return;
        }
        
        const updateResult = await updateData(updateTable, updateData, updateMatch);
        console.log('Update result:');
        printResults(updateResult);
        break;
        
      case 'delete':
        const deleteTable = process.argv[3];
        const deleteMatchStr = process.argv[4];
        
        if (!deleteTable || !deleteMatchStr) {
          console.error('Error: Table name and match conditions are required');
          return;
        }
        
        let deleteMatch;
        try {
          deleteMatch = JSON.parse(deleteMatchStr);
        } catch (e) {
          console.error('Error: Match must be valid JSON');
          return;
        }
        
        const deleteResult = await deleteData(deleteTable, deleteMatch);
        console.log('Delete result:');
        printResults(deleteResult);
        break;
        
      case 'rpc':
        const functionName = process.argv[3];
        const paramsStr = process.argv[4] || '{}';
        
        if (!functionName) {
          console.error('Error: Function name is required');
          return;
        }
        
        let params;
        try {
          params = JSON.parse(paramsStr);
        } catch (e) {
          console.error('Error: Params must be valid JSON');
          return;
        }
        
        const rpcResult = await callRpcFunction(functionName, params);
        console.log(`RPC function '${functionName}' result:`);
        printResults(rpcResult);
        break;
        
      default:
        console.error(`Error: Unknown command '${command}'`);
        break;
    }
  } catch (error) {
    console.error('Error executing command:', error.message);
    process.exit(1);
  }
}

// Export functions for programmatic use
module.exports = {
  checkServerStatus,
  listTables,
  describeTable,
  queryTable,
  insertData,
  updateData,
  deleteData,
  callRpcFunction
};

// Run the CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
