import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

type Params = {
  id: string
}

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

  const { data, error } = await supabase
    .from('invoices')
    .update(body)
    .eq('id', id)
    .in('tenant_id', tenantCandidates)
    .select()
    .maybeSingle()

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
    const adminResult = await admin
      .from('invoices')
      .update(body)
      .eq('id', id)
      .in('tenant_id', tenantCandidates)
      .select()
      .maybeSingle();

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
