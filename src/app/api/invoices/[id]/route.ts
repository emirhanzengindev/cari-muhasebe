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

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .in('tenant_id', tenantCandidates)

  if (!error) {
    return NextResponse.json({ success: true })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceRoleKey && supabaseUrl) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const adminResult = await admin
      .from('invoices')
      .delete()
      .eq('id', id)
      .in('tenant_id', tenantCandidates);

    if (!adminResult.error) {
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: error.message }, { status: 500 })
}
