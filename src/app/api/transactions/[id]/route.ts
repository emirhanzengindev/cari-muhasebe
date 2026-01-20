import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    
    const supabase = createServerSupabaseClient();
    
    const { data, error, status } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error && status === 404) {
      console.warn('Table transactions does not exist or record not found');
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const transactionData = await request.json();
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

    const supabase = createServerSupabaseClient();

    // Update the transaction
    const { data, error, status } = await supabase
      .from('transactions')
      .update({
        ...transactionData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error && status === 404) {
      console.warn('Table transactions does not exist or record not found for update');
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const supabase = createServerSupabaseClient();

    const { error, status } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error && status === 404) {
      console.warn('Table transactions does not exist or record not found for delete');
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}