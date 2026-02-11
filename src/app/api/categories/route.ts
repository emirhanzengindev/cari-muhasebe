export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { createServerSupabaseClientForRLS } from '@/lib/supabaseServer'

/* =========================
   GET /api/categories
========================= */
export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/categories called')

    const supabase = await createServerSupabaseClientForRLS()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('DEBUG: Auth session missing')
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', user.id)

    if (error) {
      console.error('SUPABASE ERROR:', error)
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log(
      'DEBUG: Successfully fetched',
      data?.length ?? 0,
      'categories'
    )

    return Response.json(data ?? [])
  } catch (error) {
    console.error('Error fetching categories:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/* =========================
   POST /api/categories
========================= */
export async function POST(request: NextRequest) {
  try {
    console.log('API HIT: categories')

    const categoryData = await request.json()
    console.log('BODY:', categoryData)

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

    console.log('USER ID (TENANT ID):', user.id)

    // camelCase → snake_case mapping
    const categoryWithTenant: any = {}

    if (categoryData.name !== undefined)
      categoryWithTenant.name = categoryData.name

    if (categoryData.description !== undefined)
      categoryWithTenant.description = categoryData.description

    if (categoryData.parentId !== undefined)
      categoryWithTenant.parent_id = categoryData.parentId

    if (categoryData.level !== undefined)
      categoryWithTenant.level = categoryData.level

    if (categoryData.order !== undefined)
      categoryWithTenant.order = categoryData.order

    if (categoryData.isActive !== undefined)
      categoryWithTenant.is_active = categoryData.isActive

    categoryWithTenant.tenant_id = user.id
    categoryWithTenant.created_at = new Date().toISOString()
    categoryWithTenant.updated_at = new Date().toISOString()

    console.log('CATEGORY WITH TENANT:', categoryWithTenant)

    if (!categoryWithTenant.name) {
      return Response.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryWithTenant)
      .select()
      .single()

    if (error) {
      console.error('SUPABASE ERROR DETAILS:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })

      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('SUCCESS DATA:', data)
    return Response.json(data)
  } catch (error) {
    console.error('Error creating category:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
