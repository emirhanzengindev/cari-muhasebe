import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { balance } = await request.json();
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

    // Update the account balance
    const { data, error } = await supabase
      .from('current_accounts')
      .update({
        balance: balance,
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
    console.error('Error updating account balance:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}