import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

type Params = {
  id: string
}

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

const resolveTenantIdForUser = (user: any): string => {
  const appMetaTenantId =
    typeof user?.app_metadata?.tenant_id === 'string'
      ? user.app_metadata.tenant_id
      : null;
  const userMetaTenantId =
    typeof user?.user_metadata?.tenant_id === 'string'
      ? user.user_metadata.tenant_id
      : null;

  return appMetaTenantId || userMetaTenantId || user.id;
};

const mapInvoiceUpdatePayload = (body: Record<string, any>) => {
  const payload: Record<string, any> = {};
  if (body.invoiceNumber !== undefined) {
    payload.invoice_number = body.invoiceNumber;
    payload.invoice_no = body.invoiceNumber;
    payload.number = body.invoiceNumber;
  }
  if (body.invoiceType !== undefined) {
    payload.invoice_type = body.invoiceType;
    payload.type = body.invoiceType;
  }
  if (body.accountId !== undefined) payload.account_id = body.accountId;
  if (body.currentAccountId !== undefined) payload.current_account_id = body.currentAccountId;
  if (body.date !== undefined) payload.date = body.date;
  if (body.invoiceDate !== undefined) payload.invoice_date = body.invoiceDate;
  if (body.subtotal !== undefined) payload.subtotal = body.subtotal;
  if (body.discount !== undefined) payload.discount = body.discount;
  if (body.vatAmount !== undefined) payload.vat_amount = body.vatAmount;
  if (body.totalAmount !== undefined) {
    payload.total_amount = body.totalAmount;
    payload.total = body.totalAmount;
    payload.amount = body.totalAmount;
  }
  if (body.currency !== undefined) payload.currency = body.currency;
  if (body.description !== undefined) payload.description = body.description;
  if (body.isDraft !== undefined) payload.is_draft = body.isDraft;
  payload.updated_at = new Date().toISOString();
  return payload;
};

const updateWithColumnPruning = async (
  client: any,
  id: string,
  tenantCandidates: string[],
  body: Record<string, any>
) => {
  const payload = mapInvoiceUpdatePayload(body);
  let data: any = null;
  let error: any = null;

  for (let attempt = 0; attempt < 20; attempt++) {
    const result = await client
      .from('invoices')
      .update(payload)
      .eq('id', id)
      .in('tenant_id', tenantCandidates)
      .select()
      .maybeSingle();

    data = result.data;
    error = result.error;

    if (!error) break;

    const missingColumn =
      getMissingColumnName(error.message) ||
      getMissingColumnName(error.details) ||
      getMissingColumnName(error.hint);

    if (missingColumn && missingColumn in payload) {
      delete payload[missingColumn];
      continue;
    }

    break;
  }

  return { data, error };
};

const selectInvoiceForDelete = async (client: any, id: string) => {
  const trySelect = async (selectExpr: string) =>
    client.from('invoices').select(selectExpr).eq('id', id).maybeSingle();

  let result = await trySelect('id, tenant_id, account_id, current_account_id');

  if (
    result.error?.code === '42703' ||
    (typeof result.error?.message === 'string' &&
      result.error.message.toLowerCase().includes('current_account_id'))
  ) {
    result = await trySelect('id, tenant_id, account_id');
  }

  return result;
};

const isMissingInvoiceItemsTableError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("public.invoice_items") ||
    message.includes("invoice_items") && message.includes("schema cache") ||
    details.includes("public.invoice_items")
  );
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Auth session missing' }, { status: 401 })
  }

  const resolvedTenantId = resolveTenantIdForUser(user);
  const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .in('tenant_id', tenantCandidates)
    .maybeSingle()

  if (!error && data) {
    return NextResponse.json(data)
  }

  // Fallback for RLS mismatch: read by service role but keep tenant filter strict.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceRoleKey && supabaseUrl) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const adminResult = await admin
      .from('invoices')
      .select('*')
      .eq('id', id)
      .in('tenant_id', tenantCandidates)
      .maybeSingle();

    if (!adminResult.error && adminResult.data) {
      return NextResponse.json(adminResult.data);
    }
  }

  return NextResponse.json({ error: error?.message || 'Invoice not found' }, { status: 404 })
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const body = await request.json()
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Auth session missing' }, { status: 401 })
  }

  const resolvedTenantId = resolveTenantIdForUser(user);
  const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

  const { data, error } = await updateWithColumnPruning(supabase, id, tenantCandidates, body)

  if (!error && data) {
    return NextResponse.json(data)
  }

  // Fallback for RLS mismatch: update by service role but keep tenant filter strict.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceRoleKey && supabaseUrl) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const adminResult = await updateWithColumnPruning(admin, id, tenantCandidates, body);

    if (!adminResult.error && adminResult.data) {
      return NextResponse.json(adminResult.data);
    }
  }

  return NextResponse.json({ error: error?.message || 'Invoice not found' }, { status: 404 })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Auth session missing' }, { status: 401 })
  }

  const resolvedTenantId = resolveTenantIdForUser(user);
  const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));
  const tryDeleteInvoice = async (client: any, withTenantFilter: boolean) => {
    let query = client.from('invoices').delete().eq('id', id);
    if (withTenantFilter) {
      query = query.in('tenant_id', tenantCandidates);
    }
    const result = await query.select('id');

    return {
      error: result.error,
      fkConflict: result.error?.code === '23503',
      deletedRows: Array.isArray(result.data) ? result.data.length : 0,
    };
  };

  const tryDeleteInvoiceItems = async (client: any) => {
    const snake = await client.from('invoice_items').delete().eq('invoice_id', id);
    if (!snake.error || isMissingInvoiceItemsTableError(snake.error)) return { ok: true, error: null };
    if (snake.error.code === '42703') {
      const camel = await client.from('invoice_items').delete().eq('invoiceId', id);
      if (!camel.error || isMissingInvoiceItemsTableError(camel.error)) return { ok: true, error: null };
      return { ok: false, error: camel.error };
    }
    return { ok: false, error: snake.error };
  };

  // 1) Authenticated delete with tenant filter.
  let primary = await tryDeleteInvoice(supabase, true);
  if (!primary.error && primary.deletedRows > 0) {
    return NextResponse.json({ success: true });
  }

  // 2) If FK blocks delete, remove items then retry.
  if (primary.fkConflict) {
    const itemDelete = await tryDeleteInvoiceItems(supabase);
    if (!itemDelete.ok) {
      return NextResponse.json({ error: itemDelete.error?.message || 'Invoice deletion failed' }, { status: 500 });
    }
    primary = await tryDeleteInvoice(supabase, true);
    if (!primary.error && primary.deletedRows > 0) {
      return NextResponse.json({ success: true });
    }
  }

  // 3) Relaxed authenticated delete (RLS still applies).
  const relaxed = await tryDeleteInvoice(supabase, false);
  if (!relaxed.error && relaxed.deletedRows > 0) {
    return NextResponse.json({ success: true });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceRoleKey && supabaseUrl) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Legacy data can have mismatched tenant_id. Validate ownership with a strict admin check.
    const { data: targetInvoice, error: targetError } = await selectInvoiceForDelete(admin, id);

    if (targetError) {
      return NextResponse.json({ error: targetError.message }, { status: 500 });
    }
    if (!targetInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceTenantId = String(targetInvoice.tenant_id || '');
    let authorizedByAccount = false;
    if (!tenantCandidates.includes(invoiceTenantId)) {
      const linkedAccountId = targetInvoice.account_id || (targetInvoice as any).current_account_id;
      if (linkedAccountId) {
        const accountCheck = await admin
          .from('current_accounts')
          .select('id, tenant_id, user_id')
          .eq('id', linkedAccountId)
          .maybeSingle();
        if (!accountCheck.error && accountCheck.data) {
          const accountTenantId = String(accountCheck.data.tenant_id || '');
          const accountUserId = String(accountCheck.data.user_id || '');
          authorizedByAccount =
            tenantCandidates.includes(accountTenantId) || accountUserId === user.id;
        }
      }
    }

    if (!tenantCandidates.includes(invoiceTenantId) && !authorizedByAccount) {
      return NextResponse.json(
        { error: 'Invoice could not be deleted (no matching row or permission).' },
        { status: 404 }
      );
    }

    const adminItemDelete = await tryDeleteInvoiceItems(admin);
    if (!adminItemDelete.ok) {
      return NextResponse.json({ error: adminItemDelete.error?.message || 'Invoice deletion failed' }, { status: 500 });
    }

    const adminDelete = await tryDeleteInvoice(admin, false);
    if (!adminDelete.error && adminDelete.deletedRows > 0) return NextResponse.json({ success: true });
    if (!adminDelete.error && adminDelete.deletedRows === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ error: adminDelete.error?.message || 'Invoice deletion failed' }, { status: 500 });
  }

  const fallbackError =
    primary.error?.message ||
    relaxed.error?.message ||
    'Invoice could not be deleted (no matching row or permission).';
  return NextResponse.json({ error: fallbackError }, { status: 404 })
}
