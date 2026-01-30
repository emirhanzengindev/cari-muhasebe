import { NextRequest } from 'next/server';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

// Helper function to get tenant context
async function getTenantContext(supabase: any) {
  console.log('DEBUG: getTenantContext called');
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  console.log('DEBUG: getUser result:', { user: !!user, error: userError });
  if (user) {
    console.log('DEBUG: User ID:', user.id);
    console.log('DEBUG: User metadata:', user.user_metadata);
  }
  
  if (userError || !user) {
    console.error('DEBUG: Authentication failed:', userError);
    throw new Error('No authenticated user');
  }
  
  // Get tenant_id from user metadata
  const tenantId = user?.user_metadata?.tenant_id || user?.id;
  console.log('DEBUG: Determined tenantId:', tenantId);
  
  return {
    userId: user.id,
    tenantId: tenantId
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('DEBUG: Test route POST called');
    
    // Log request headers for debugging
    console.log('DEBUG: Request headers:');
    for (const [key, value] of request.headers.entries()) {
      if (key === 'authorization') {
        console.log(`  ${key}: ${value.substring(0, 50)}...`);
      } else if (key === 'cookie') {
        console.log(`  ${key}: ${value.substring(0, 100)}...`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    const supabase = await createServerSupabaseClientWithRequest(request);
    
    // Get tenant context
    const { userId, tenantId } = await getTenantContext(supabase);
    
    console.log('Tenant Context:', { userId, tenantId });
    
    // Test current_accounts insert with proper tenant context
    const { data, error } = await supabase
      .from('current_accounts')
      .insert({
        name: 'Test Account',
        tenant_id: tenantId,
        balance: 0,
        phone: '+901234567890',
        address: 'Test Address',
        tax_number: '123456789',
        tax_office: 'Test Tax Office',
        company: 'Test Company',
        is_active: true,
        account_type: 'CUSTOMER'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Insert error:', error);
      return Response.json({ error: error.message }, { status: 400 });
    }
    
    // Test transaction insert
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        current_account_id: data.id,
        type: 'debit',
        amount: 5000,
        description: 'Opening balance',
        tenant_id: tenantId
      })
      .select()
      .single();
    
    if (transactionError) {
      console.error('Transaction insert error:', transactionError);
      return Response.json({ error: transactionError.message }, { status: 400 });
    }
    
    // Get balance view
    const { data: balanceData, error: balanceError } = await supabase
      .from('current_account_balances')
      .select('*')
      .eq('id', data.id)
      .single();
    
    if (balanceError) {
      console.error('Balance query error:', balanceError);
      return Response.json({ error: balanceError.message }, { status: 400 });
    }
    
    return Response.json({
      success: true,
      account: data,
      transaction: transactionData,
      balance: balanceData,
      tenantContext: { userId, tenantId }
    });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClientWithRequest(request);
    
    // Get tenant context
    const { userId, tenantId } = await getTenantContext(supabase);
    
    // Get all current accounts for this tenant
    const { data: accounts, error } = await supabase
      .from('current_account_balances')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Query error:', error);
      return Response.json({ error: error.message }, { status: 400 });
    }
    
    return Response.json({
      accounts,
      tenantContext: { userId, tenantId }
    });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}