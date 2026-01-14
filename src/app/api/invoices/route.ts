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
    
    // Validate that tenantId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return Response.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error, status } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId);

    // If table doesn't exist, return empty array
    if (error && status === 404) {
      console.warn('Table invoices does not exist, returning empty array');
      return Response.json([]);
    }
    
    if (error) {
      console.error('SUPABASE ERROR (GET invoices):', error);
      // For other errors, return the error message
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const invoiceData = await request.json();
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    // Validate that tenantId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return Response.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }
    
    const invoiceWithTenant = {
      ...invoiceData,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Validate required fields
    if (!invoiceWithTenant.invoice_number) {
      console.error('MISSING REQUIRED FIELD: invoice_number');
      return Response.json({ error: 'Invoice number is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error, status } = await supabase
      .from('invoices')
      .insert([invoiceWithTenant])
      .select()
      .single();

    if (error && status === 404) {
      console.error('Table invoices does not exist for insert operation');
      return Response.json({ error: 'Invoices table does not exist' }, { status: 500 });
    }
    
    if (error) {
      console.error('SUPABASE ERROR (POST invoices):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data[0]);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}