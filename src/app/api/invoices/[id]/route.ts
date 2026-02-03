import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer'

type Params = {
  id: string
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const tenantId = await getTenantIdFromJWT()

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const body = await request.json()
  const tenantId = await getTenantIdFromJWT()

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('invoices')
    .update(body)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const tenantId = await getTenantIdFromJWT()

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}