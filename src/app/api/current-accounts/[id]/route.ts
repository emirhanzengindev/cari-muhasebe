import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientWithRequest, getTenantIdFromJWTWithRequest } from '@/lib/supabaseServer'

type Params = {
  id: string
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const tenantId = await getTenantIdFromJWTWithRequest(request)

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 401 })
  }

  const supabase = createServerSupabaseClientWithRequest(request)

  const { data, error } = await supabase
    .from('current_accounts')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map database fields to frontend interface fields
  const mappedData = {
    ...data,
    isActive: data.is_active,
    accountType: data.account_type
  };
  
  return NextResponse.json(mappedData)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const body = await request.json()
  const tenantId = await getTenantIdFromJWTWithRequest(request)

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 401 })
  }

  const supabase = createServerSupabaseClientWithRequest(request)

  const { data, error } = await supabase
    .from('current_accounts')
    .update(body)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map database fields to frontend interface fields
  const mappedData = {
    ...data,
    isActive: data.is_active,
    accountType: data.account_type
  };
  
  return NextResponse.json(mappedData)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const tenantId = await getTenantIdFromJWTWithRequest(request)

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 401 })
  }

  const supabase = createServerSupabaseClientWithRequest(request)

  const { error } = await supabase
    .from('current_accounts')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}