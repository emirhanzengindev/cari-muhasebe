import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { balance } = await request.json();
    const tenantId = await getTenantIdFromJWT();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    // Validate that tenantId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return NextResponse.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Update the account balance
    const { data, error, status } = await supabase
      .from('current_accounts')
      .update({
        balance: balance,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error && status === 404) {
      console.warn('Table current_accounts does not exist or record not found for balance update');
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map database fields to frontend interface fields
    const mappedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      isActive: data.is_active !== undefined ? data.is_active : true,
      accountType: data.account_type || 'CUSTOMER'
    };

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error('Error updating account balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}