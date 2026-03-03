import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

type Params = {
  id: string
}

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

  const userMetadataTenantId =
    typeof user.user_metadata?.tenant_id === 'string'
      ? user.user_metadata.tenant_id
      : null;
  const resolvedTenantId = userMetadataTenantId || user.id;
  const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .in('tenant_id', tenantCandidates)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json(data)
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

  const userMetadataTenantId =
    typeof user.user_metadata?.tenant_id === 'string'
      ? user.user_metadata.tenant_id
      : null;
  const resolvedTenantId = userMetadataTenantId || user.id;
  const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

  const { data, error } = await supabase
    .from('invoices')
    .update(body)
    .eq('id', id)
    .in('tenant_id', tenantCandidates)
    .select()
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json(data)
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

  const userMetadataTenantId =
    typeof user.user_metadata?.tenant_id === 'string'
      ? user.user_metadata.tenant_id
      : null;
  const resolvedTenantId = userMetadataTenantId || user.id;
  const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .in('tenant_id', tenantCandidates)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
