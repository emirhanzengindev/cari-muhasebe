import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientForRLS } from '@/lib/supabaseServer'
import { resolveTenantCandidates } from '@/lib/tenant';

type Params = {
  id: string
}

/* =========================
   GET /api/banks/[id]
========================= */
export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params

  const supabase = await createServerSupabaseClientForRLS()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Auth session missing' },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('banks')
    .select('*')
    .eq('id', id)
    .in('tenant_id', resolveTenantCandidates(user))
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

/* =========================
   PUT /api/banks/[id]
========================= */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const body = await request.json()

  const supabase = await createServerSupabaseClientForRLS()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Auth session missing' },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('banks')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .in('tenant_id', resolveTenantCandidates(user))
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

/* =========================
   DELETE /api/banks/[id]
========================= */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params

  const supabase = await createServerSupabaseClientForRLS()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Auth session missing' },
      { status: 401 }
    )
  }

  const { error } = await supabase
    .from('banks')
    .delete()
    .eq('id', id)
    .in('tenant_id', resolveTenantCandidates(user))

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
