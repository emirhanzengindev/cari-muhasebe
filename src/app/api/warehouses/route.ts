import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/warehouses called')

    const supabase = createServerSupabaseClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('DEBUG: Auth session missing')
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('tenant_id', user.id)

    if (error) {
      console.error('SUPABASE ERROR DETAILS (GET):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('DEBUG: Successfully fetched', data?.length || 0, 'warehouses');
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const warehouseData = await request.json();
    
    const supabase = createServerSupabaseClient();
    
    const {
      data: { user }
    } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    // Map camelCase fields to snake_case for database insertion
    const warehouseWithTenant: any = {};
    
    // Explicitly map each field to ensure no camelCase fields leak through
    if (warehouseData.name !== undefined) warehouseWithTenant.name = warehouseData.name;
    if (warehouseData.description !== undefined) warehouseWithTenant.description = warehouseData.description;
    if (warehouseData.location !== undefined) warehouseWithTenant.location = warehouseData.location;
    if (warehouseData.manager !== undefined) warehouseWithTenant.manager = warehouseData.manager;
    if (warehouseData.capacity !== undefined) warehouseWithTenant.capacity = warehouseData.capacity;
    if (warehouseData.isActive !== undefined) warehouseWithTenant.is_active = warehouseData.isActive;
    
    warehouseWithTenant.created_at = new Date().toISOString();
    warehouseWithTenant.updated_at = new Date().toISOString();
    warehouseWithTenant.tenant_id = user.id; // Set tenant_id from authenticated user
    
    // Validate required fields
    if (!warehouseWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Warehouse name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('warehouses')
      .insert([warehouseWithTenant])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR DETAILS:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}