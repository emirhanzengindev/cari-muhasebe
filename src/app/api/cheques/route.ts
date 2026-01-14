import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
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
    
    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error, status } = await supabase
      .from('cheques')
      .select('*')
      .eq('tenant_id', tenantId);

    // If table doesn't exist, return empty array
    if (error && status === 404) {
      console.warn('Table cheques does not exist, returning empty array');
      return Response.json([]);
    }
    
    if (error) {
      console.error('SUPABASE ERROR (GET cheques):', error);
      // For other errors, return the error message
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching cheques:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const chequeData = await request.json();
    const tenantId = request.headers.get('x-tenant-id');
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
    
    const chequeWithTenant = {
      ...chequeData,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Validate required fields
    if (!chequeWithTenant.chequeType) {
      console.error('MISSING REQUIRED FIELD: chequeType');
      return Response.json({ error: 'Cheque type is required' }, { status: 400 });
    }
    if (chequeWithTenant.amount === undefined || chequeWithTenant.amount === null) {
      console.error('MISSING REQUIRED FIELD: amount');
      return Response.json({ error: 'Amount is required' }, { status: 400 });
    }
    if (!chequeWithTenant.issuerName) {
      console.error('MISSING REQUIRED FIELD: issuerName');
      return Response.json({ error: 'Issuer name is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error, status } = await supabase
      .from('cheques')
      .insert([chequeWithTenant])
      .select()
      .single();

    if (error && status === 404) {
      console.error('Table cheques does not exist for insert operation');
      return Response.json({ error: 'Cheques table does not exist' }, { status: 500 });
    }
    
    if (error) {
      console.error('SUPABASE ERROR (POST cheques):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating cheque:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}