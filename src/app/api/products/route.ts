import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    // Get tenant ID from headers or session
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API HIT: products');
    
    const productData = await request.json();
    console.log('BODY:', productData);
    
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    console.log('TENANT ID:', tenantId);
    
    // Add tenant ID to the product data
    const productWithTenant = {
      ...productData,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('PRODUCT WITH TENANT:', productWithTenant);
    
    // Validate required fields
    if (!productWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Product name is required' }, { status: 400 });
    }
    
    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error } = await supabase
      .from('products')
      .insert([productWithTenant])
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

    console.log('SUCCESS DATA:', data);
    return Response.json(data[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}