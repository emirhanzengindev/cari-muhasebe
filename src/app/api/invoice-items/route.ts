export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

const getMissingColumnName = (message?: string | null) => {
  if (!message) return null;
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] ?? null;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClientWithRequest()

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

    const userMetadataTenantId =
      typeof user.user_metadata?.tenant_id === 'string'
        ? user.user_metadata.tenant_id
        : null;
    const resolvedTenantId = userMetadataTenantId || user.id;
    const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

    const { data, error, status } = await supabase
      .from('invoice_items')
      .select('*')
      .in('tenant_id', tenantCandidates)

    // If table doesn't exist, return empty array
    if (error && status === 404) {
      console.warn('Table invoice_items does not exist, returning empty array');
      return Response.json([]);
    }
    
    if (error) {
      console.error('SUPABASE ERROR (GET invoice_items):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: status
      });
      
      // Handle specific error cases
      if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
        // Table does not exist - return empty array instead of error
        console.warn('Table invoice_items does not exist, returning empty array');
        return Response.json([]);
      }
      
      // For other errors, return the error message
      return Response.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
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
    
    const supabase = await createServerSupabaseClientWithRequest();
    
    const {
      data: { user }
    } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    const userMetadataTenantId =
      typeof user.user_metadata?.tenant_id === 'string'
        ? user.user_metadata.tenant_id
        : null;
    const resolvedTenantId = userMetadataTenantId || user.id;

    const invoiceItemWithTenant: any = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: resolvedTenantId,
    };

    if (invoiceItemData.invoiceId !== undefined) invoiceItemWithTenant.invoice_id = invoiceItemData.invoiceId;
    if (invoiceItemData.invoice_id !== undefined) invoiceItemWithTenant.invoice_id = invoiceItemData.invoice_id;
    if (invoiceItemData.productId !== undefined) invoiceItemWithTenant.product_id = invoiceItemData.productId;
    if (invoiceItemData.product_id !== undefined) invoiceItemWithTenant.product_id = invoiceItemData.product_id;
    if (invoiceItemData.quantity !== undefined) invoiceItemWithTenant.quantity = invoiceItemData.quantity;
    if (invoiceItemData.unitPrice !== undefined) invoiceItemWithTenant.unit_price = invoiceItemData.unitPrice;
    if (invoiceItemData.unit_price !== undefined) invoiceItemWithTenant.unit_price = invoiceItemData.unit_price;
    if (invoiceItemData.vatRate !== undefined) invoiceItemWithTenant.vat_rate = invoiceItemData.vatRate;
    if (invoiceItemData.vat_rate !== undefined) invoiceItemWithTenant.vat_rate = invoiceItemData.vat_rate;
    if (invoiceItemData.total !== undefined) invoiceItemWithTenant.total = invoiceItemData.total;
    if (invoiceItemData.currency !== undefined) invoiceItemWithTenant.currency = invoiceItemData.currency;
    
    // Validate required fields
    if (!invoiceItemWithTenant.invoice_id || !invoiceItemWithTenant.product_id) {
      console.error('MISSING REQUIRED FIELD: invoice_id or product_id');
      return Response.json({ error: 'Invoice ID and Product ID are required' }, { status: 400 });
    }

    const insertPayload = { ...invoiceItemWithTenant };
    let data: any = null;
    let error: any = null;
    let status: number | null = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await supabase
        .from('invoice_items')
        .insert([insertPayload])
        .select()
        .single();

      data = result.data;
      error = result.error;
      status = result.status;

      if (!error) break;

      const missingColumn = getMissingColumnName(error.message);
      if (error.code === 'PGRST204' && missingColumn && missingColumn in insertPayload) {
        delete insertPayload[missingColumn];
        continue;
      }

      break;
    }

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
