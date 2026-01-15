import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/warehouses called');
    
    // Try to get tenant ID from JWT token (Supabase session)
    let tenantId = await getTenantIdFromJWT();
    
    // If Supabase session is not available, try to get from headers (fallback)
    if (!tenantId) {
      console.log('DEBUG: Supabase session not available, trying header fallback');
      
      // Get tenant ID from headers
      const headersList = await headers();
      tenantId = headersList.get('x-tenant-id');
      
      if (!tenantId) {
        console.error('DEBUG: Both JWT and header tenant ID missing');
        return Response.json(
          { error: 'Tenant ID missing from JWT and headers' },
          { status: 401 }
        );
      }
      
      console.log('DEBUG: Using tenant ID from header:', tenantId);
    } else {
      console.log('DEBUG: Using tenant ID from JWT:', tenantId);
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
    
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('SUPABASE ERROR DETAILS (GET):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('DEBUG: Successfully fetched', data?.length || 0, 'warehouses');
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const warehouseData = await request.json();
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
    
    // Map camelCase fields to snake_case for database insertion
    const warehouseWithTenant: any = {};
    
    // Explicitly map each field to ensure no camelCase fields leak through
    if (warehouseData.name !== undefined) warehouseWithTenant.name = warehouseData.name;
    if (warehouseData.description !== undefined) warehouseWithTenant.description = warehouseData.description;
    if (warehouseData.location !== undefined) warehouseWithTenant.location = warehouseData.location;
    if (warehouseData.manager !== undefined) warehouseWithTenant.manager = warehouseData.manager;
    if (warehouseData.capacity !== undefined) warehouseWithTenant.capacity = warehouseData.capacity;
    if (warehouseData.isActive !== undefined) warehouseWithTenant.is_active = warehouseData.isActive;
    
    warehouseWithTenant.created_at = new Date().toISOString();
    warehouseWithTenant.updated_at = new Date().toISOString();
    
    // Validate required fields
    if (!warehouseWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Warehouse name is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('warehouses')
      .insert([warehouseWithTenant])
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

    return Response.json(data);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}