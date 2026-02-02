export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClient, createServerSupabaseClientForRLS } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/current-accounts called')
    console.log('DEBUG: Request method:', request.method)
    console.log('DEBUG: Request URL:', request.url)
    
    console.log('DEBUG: Creating Supabase client...');
    const supabase = await createServerSupabaseClientForRLS(request);
    console.log('DEBUG: Supabase client created successfully');
    
    // EXTENDED DEBUG: Multiple layers of auth verification
    
    // Layer 1: Direct auth.getUser()
    const { data: { user: debugUser }, error: debugError } = await supabase.auth.getUser();
    console.log('DEBUG: LAYER 1 - supabase.auth.getUser():');
    console.log('  User ID:', debugUser?.id || 'NULL');
    console.log('  User email:', debugUser?.email || 'NULL');
    console.log('  Auth error:', debugError?.message || 'None');
    
    // Layer 2: Database JWT context check
    try {
      console.log('DEBUG: LAYER 2 - Attempting database JWT context check...');
      const { data: jwtResult, error: jwtDbError } = await supabase.rpc('debug_jwt_context');
      console.log('DEBUG: DATABASE JWT CONTEXT RESULT:');
      console.log('  Full result:', JSON.stringify(jwtResult, null, 2));
      console.log('  DB Error:', jwtDbError?.message || 'None');
    } catch (rpcError) {
      console.log('DEBUG: RPC call failed - trying alternative method');
      
      // Alternative method: Direct SQL query simulation
      try {
        // This simulates what the debug_jwt_context function would return
        const simulatedResult = {
          auth_uid: debugUser?.id || null,
          jwt_sub: debugUser?.id || null,
          jwt_tenant_id: debugUser?.user_metadata?.tenant_id || debugUser?.id || null,
          jwt_email: debugUser?.email || null,
          current_user: 'authenticated', // This would be the actual DB value
          session_user: 'authenticated'  // This would be the actual DB value
        };
        console.log('DEBUG: SIMULATED JWT CONTEXT (based on auth.getUser()):');
        console.log('  ', JSON.stringify(simulatedResult, null, 2));
      } catch (simError) {
        console.log('DEBUG: Even simulation failed:', simError);
      }
    }
    
    // Layer 3: Raw JWT payload decoding
    const authHeader = request.headers.get('authorization');
    console.log('DEBUG: LAYER 3 - Raw JWT analysis:');
    console.log('  Authorization header present:', !!authHeader);
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('  Token length:', token.length);
      
      try {
        // Decode JWT payload (second part of JWT)
        const payloadPart = token.split('.')[1];
        const payloadBuffer = Buffer.from(payloadPart, 'base64');
        const payload = JSON.parse(payloadBuffer.toString('utf-8'));
        
        console.log('DEBUG: RAW JWT PAYLOAD DECODED:');
        console.log('  sub:', payload.sub || 'MISSING');
        console.log('  tenant_id:', payload.tenant_id || 'MISSING');
        console.log('  email:', payload.email || 'MISSING');
        console.log('  exp:', payload.exp ? new Date(payload.exp * 1000).toISOString() : 'MISSING');
        console.log('  iat:', payload.iat ? new Date(payload.iat * 1000).toISOString() : 'MISSING');
        
        // Verify token is not expired
        if (payload.exp) {
          const now = Math.floor(Date.now() / 1000);
          const isExpired = payload.exp < now;
          console.log('  Token expired:', isExpired);
          if (isExpired) {
            console.error('CRITICAL: JWT TOKEN IS EXPIRED!');
          }
        }
      } catch (decodeError) {
        console.error('DEBUG: JWT DECODING FAILED:', decodeError);
      }
    } else {
      console.log('DEBUG: No valid Bearer token found in Authorization header');
    }
    
    // Layer 4: Cookie analysis
    const reqCookieHeader = request.headers.get('cookie');
    console.log('DEBUG: LAYER 4 - Cookie analysis:');
    console.log('  Cookie header present:', !!reqCookieHeader);
    
    if (reqCookieHeader) {
      const cookies = reqCookieHeader.split(';').map(c => c.trim());
      const supabaseCookies = cookies.filter(c => c.startsWith('sb-'));
      console.log('  Supabase cookies found:', supabaseCookies.length);
      supabaseCookies.forEach(cookie => {
        console.log('    ', cookie.substring(0, 50) + (cookie.length > 50 ? '...' : ''));
      });
    }
    
    // Layer 5: Test database connectivity and basic query
    console.log('DEBUG: LAYER 5 - Database connectivity test:');
    try {
      const { data: testResult, error: testError } = await supabase
        .from('current_accounts')
        .select('id')
        .limit(1);
      
      console.log('  Basic SELECT test result:');
      console.log('    Success:', !testError);
      console.log('    Error:', testError?.message || 'None');
      console.log('    Rows returned:', testResult?.length || 0);
      
      if (testError?.code === '42501') {
        console.error('CRITICAL: RLS POLICY VIOLATION ON BASIC SELECT');
        console.error('This confirms JWT context is not reaching the database');
      }
    } catch (testException) {
      console.error('  Database test failed with exception:', testException);
    }
    
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
    console.log('DEBUG: POST /api/current-accounts called - CONSISTENT SUPABASE APPROACH');
    
    // Parse request body first
    const body = await request.json();
    console.log('DEBUG: Incoming payload:', body);
    console.log('DEBUG: Client-side tenant_id:', body.tenant_id);
    console.log('DEBUG: Client-side user_id:', body.user_id);
    
    // Get cookies for auth
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient();
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('DEBUG: Session result:', {
      hasSession: !!session,
      sessionError: sessionError?.message || null,
      userId: session?.user?.id,
      tenantId: session?.user?.user_metadata?.tenant_id
    });
    
    if (!session?.user) {
      console.log('ERROR: No authenticated user found');
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Use session data for auth, ignore client-provided values for security
    const userId = session.user.id;
    const tenantId = session.user.user_metadata?.tenant_id || userId;
    
    console.log('DEBUG: Using session-based auth info:', { userId, tenantId });
    
    // Validate the data
    const name = body.name?.trim();
    if (!name) {
      console.log('ERROR: Account name is required');
      return Response.json({ error: 'Account name is required' }, { status: 400 });
    }
    
    // Prepare insert data with server-side enforced values
    const insertData = {
      name: name,
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
      tax_number: body.taxNumber?.trim() || null,
      tax_office: body.taxOffice?.trim() || null,
      company: body.company?.trim() || null,
      is_active: body.isActive !== undefined ? body.isActive : true,
      account_type: body.accountType || 'CUSTOMER',
      tenant_id: tenantId,  // Enforced server-side
      user_id: userId,      // Enforced server-side
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('DEBUG: Final insert data prepared:', {
      name: insertData.name,
      tenant_id: insertData.tenant_id,
      user_id: insertData.user_id
    });
    
    // Perform insert using Supabase client
    const { data: insertResult, error: insertError } = await supabase
      .from('current_accounts')
      .insert([insertData])
      .select();
    
    if (insertError) {
      console.error('ERROR: Insert failed:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
      
      // Handle RLS policy violations specifically
      if (insertError.code === '42501' || insertError.message.toLowerCase().includes('row-level security')) {
        console.error('RLS POLICY VIOLATION: JWT context not properly propagated');
        return Response.json(
          { 
            error: 'Authorization failed - security policy violation',
            details: 'Ensure your session is properly authenticated with tenant access'
          }, 
          { status: 403 }
        );
      }
      
      // Return other errors as 500
      return Response.json(
        { 
          error: 'Failed to create account',
          details: insertError.message 
        }, 
        { status: 500 }
      );
    }
    
    console.log('SUCCESS: Record inserted via Supabase client');
    console.log('DEBUG: Inserted row ID:', insertResult[0]?.id);
    
    // Map the response to match frontend expectations
    const mappedData = {
      ...insertResult[0],
      created_at: new Date(insertResult[0].created_at),
      updated_at: new Date(insertResult[0].updated_at),
      isActive: insertResult[0].is_active,
      accountType: insertResult[0].account_type
    };
    
    return Response.json(mappedData, { status: 201 });
    
  } catch (err: any) {
    console.error('ERROR: Unexpected handler error', err);
    console.error('Full error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
