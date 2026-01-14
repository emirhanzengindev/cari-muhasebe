import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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
    
    const { data, error } = await supabase
      .from('current_accounts')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching current account:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const accountData = await request.json();
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

    // Update the current account
    const { data, error } = await supabase
      .from('current_accounts')
      .update({
        ...accountData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error updating current account:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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

    const { error } = await supabase
      .from('current_accounts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting current account:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}