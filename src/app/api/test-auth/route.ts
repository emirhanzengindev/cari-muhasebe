export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/test-auth called')

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('DEBUG: Auth session missing in test route')
      return Response.json(
        { error: 'Auth session missing', hasError: authError },
        { status: 401 }
      )
    }

    console.log('DEBUG: Authenticated user:', user.id)
    
    // Test a simple query to ensure RLS is working
    const { data: productsCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('DEBUG: Count query error:', countError)
      return Response.json({ error: countError.message }, { status: 500 })
    }

    return Response.json({
      authenticated: true,
      userId: user.id,
      tenantId: user.id,
      productsAccessible: productsCount,
      message: 'Authentication successful'
    })
  } catch (error) {
    console.error('Error in test-auth route:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}