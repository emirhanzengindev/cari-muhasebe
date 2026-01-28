import { NextRequest } from 'next/server';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

// Helper function to get tenant context
async function getTenantContext(supabase: any) {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('No authenticated user');
  }
  
  // Get tenant_id from user metadata
  const tenantId = user?.user_metadata?.tenant_id || user?.id;
  
  return {
    userId: user.id,
    tenantId: tenantId
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClientWithRequest(request);
    
    // Get tenant context
    const { userId, tenantId } = await getTenantContext(supabase);
    
    console.log('Tenant Context:', { userId, tenantId });
    
    // Test current_accounts insert with proper tenant context
    const { data, error } = await supabase
      .from('current_accounts')
      .insert({
        name: 'Test Account',
        email: 'test@example.com',
        tenant_id: tenantId,
        balance: 0
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
    const supabase = createServerSupabaseClientWithRequest(request);
    
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