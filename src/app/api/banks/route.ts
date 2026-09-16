export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { createServerSupabaseClientForRLS } from '@/lib/supabaseServer'

/* =========================
   GET /api/banks
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

    const tenantId =
      (typeof user.app_metadata?.tenant_id === 'string'
        ? user.app_metadata.tenant_id
        : null) ||
      (typeof user.user_metadata?.tenant_id === 'string'
        ? user.user_metadata.tenant_id
        : null) ||
      user.id;

    const { data, error } = await supabase
      .from('banks')
      .select('*')
      .in('tenant_id', Array.from(new Set([tenantId, user.id])))

    // tablo yoksa → boş array
    if (
      error &&
      error.message.toLowerCase().includes('does not exist')
    ) {
      return Response.json([])
    }

    if (error) {
      console.error('SUPABASE GET banks error:', error)
      return Response.json([], {
        headers: { 'x-data-warning': 'banks-read-failed' },
      })
    }

    return Response.json(data ?? [])
  } catch (error) {
    console.error('GET /api/banks error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/* =========================
   POST /api/banks
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

    if (!body?.name) {
      return Response.json(
        { error: 'Bank name is required' },
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
      .from('banks')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('SUPABASE POST banks error:', error)
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json(data)
  } catch (error) {
    console.error('POST /api/banks error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
