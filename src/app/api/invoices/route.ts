import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/invoices called');
    
    // Try to get tenant ID from JWT token (Supabase session)
    let tenantId = await getTenantIdFromJWT();
    
    // If Supabase session is not available, try to get from headers (fallback)
    if (!tenantId) {
      console.log('DEBUG: Supabase session not available, trying header fallback');
      
      // Get tenant ID from headers
      const headersList = await headers();
      tenantId = headersList.get('x-tenant-id');
      
      if (!tenantId) {
        console.error('DEBUG: Both JWT and header tenant ID missing');
        return Response.json(
          { error: 'Tenant ID missing from JWT and headers' },
          { status: 401 }
        );
      }
      
      console.log('DEBUG: Using tenant ID from header:', tenantId);
    } else {
      console.log('DEBUG: Using tenant ID from JWT:', tenantId);
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
    
    const supabase = createServerSupabaseClient();
    
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

    console.log('DEBUG: Successfully fetched', data?.length || 0, 'invoices');
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const invoiceData = await request.json();
    const tenantId = await getTenantIdFromJWT();
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
    
    // Map camelCase fields to snake_case for database insertion
    const invoiceWithTenant: any = {};
    
    // Explicitly map each field to ensure no camelCase fields leak through
    if (invoiceData.invoiceNumber !== undefined) invoiceWithTenant.invoice_number = invoiceData.invoiceNumber;
    if (invoiceData.currentAccountId !== undefined) invoiceWithTenant.current_account_id = invoiceData.currentAccountId;
    if (invoiceData.invoiceDate !== undefined) invoiceWithTenant.invoice_date = invoiceData.invoiceDate;
    if (invoiceData.dueDate !== undefined) invoiceWithTenant.due_date = invoiceData.dueDate;
    if (invoiceData.totalAmount !== undefined) invoiceWithTenant.total_amount = invoiceData.totalAmount;
    if (invoiceData.status !== undefined) invoiceWithTenant.status = invoiceData.status;
    if (invoiceData.notes !== undefined) invoiceWithTenant.notes = invoiceData.notes;
    if (invoiceData.taxRate !== undefined) invoiceWithTenant.tax_rate = invoiceData.taxRate;
    if (invoiceData.discount !== undefined) invoiceWithTenant.discount = invoiceData.discount;
    if (invoiceData.paymentTerms !== undefined) invoiceWithTenant.payment_terms = invoiceData.paymentTerms;
    if (invoiceData.currency !== undefined) invoiceWithTenant.currency = invoiceData.currency;
    if (invoiceData.exchangeRate !== undefined) invoiceWithTenant.exchange_rate = invoiceData.exchangeRate;
    
    invoiceWithTenant.created_at = new Date().toISOString();
    invoiceWithTenant.updated_at = new Date().toISOString();
    
    // Validate required fields
    if (!invoiceWithTenant.invoice_number) {
      console.error('MISSING REQUIRED FIELD: invoice_number');
      return Response.json({ error: 'Invoice number is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
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

    return Response.json(data);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}