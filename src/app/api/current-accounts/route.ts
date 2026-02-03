export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClient, createServerSupabaseClientForRLS, createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

// EMERGENCY TEST ENDPOINT
export async function OPTIONS() {
  console.log('!!! EMERGENCY: /api/current-accounts OPTIONS called !!!');
  return new Response('OK', { status: 200 });
}

async function makeSupabaseClient(request: NextRequest) {
  // Use the robust client with proper session setup
  return await createServerSupabaseClientWithRequest(request);
}

export async function GET(request: NextRequest) {
  // EMERGENCY DEBUG - This should appear in logs
  console.log('!!! EMERGENCY: /api/current-accounts GET handler called !!!');
  
  try {
    console.log('DEBUG: GET /api/current-accounts called');
    
    // Extract user from Authorization header JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('DEBUG: No Authorization header');
      return new Response(JSON.stringify({ error: 'Auth session missing' }), { status: 401 });
    }
    
    const token = authHeader.substring(7);
    let user_id: string | null = null;
    
    try {
      // Decode JWT payload (without verification - the token was already sent by client)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      user_id = payload.sub;
      console.log('DEBUG: JWT payload decoded, user_id:', user_id);
    } catch (err) {
      console.error('DEBUG: JWT decode error:', err);
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
    
    if (!user_id) {
      console.warn('DEBUG: No user_id in token');
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    console.log('DEBUG: About to call makeSupabaseClient');
    const supabase = await makeSupabaseClient(request);
    console.log('DEBUG: Supabase client created successfully');

    // 3) Temel sorgu (güvenli alan listesi ile)
    const { data, error } = await supabase
      .from('current_accounts')
      .select('id, name, phone, balance, tenant_id, created_at, updated_at, is_active, account_type')
      .eq('tenant_id', user_id);

    if (error) {
      console.error('ERROR fetching current_accounts:', error);
      if (error.code === '42501' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
        // RLS bağlamı gelmiyor — boş dizi döndürelim
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (error.code === '42P01' || (error.message && error.message.toLowerCase().includes('does not exist'))) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Mapleme
    const mapped = (data || []).map((row: any) => ({
      ...row,
      created_at: row.created_at ? new Date(row.created_at) : null,
      updated_at: row.updated_at ? new Date(row.updated_at) : null,
      isActive: row.is_active ?? true,
      accountType: row.account_type ?? 'CUSTOMER'
    }));

    return new Response(JSON.stringify(mapped), { status: 200 });

  } catch (err: any) {
    console.error('Unhandled GET error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // EMERGENCY DEBUG - This should appear in logs
  console.log('!!! EMERGENCY: /api/current-accounts POST handler called !!!');
  
  try {
    console.log('DEBUG: POST /api/current-accounts called');

    // Extract user from Authorization header JWT (same approach as GET)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('DEBUG: No Authorization header in POST');
      return new Response(JSON.stringify({ error: 'Auth session missing' }), { status: 401 });
    }
    
    const token = authHeader.substring(7);
    let user_id: string | null = null;
    
    try {
      // Decode JWT payload (without verification - the token was already sent by client)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      user_id = payload.sub;
      console.log('DEBUG: JWT payload decoded in POST, user_id:', user_id);
    } catch (err) {
      console.error('DEBUG: JWT decode error in POST:', err);
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
    
    if (!user_id) {
      console.warn('DEBUG: No user_id in token (POST)');
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    // Read request body BEFORE creating Supabase client to avoid stream consumption issues
    let body: any = {};
    try {
      body = await request.json();
      console.log('DEBUG: incoming body', body);
    } catch (err) {
      console.error('DEBUG: Failed to parse request body:', err);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }

    // DEBUG: Log all request headers to diagnose inconsistent auth
    console.log('DEBUG: ===== REQUEST HEADERS DEBUG =====');
    console.log('DEBUG: Authorization header:', request.headers.get('authorization') ? 'PRESENT' : 'MISSING');
    console.log('DEBUG: Cookie header:', request.headers.get('cookie') ? 'PRESENT' : 'MISSING');
    const allHeaders = Object.fromEntries(request.headers);
    console.log('DEBUG: All headers keys:', Object.keys(allHeaders));
    
    // Create Supabase client with Authorization header passed through
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: authHeader ? { authorization: authHeader } : {}
        }
      }
    );
    console.log('DEBUG: Supabase client created with Authorization:', authHeader ? 'YES' : 'NO');

    const userId = user_id;
    const tenantId = user_id;
    
    console.log('DEBUG: Using authenticated user:', { userId, tenantId });
    
    // Basit validasyon
    const name = (body.name || '').trim();
    if (!name) 
      return new Response(JSON.stringify({ error: 'Account name is required' }), { status: 400 });

    const insertRow = {
      name,
      phone: body.phone ?? null,
      address: body.address ?? null,
      tax_number: body.taxNumber ?? null,
      tax_office: body.taxOffice ?? null,
      company: body.company ?? null,
      is_active: body.isActive ?? true,
      account_type: body.accountType ?? 'CUSTOMER',
      tenant_id: tenantId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('DEBUG: About to insert row:', insertRow);
    
    // Execute insert with retry on network failure
    let insertData = null;
    let insertError = null;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        console.log(`DEBUG: Insert attempt ${retries + 1}/${maxRetries}`);
        const result = await supabaseAnon
          .from('current_accounts')
          .insert([insertRow])
          .select();
        
        insertData = result.data;
        insertError = result.error;
        
        if (!insertError) {
          console.log('DEBUG: Insert operation completed successfully');
          break;
        } else if (retries < maxRetries - 1) {
          console.log(`DEBUG: Insert error on attempt ${retries + 1}, retrying...`, insertError.message);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 200)); // Longer delay before retry
          continue;
        }
        break;
      } catch (queryErr: any) {
        console.error(`DEBUG: Insert query threw exception on attempt ${retries + 1}:`, {
          message: queryErr?.message,
          name: queryErr?.name
        });
        if (retries < maxRetries - 1) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        } else {
          throw queryErr;
        }
      }
    }
    
    console.log('DEBUG: Insert result - data:', insertData, 'error:', insertError);

    if (insertError) {
      console.error('Insert error', insertError);
      if (insertError.code === '42501' || (insertError.message && insertError.message.toLowerCase().includes('row-level security'))) {
        return new Response(JSON.stringify({ error: 'Authorization failed - security policy violation' }), { status: 403 });
      }
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
    }
    
    const inserted = insertData?.[0] ?? null;
    return new Response(JSON.stringify(inserted), { status: 201 });

  } catch (err: any) {
    console.error('Unhandled POST error:', {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      cause: err?.cause
    });
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: err?.message || 'Unknown error'
    }), { status: 500 });
  }
}