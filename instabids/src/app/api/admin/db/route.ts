/**
 * Administrative API routes for database operations
 * These routes provide a server-side interface for database management
 * IMPORTANT: In production, these should be protected with proper authentication
 */
import { NextRequest, NextResponse } from 'next/server';
import * as adminDB from '@/lib/supabase/admin';

/**
 * Execute a SQL query
 * POST /api/admin/db/sql
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, params } = body;
    
    if (!sql) {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }
    
    const { data, error } = await adminDB.executeSQL(sql, params);
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error executing SQL' },
      { status: 500 }
    );
  }
}

/**
 * Get database schema information
 * GET /api/admin/db/schema
 */
export async function GET(request: NextRequest) {
  try {
    // Parse the URL to check for specific operations
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    
    // Handle different operations
    switch (operation) {
      case 'schema':
        // Get the database schema
        const { data: schema, error: schemaError } = await adminDB.getDatabaseSchema();
        
        if (schemaError) {
          return NextResponse.json(
            { error: schemaError },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ data: schema });
        
      case 'tables':
        // List all tables
        const { data: tables, error: tablesError } = await adminDB.listTables();
        
        if (tablesError) {
          return NextResponse.json(
            { error: tablesError },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ data: tables });
        
      case 'table-data':
        // Get data from a specific table
        const table = searchParams.get('table');
        const columns = searchParams.get('columns') || '*';
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
        const orderBy = searchParams.get('orderBy') || undefined;
        
        if (!table) {
          return NextResponse.json(
            { error: 'Table name is required' },
            { status: 400 }
          );
        }
        
        const { data: tableData, error: tableError } = await adminDB.getTableData(table, {
          columns,
          limit,
          offset,
          orderBy,
        });
        
        if (tableError) {
          return NextResponse.json(
            { error: tableError },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ data: tableData });
        
      default:
        // Default to returning schema info
        const { data: defaultSchema, error: defaultError } = await adminDB.getDatabaseSchema();
        
        if (defaultError) {
          return NextResponse.json(
            { error: defaultError },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ data: defaultSchema });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error accessing database information' },
      { status: 500 }
    );
  }
}
