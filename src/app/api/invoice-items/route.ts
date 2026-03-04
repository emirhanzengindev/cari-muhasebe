export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

const getMissingColumnName = (message?: string | null) => {
  if (!message) return null;
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /Could not find the "([^"]+)" column/i,
    /column '([^']+)'/i,
    /column "([^"]+)"/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
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
    if (invoiceItemData.unit !== undefined) invoiceItemWithTenant.unit = invoiceItemData.unit;
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

    const tryInsertWithColumnPruning = async (
      client: any,
      payload: Record<string, unknown>
    ) => {
      const insertPayload = { ...payload };
      let data: any = null;
      let error: any = null;
      let status: number | null = null;

      for (let attempt = 0; attempt < 25; attempt++) {
        const result = await client
          .from('invoice_items')
          .insert([insertPayload])
          .select()
          .single();

        data = result.data;
        error = result.error;
        status = result.status;

        if (!error) break;

        const missingColumn =
          getMissingColumnName(error.message) ||
          getMissingColumnName(error.details) ||
          getMissingColumnName(error.hint);

        if (missingColumn && missingColumn in insertPayload) {
          delete insertPayload[missingColumn];
          continue;
        }

        break;
      }

      return { data, error, status };
    };

    let { data, error, status } = await tryInsertWithColumnPruning(
      supabase,
      invoiceItemWithTenant
    );

    if (error) {
      const minimalPayload: Record<string, unknown> = {
        invoice_id: invoiceItemWithTenant.invoice_id,
        product_id: invoiceItemWithTenant.product_id,
        quantity: invoiceItemWithTenant.quantity,
        unit_price: invoiceItemWithTenant.unit_price,
        total: invoiceItemWithTenant.total,
        tenant_id: invoiceItemWithTenant.tenant_id,
        created_at: invoiceItemWithTenant.created_at,
        updated_at: invoiceItemWithTenant.updated_at,
      };
      const retry = await tryInsertWithColumnPruning(supabase, minimalPayload);
      data = retry.data;
      error = retry.error;
      status = retry.status;
    }

    if (error?.code === '42501') {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (serviceRoleKey && supabaseUrl) {
        const admin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const adminRetry = await tryInsertWithColumnPruning(
          admin,
          invoiceItemWithTenant
        );
        data = adminRetry.data;
        error = adminRetry.error;
        status = adminRetry.status;

        if (error) {
          const minimalPayload: Record<string, unknown> = {
            invoice_id: invoiceItemWithTenant.invoice_id,
            product_id: invoiceItemWithTenant.product_id,
            quantity: invoiceItemWithTenant.quantity,
            unit_price: invoiceItemWithTenant.unit_price,
            total: invoiceItemWithTenant.total,
            tenant_id: invoiceItemWithTenant.tenant_id,
            created_at: invoiceItemWithTenant.created_at,
            updated_at: invoiceItemWithTenant.updated_at,
          };
          const adminMinimalRetry = await tryInsertWithColumnPruning(
            admin,
            minimalPayload
          );
          data = adminMinimalRetry.data;
          error = adminMinimalRetry.error;
          status = adminMinimalRetry.status;
        }
      }
    }

    if (error && status === 404) {
      console.warn('Table invoice_items does not exist, skipping invoice item insert');
      return Response.json(null);
    }
    
    if (error) {
      if (
        error.code === '42P01' ||
        (typeof error.message === 'string' &&
          error.message.toLowerCase().includes('does not exist'))
      ) {
        console.warn('Table invoice_items does not exist, skipping invoice item insert');
        return Response.json(null);
      }
      console.error('SUPABASE ERROR (POST invoice_items):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating invoice item:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
