export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/current-accounts called')
    console.log('DEBUG: Request method:', request.method)
    console.log('DEBUG: Request URL:', request.url)
    
    console.log('DEBUG: Creating Supabase client...')
    const supabase = createServerSupabaseClientWithRequest(request)
    console.log('DEBUG: Supabase client created successfully')
    
    // Debug request
    console.log('DEBUG: API request received');
    console.log('DEBUG: Request headers:', Object.fromEntries(request.headers));
    console.log('DEBUG: Request cookies:', request.headers.get('cookie'));
    
    // Manual cookie check
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      console.log('DEBUG: Parsed cookies count:', cookies.length);
      const supabaseCookies = cookies.filter(c => c.startsWith('sb-'));
      console.log('DEBUG: Supabase cookies found:', supabaseCookies);
    } else {
      console.log('DEBUG: NO COOKIE HEADER FOUND!');
    }

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    
    console.log('DEBUG: Auth result - user:', user ? 'exists' : 'null');
    console.log('DEBUG: Auth result - error:', authError);

    if (!user) {
      console.error('DEBUG: Auth session missing')
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    // Check if table exists first by attempting a simple query
    try {
      const { error: tableCheckError } = await supabase
        .from('current_accounts')
        .select('id')
        .eq('tenant_id', user.id)
        .limit(1);
      
      if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.toLowerCase().includes('does not exist'))) {
        console.warn('Table current_accounts does not exist, returning empty array');
        return Response.json([]);
      }
    } catch (tableCheckError) {
      // If there's an error just checking if table exists, it might not exist
      const errorObj = tableCheckError as any;
      if (errorObj?.code === '42P01' || errorObj?.message?.toLowerCase().includes('does not exist')) {
        console.warn('Table current_accounts does not exist, returning empty array');
        return Response.json([]);
      }
    }
    
    console.log('DEBUG: About to execute query for tenant:', user.id);
    // Execute the actual query
    const { data, error, status } = await supabase
      .from('current_accounts')
      .select('id, name, email, phone, address, tax_number, tax_office, company, balance, tenant_id, created_at, updated_at')
      .eq('tenant_id', user.id);  // Filter by authenticated user's tenant ID
    console.log('DEBUG: Query executed, error:', !!error, 'status:', status);
    
    if (error) {
      console.error('SUPABASE ERROR (GET current_accounts):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: status
      });
      
      // Handle specific error cases
      if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
        // Table does not exist - return empty array instead of error
        console.warn('Table current_accounts does not exist, returning empty array');
        return Response.json([]);
      }
      
      // For RLS (Row Level Security) violations
      if (error.code === '42501' || error.message.toLowerCase().includes('permission denied')) {
        console.warn('Permission denied accessing current_accounts, returning empty array');
        return Response.json([]);
      }
      
      // For other errors, return the error message
      return Response.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    console.log('DEBUG: Successfully fetched', data?.length || 0, 'current accounts for tenant', user.id);
    return Response.json(data);
  } catch (error: any) {
    console.error('Error fetching current accounts:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });
    return Response.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accountData = await request.json();
    
    const supabase = createServerSupabaseClientWithRequest(request);
    
    const {
      data: { user }
    } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    const accountWithTenant = {
      ...accountData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: user.id  // Add tenant_id from authenticated user
    };
    
    // Validate required fields
    if (!accountWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Account name is required' }, { status: 400 });
    }


    
    const { data, error, status } = await supabase
      .from('current_accounts')
      .insert([accountWithTenant])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR (POST current_accounts):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: status
      });
      
      // Handle specific error cases
      if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
        // Table does not exist
        console.error('Table current_accounts does not exist for insert operation');
        return Response.json({ error: 'Accounts table does not exist' }, { status: 500 });
      }
      
      // For RLS (Row Level Security) violations
      if (error.code === '42501' || error.message.toLowerCase().includes('permission denied')) {
        console.error('Permission denied inserting into current_accounts');
        return Response.json({ error: 'Permission denied' }, { status: 403 });
      }
      
      // For other errors, return the error message
      return Response.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating current account:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}