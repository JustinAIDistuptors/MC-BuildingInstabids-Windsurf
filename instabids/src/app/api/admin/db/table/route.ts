/**
 * Administrative API routes for table management
 * These routes handle CRUD operations on database tables
 */
import { NextRequest, NextResponse } from 'next/server';
import * as adminDB from '@/lib/supabase/admin';

/**
 * Create a new table in the database
 * POST /api/admin/db/table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, columns } = body;
    
    if (!tableName || !columns) {
      return NextResponse.json(
        { error: 'Table name and columns are required' },
        { status: 400 }
      );
    }
    
    const { data, error } = await adminDB.createTable(tableName, columns);
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, message: `Table ${tableName} created successfully` });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error creating table' },
      { status: 500 }
    );
  }
}

/**
 * Get table data
 * GET /api/admin/db/table?name=table_name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('name');
    
    if (!tableName) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      );
    }
    
    const columns = searchParams.get('columns') || '*';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const orderBy = searchParams.get('orderBy') || undefined;
    
    const { data, error } = await adminDB.getTableData(tableName, {
      columns,
      limit,
      offset,
      orderBy,
    });
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error fetching table data' },
      { status: 500 }
    );
  }
}
