/**
 * Client-side utilities for interacting with the database admin API
 * These utilities provide a programmatic interface to the database
 */

/**
 * Execute a SQL query via the admin API
 */
export async function executeSQL(sql: string, params?: any[]) {
  const response = await fetch('/api/admin/db/sql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to execute SQL query');
  }
  
  return response.json();
}

/**
 * Get the database schema
 */
export async function getDatabaseSchema() {
  const response = await fetch('/api/admin/db/schema?operation=schema');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get database schema');
  }
  
  return response.json();
}

/**
 * List all tables in the database
 */
export async function listTables() {
  const response = await fetch('/api/admin/db/schema?operation=tables');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list tables');
  }
  
  return response.json();
}

/**
 * Get data from a table
 */
export async function getTableData(
  table: string,
  options: {
    columns?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
  } = {}
) {
  const { columns, limit, offset, orderBy } = options;
  
  // Build query string
  const params = new URLSearchParams();
  params.append('operation', 'table-data');
  params.append('table', table);
  
  if (columns) params.append('columns', columns);
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  if (orderBy) params.append('orderBy', orderBy);
  
  const response = await fetch(`/api/admin/db/schema?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get table data');
  }
  
  return response.json();
}

/**
 * Create a new table in the database
 */
export async function createTable(tableName: string, columns: Record<string, string>) {
  const response = await fetch('/api/admin/db/table', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tableName, columns }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create table');
  }
  
  return response.json();
}

/**
 * Insert data into a table
 */
export async function insertData(table: string, data: Record<string, any> | Record<string, any>[]) {
  const response = await fetch('/api/admin/db/records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ table, data }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to insert data');
  }
  
  return response.json();
}

/**
 * Update data in a table
 */
export async function updateData(
  table: string,
  data: Record<string, any>,
  filters: Record<string, any>
) {
  const response = await fetch('/api/admin/db/records', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ table, data, filters }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update data');
  }
  
  return response.json();
}

/**
 * Delete data from a table
 */
export async function deleteData(table: string, filters: Record<string, any>) {
  const response = await fetch('/api/admin/db/records', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ table, filters }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete data');
  }
  
  return response.json();
}
