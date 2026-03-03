import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

async function handleBalanceUpdate(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }

    const userMetadataTenantId =
      typeof user.user_metadata?.tenant_id === 'string'
        ? user.user_metadata.tenant_id
        : null;
    const resolvedTenantId = userMetadataTenantId || user.id;
    const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

    // First fetch current balance so we can support delta updates with `amount`.
    const { data: account, error: accountError } = await supabase
      .from('current_accounts')
      .select('id, balance')
      .eq('id', id)
      .in('tenant_id', tenantCandidates)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    let nextBalance: number | null = null;
    if (typeof body.amount === 'number') {
      nextBalance = Number(account.balance || 0) + Number(body.amount);
    } else if (typeof body.balance === 'number') {
      nextBalance = Number(body.balance);
    }

    if (nextBalance === null || Number.isNaN(nextBalance)) {
      return NextResponse.json(
        { error: 'Either amount (delta) or balance is required' },
        { status: 400 }
      );
    }

    const { data, error, status } = await supabase
      .from('current_accounts')
      .update({
        balance: nextBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .in('tenant_id', tenantCandidates)
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleBalanceUpdate(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleBalanceUpdate(request, context);
}
