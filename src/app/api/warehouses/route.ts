import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const { data, error } = await supabaseServer
      .from('warehouses')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
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
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const warehouseWithTenant = {
      ...warehouseData,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseServer
      .from('warehouses')
      .insert([warehouseWithTenant])
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data[0]);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}