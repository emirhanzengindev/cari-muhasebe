import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientForRLS } from '@/lib/supabaseServer'

/* =========================
   GET /api/cheques/[id]
========================= */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createServerSupabaseClientForRLS()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Auth session missing' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('cheques')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/* =========================
   PUT /api/cheques/[id]
========================= */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const supabase = await createServerSupabaseClientForRLS()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Auth session missing' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('cheques')
    .update(body)
    .eq('id', id)
    .eq('tenant_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/* =========================
   DELETE /api/cheques/[id]
========================= */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createServerSupabaseClientForRLS()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Auth session missing' }, { status: 401 })
  }

  const { error } = await supabase
    .from('cheques')
    .delete()
    .eq('id', id)
    .eq('tenant_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
