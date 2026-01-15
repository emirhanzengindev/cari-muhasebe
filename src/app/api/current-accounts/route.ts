import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/current-accounts called');
    
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
    
    const { data, error, status } = await supabase
      .from('current_accounts')
      .select('*')
      .eq('tenant_id', tenantId);

    // If table doesn't exist, return empty array
    if (error && status === 404) {
      console.warn('Table current_accounts does not exist, returning empty array');
      return Response.json([]);
    }
    
    if (error) {
      console.error('SUPABASE ERROR (GET current_accounts):', error);
      // For other errors, return the error message
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('DEBUG: Successfully fetched', data?.length || 0, 'current accounts');
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching current accounts:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accountData = await request.json();
    const tenantId = await getTenantIdFromJWT();
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing' },
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
    
    const accountWithTenant = {
      ...accountData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Validate required fields
    if (!accountWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Account name is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    const { data, error, status } = await supabase
      .from('current_accounts')
      .insert([accountWithTenant])
      .select()
      .single();

    if (error && status === 404) {
      console.error('Table current_accounts does not exist for insert operation');
      return Response.json({ error: 'Accounts table does not exist' }, { status: 500 });
    }
    
    if (error) {
      console.error('SUPABASE ERROR (POST current_accounts):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating current account:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}