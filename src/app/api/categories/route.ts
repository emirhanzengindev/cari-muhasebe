export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/categories called')

    const supabase = createServerSupabaseClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('DEBUG: Auth session missing')
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')

    if (error) {
      console.error('SUPABASE ERROR:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('DEBUG: Successfully fetched', data?.length || 0, 'categories');
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API HIT: categories');
    
    const categoryData = await request.json();
    console.log('BODY:', categoryData);
    
    const supabase = createServerSupabaseClient();
    
    const {
      data: { user }
    } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    console.log('USER ID (TENANT ID):', user.id);
    
    // Map camelCase fields to snake_case for database insertion
    const categoryWithTenant: any = {};
    
    // Explicitly map each field to ensure no camelCase fields leak through
    if (categoryData.name !== undefined) categoryWithTenant.name = categoryData.name;
    if (categoryData.description !== undefined) categoryWithTenant.description = categoryData.description;
    if (categoryData.parentId !== undefined) categoryWithTenant.parent_id = categoryData.parentId;
    if (categoryData.level !== undefined) categoryWithTenant.level = categoryData.level;
    if (categoryData.order !== undefined) categoryWithTenant.order = categoryData.order;
    if (categoryData.isActive !== undefined) categoryWithTenant.is_active = categoryData.isActive;
    
    categoryWithTenant.created_at = new Date().toISOString();
    categoryWithTenant.updated_at = new Date().toISOString();
    
    // Use the user.id as tenant_id since that's how RLS is configured
    categoryWithTenant.tenant_id = user.id;
    
    console.log('CATEGORY WITH TENANT:', categoryWithTenant);
    
    // Validate required fields
    if (!categoryWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Category name is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryWithTenant])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR DETAILS:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('SUCCESS DATA:', data);
    return Response.json(data);
  } catch (error) {
    console.error('Error creating category:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}