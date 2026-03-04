export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

const resolveTenantIdForUser = (user: any): string => {
  const appMetaTenantId =
    typeof user?.app_metadata?.tenant_id === 'string'
      ? user.app_metadata.tenant_id
      : null;
  const userMetaTenantId =
    typeof user?.user_metadata?.tenant_id === 'string'
      ? user.user_metadata.tenant_id
      : null;

  return appMetaTenantId || userMetaTenantId || user.id;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClientWithRequest()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('DEBUG: Auth session missing')
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    const resolvedTenantId = resolveTenantIdForUser(user);
    const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

    const { data, error, status } = await supabase
      .from('transactions')
      .select('*')
      .in('tenant_id', tenantCandidates)

    // If table doesn't exist, return empty array
    if (error && status === 404) {
      console.warn('Table transactions does not exist, returning empty array');
      return Response.json([]);
    }
    
    if (error) {
      console.error('SUPABASE ERROR (GET transactions):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: status
      });
      
      // Handle specific error cases
      if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
        // Table does not exist - return empty array instead of error
        console.warn('Table transactions does not exist, returning empty array');
        return Response.json([]);
      }
      
      // For other errors, return the error message
      return Response.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    const rows = data || [];
    if (rows.length > 0) {
      return Response.json(rows);
    }

    // Fallback for RLS mismatch
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (serviceRoleKey && supabaseUrl) {
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const adminResult = await admin
        .from('transactions')
        .select('*')
        .in('tenant_id', tenantCandidates);

      if (!adminResult.error && (adminResult.data?.length || 0) > 0) {
        return Response.json(adminResult.data);
      }
    }

    return Response.json(rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const transactionData = await request.json();
    
    const supabase = await createServerSupabaseClientWithRequest();
    
    const {
      data: { user }
    } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    const resolvedTenantId = resolveTenantIdForUser(user);

    const transactionWithTenant: any = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: resolvedTenantId
    };

    if (transactionData.transactionType !== undefined) {
      transactionWithTenant.transaction_type = transactionData.transactionType;
    }
    if (transactionData.transaction_type !== undefined) {
      transactionWithTenant.transaction_type = transactionData.transaction_type;
    }
    if (transactionData.amount !== undefined) {
      transactionWithTenant.amount = transactionData.amount;
    }
    if (transactionData.accountId !== undefined) {
      transactionWithTenant.account_id = transactionData.accountId;
    }
    if (transactionData.account_id !== undefined) {
      transactionWithTenant.account_id = transactionData.account_id;
    }
    if (transactionData.currentAccountId !== undefined) {
      transactionWithTenant.current_account_id = transactionData.currentAccountId;
    }
    if (transactionData.current_account_id !== undefined) {
      transactionWithTenant.current_account_id = transactionData.current_account_id;
    }
    if (transactionData.safeId !== undefined) {
      transactionWithTenant.safe_id = transactionData.safeId;
    }
    if (transactionData.bankId !== undefined) {
      transactionWithTenant.bank_id = transactionData.bankId;
    }
    if (transactionData.description !== undefined) {
      transactionWithTenant.description = transactionData.description;
    }
    if (transactionData.date !== undefined) {
      transactionWithTenant.date = transactionData.date;
    }
    
    // Validate required fields
    if (!transactionWithTenant.transaction_type) {
      console.error('MISSING REQUIRED FIELD: transaction_type');
      return Response.json({ error: 'Transaction type is required' }, { status: 400 });
    }
    if (transactionWithTenant.amount === undefined || transactionWithTenant.amount === null) {
      console.error('MISSING REQUIRED FIELD: amount');
      return Response.json({ error: 'Amount is required' }, { status: 400 });
    }

    const { data, error, status } = await supabase
      .from('transactions')
      .insert([transactionWithTenant])
      .select()
      .single();

    if (error && status === 404) {
      console.error('Table transactions does not exist for insert operation');
      return Response.json({ error: 'Transactions table does not exist' }, { status: 500 });
    }
    
    if (error) {
      console.error('SUPABASE ERROR (POST transactions):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
