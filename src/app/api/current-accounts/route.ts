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
      .select('id, name, phone, address, tax_number, tax_office, company, balance, tenant_id, created_at, updated_at, is_active, account_type')
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
      
      // Handle PostgREST schema cache errors specifically
      if (error.code === 'PGRST204' && (error.message.includes('address') || error.message.includes('accountType') || error.message.includes('account_type'))) {
        console.warn('SCHEMA CACHE ISSUE DETECTED: Column schema cache mismatch');
        console.warn('Attempting progressive fallback strategy');
        
        // Provide specific error message for address column issue
        if (error.message.includes('address')) {
          console.warn('ADDRESS COLUMN SCHEMA CACHE ISSUE: The address column exists in the database but PostgREST schema cache is outdated. This will be resolved by the migration.');
        }
            
        // Progressive fallback strategy:
            
        // Attempt 1: Minimal fields query
        console.debug('Trying minimal fields query...');
        const { data: minimalData, error: minimalError } = await supabase
          .from('current_accounts')
          .select('id, name, tenant_id, is_active, account_type')
          .eq('tenant_id', user.id);
            
        if (!minimalError && minimalData) {
          console.info('MINIMAL FALLBACK SUCCESS: Returning essential data');
          // Map database fields to frontend interface fields
          const mappedData = minimalData?.map(account => ({
            ...account,
            created_at: (account as any).created_at ? new Date((account as any).created_at) : new Date(),
            updated_at: (account as any).updated_at ? new Date((account as any).updated_at) : new Date(),
            isActive: account.is_active !== undefined ? account.is_active : true,
            accountType: account.account_type || 'CUSTOMER'
          })) || [];
          return Response.json(mappedData);
        }
            
        // Attempt 2: Core fields without email
        console.debug('Trying core fields query...');
        const { data: coreData, error: coreError } = await supabase
          .from('current_accounts')
          .select('id, name, phone, balance, tenant_id, created_at, is_active, account_type')
          .eq('tenant_id', user.id);
            
        if (!coreError && coreData) {
          console.info('CORE FALLBACK SUCCESS: Returning core data');
          // Map database fields to frontend interface fields
          const mappedData = coreData?.map(account => ({
            ...account,
            created_at: new Date(account.created_at),
            updated_at: (account as any).updated_at ? new Date((account as any).updated_at) : new Date(),
            isActive: account.is_active !== undefined ? account.is_active : true,
            accountType: account.account_type || 'CUSTOMER'
          })) || [];
          return Response.json(mappedData);
        }
            
        // Attempt 3: Full query without email
        console.debug('Trying full query without email...');
        const { data: fullNoEmailData, error: fullNoEmailError } = await supabase
          .from('current_accounts')
          .select('id, name, phone, tax_number, tax_office, company, balance, tenant_id, created_at, updated_at, is_active, account_type')
          .eq('tenant_id', user.id);
            
        if (!fullNoEmailError && fullNoEmailData) {
          console.info('FULL NO EMAIL FALLBACK SUCCESS: Returning complete data minus email');
          // Map database fields to frontend interface fields
          const mappedData = fullNoEmailData?.map(account => ({
            ...account,
            created_at: new Date(account.created_at),
            updated_at: new Date(account.updated_at),
            isActive: account.is_active !== undefined ? account.is_active : true,
            accountType: account.account_type || 'CUSTOMER'
          })) || [];
          return Response.json(mappedData);
        }
            
        // All fallbacks failed
        console.error('ALL FALLBACK STRATEGIES FAILED');
        console.error('Minimal error:', minimalError?.message);
        console.error('Core error:', coreError?.message);
        console.error('Full no email error:', fullNoEmailError?.message);
                
        // Try one final fallback without the problematic columns
        console.debug('Trying final fallback without accountType column...');
        try {
          const { data: finalData, error: finalError } = await supabase
            .from('current_accounts')
            .select(`
              id, name, phone, address, tax_number, tax_office, company, 
              balance, tenant_id, created_at, updated_at
            `)
            .eq('tenant_id', user.id);
                    
          if (!finalError && finalData) {
            console.info('FINAL FALLBACK SUCCESS: Returning data without accountType');
            // Map to include default values for missing fields
            const mappedData = finalData.map(account => ({
              ...account,
              created_at: new Date(account.created_at),
              updated_at: new Date(account.updated_at),
              isActive: true,  // Default value
              accountType: 'CUSTOMER'  // Default value
            }));
            return Response.json(mappedData);
          }
        } catch (finalFallbackError) {
          console.error('FINAL FALLBACK ALSO FAILED:', finalFallbackError);
        }
                
        // Return an empty array as the ultimate fallback
        // This indicates that the schema cache issue is preventing access to the data
        // The migration will resolve this issue
        console.warn('ULTIMATE FALLBACK: Returning empty array due to schema cache issue. This will be resolved by the migration.');
        return Response.json([]);
      }
      
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
    
    // Map database fields to frontend interface fields
    const mappedData = data?.map(account => ({
      ...account,
      created_at: new Date(account.created_at),
      updated_at: new Date(account.updated_at),
      isActive: account.is_active !== undefined ? account.is_active : true,
      accountType: account.account_type || 'CUSTOMER'
    })) || [];
    
    return Response.json(mappedData);
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
    console.log('DEBUG: POST /api/current-accounts called');
    const accountData = await request.json();
    
    // Log authorization header
    const authHeader = request.headers.get('authorization');
    console.log('DEBUG: Authorization header present:', !!authHeader);
    if (authHeader) {
      console.log('DEBUG: Authorization header length:', authHeader.length);
    }
    
    const supabase = createServerSupabaseClientWithRequest(request);
    
    console.log('DEBUG: Getting user from Supabase...');
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    
    console.log('DEBUG: User result:', { user: !!user, error: userError });
    
    if (!user) {
      console.log('DEBUG: No user found, returning 401');
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    console.log('DEBUG: User ID:', user.id);
    console.log('DEBUG: User metadata:', user.user_metadata);
    
    // Extract tenant_id from user's metadata
    const userMetadata = user.user_metadata || {};
    const tenantId = userMetadata.tenant_id || user.id; // Fallback to user.id if tenant_id not in metadata
    
    const accountWithTenant = {
      ...accountData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: tenantId,  // Add tenant_id from user's metadata
      is_active: accountData.isActive,  // Map camelCase to snake_case
      account_type: accountData.accountType  // Map camelCase to snake_case
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
      
      // Handle PostgREST schema cache errors specifically
      if (error.code === 'PGRST204' && (error.message.includes('accountType') || error.message.includes('account_type') || error.message.includes('is_active'))) {
        console.warn('SCHEMA CACHE ISSUE DETECTED during insert: Column schema cache mismatch');
        console.warn('Attempting insert without problematic fields');
        
        // Remove problematic fields and try again
        const { is_active, account_type, isActive, accountType, ...cleanAccountData } = accountWithTenant;
        
        const { data: cleanData, error: cleanError } = await supabase
          .from('current_accounts')
          .insert([{ ...cleanAccountData }])
          .select()
          .single();
          
        if (cleanError) {
          console.error('Clean insert also failed:', cleanError);
          return Response.json({ 
            error: cleanError.message,
            code: cleanError.code,
            details: cleanError.details
          }, { status: 500 });
        }
        
        // Map the response data
        const mappedData = {
          ...cleanData,
          created_at: new Date(cleanData.created_at),
          updated_at: new Date(cleanData.updated_at),
          isActive: cleanData.is_active !== undefined ? cleanData.is_active : true,
          accountType: cleanData.account_type || 'CUSTOMER'
        };
        
        return Response.json(mappedData);
      }
      
      // For other errors, return the error message
      return Response.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    // Map database fields to frontend interface fields
    const mappedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      isActive: data.is_active !== undefined ? data.is_active : true,
      accountType: data.account_type || 'CUSTOMER'
    };
    
    return Response.json(mappedData);
  } catch (error) {
    console.error('Error creating current account:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
