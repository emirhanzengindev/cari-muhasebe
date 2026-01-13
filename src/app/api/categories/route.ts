import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const { data, error } = await supabaseServer
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const categoryData = await request.json();
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const categoryWithTenant = {
      ...categoryData,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseServer
      .from('categories')
      .insert([categoryWithTenant])
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}