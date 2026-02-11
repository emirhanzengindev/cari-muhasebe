export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { createServerSupabaseClientForRLS } from '@/lib/supabaseServer'

/* =========================
   GET /api/cheques
========================= */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClientForRLS()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('cheques')
      .select('*')
      .eq('tenant_id', user.id)

    if (error) {
      // tablo yoksa boş array
      if (
        error.code === '42P01' ||
        error.message.toLowerCase().includes('does not exist')
      ) {
        return Response.json([])
      }

      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json(data ?? [])
  } catch (error) {
    console.error('GET /cheques error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/* =========================
   POST /api/cheques
========================= */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supabase = await createServerSupabaseClientForRLS()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    // ZORUNLU ALANLAR
    if (!body?.chequeType) {
      return Response.json(
        { error: 'Cheque type is required' },
        { status: 400 }
      )
    }

    if (body.amount === undefined || body.amount === null) {
      return Response.json(
        { error: 'Amount is required' },
        { status: 400 }
      )
    }

    if (!body?.issuerName) {
      return Response.json(
        { error: 'Issuer name is required' },
        { status: 400 }
      )
    }

    const payload = {
      ...body,
      tenant_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('cheques')
      .insert(payload)
      .select()
      .single()

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json(data)
  } catch (error) {
    console.error('POST /cheques error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
