export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClientWithRequest(request)

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

    const { data, error, status } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('tenant_id', user.id)  // Filter by authenticated user's tenant ID

    // If table doesn't exist, return empty array
    if (error && status === 404) {
      console.warn('Table invoice_items does not exist, returning empty array');
      return Response.json([]);
    }
    
    if (error) {
      console.error('SUPABASE ERROR (GET invoice_items):', error);
      // For other errors, return the error message
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching invoice items:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const invoiceItemData = await request.json();
    
    const supabase = createServerSupabaseClientWithRequest(request);
    
    const {
      data: { user }
    } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    const invoiceItemWithTenant = {
      ...invoiceItemData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: user.id  // Add tenant_id from authenticated user
    };
    
    // Validate required fields
    if (!invoiceItemWithTenant.invoice_id || !invoiceItemWithTenant.product_id) {
      console.error('MISSING REQUIRED FIELD: invoice_id or product_id');
      return Response.json({ error: 'Invoice ID and Product ID are required' }, { status: 400 });
    }

    const { data, error, status } = await supabase
      .from('invoice_items')
      .insert([invoiceItemWithTenant])
      .select()
      .single();

    if (error && status === 404) {
      console.error('Table invoice_items does not exist for insert operation');
      return Response.json({ error: 'Invoice items table does not exist' }, { status: 500 });
    }
    
    if (error) {
      console.error('SUPABASE ERROR (POST invoice_items):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating invoice item:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}