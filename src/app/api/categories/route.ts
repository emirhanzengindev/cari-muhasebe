import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error } = await supabase
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
    console.log('API HIT: categories');
    
    const categoryData = await request.json();
    console.log('BODY:', categoryData);
    
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    console.log('TENANT ID:', tenantId);
    
    const categoryWithTenant = {
      ...categoryData,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('CATEGORY WITH TENANT:', categoryWithTenant);
    
    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryWithTenant])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('SUCCESS DATA:', data);
    return Response.json(data[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}