import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/categories called');
    
    // Get tenant ID from JWT token (Supabase session)
    const tenantId = await getTenantIdFromJWT();
    
    if (!tenantId) {
      console.log('DEBUG: Supabase session not available');
      return Response.json(
        { error: 'Tenant ID missing from JWT' },
        { status: 401 }
      );
    }
    
    console.log('DEBUG: Using tenant ID from JWT:', tenantId);
    
    // Validate that tenantId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return Response.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId);

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
    
    // Get tenant ID from JWT token
    const tenantId = await getTenantIdFromJWT();
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing from JWT' },
        { status: 401 }
      );
    }
    
    // Validate that tenantId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return Response.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }
    
    console.log('TENANT ID:', tenantId);
    
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
    
    console.log('CATEGORY WITH TENANT:', categoryWithTenant);
    
    // Validate required fields
    if (!categoryWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Category name is required' }, { status: 400 });
    }
    
    const supabase = createServerSupabaseClient();
    
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