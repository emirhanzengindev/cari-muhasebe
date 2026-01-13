import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('SUPABASE ERROR DETAILS (GET):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const warehouseData = await request.json();
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    const warehouseWithTenant = {
      ...warehouseData,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Validate required fields
    if (!warehouseWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Warehouse name is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient(tenantId);
    
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

    return Response.json(data[0]);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}