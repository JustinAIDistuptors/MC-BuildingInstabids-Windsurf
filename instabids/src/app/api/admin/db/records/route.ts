/**
 * Administrative API routes for database record operations
 * These routes handle CRUD operations on table records
 */
import { NextRequest, NextResponse } from 'next/server';
import * as adminDB from '@/lib/supabase/admin';

/**
 * Insert records into a table
 * POST /api/admin/db/records
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, data } = body;
    
    if (!table || !data) {
      return NextResponse.json(
        { error: 'Table name and data are required' },
        { status: 400 }
      );
    }
    
    const { data: result, error } = await adminDB.insertData(table, data);
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error inserting data' },
      { status: 500 }
    );
  }
}

/**
 * Update records in a table
 * PUT /api/admin/db/records
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, data, filters } = body;
    
    if (!table || !data || !filters) {
      return NextResponse.json(
        { error: 'Table name, data, and filters are required' },
        { status: 400 }
      );
    }
    
    const { data: result, error } = await adminDB.updateData(table, data, filters);
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error updating data' },
      { status: 500 }
    );
  }
}

/**
 * Delete records from a table
 * DELETE /api/admin/db/records
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, filters } = body;
    
    if (!table || !filters) {
      return NextResponse.json(
        { error: 'Table name and filters are required' },
        { status: 400 }
      );
    }
    
    const { data: result, error } = await adminDB.deleteData(table, filters);
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error deleting data' },
      { status: 500 }
    );
  }
}
