export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClient, createServerSupabaseClientForRLS } from '@/lib/supabaseServer';

async function makeSupabaseClient(request: NextRequest) {
  // Mevcut wrapper fonksiyonumuzu kullanıyoruz
  return createServerSupabaseClientForRLS(request);
}

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/current-accounts called');
    const supabase = await makeSupabaseClient(request);

    // 1) RPC ile DB session/JWT context kontrolü
    let rpcData = null;
    let rpcError = null;
    try {
      const rpcResult = await supabase.rpc('debug_current_user_context');
      rpcData = rpcResult.data;
      rpcError = rpcResult.error;
    } catch (err) {
      console.log('DEBUG: RPC debug_current_user_context not available or failed:', err);
    }
    console.log('DEBUG: RPC debug_current_user_context result:', rpcData, rpcError?.message || null);

    // 2) Auth üzerinden user kontrolü
    const { data: authData, error: authErr } = await supabase.auth.getUser();

    const user = authData?.user ?? null;

    console.log('DEBUG: auth.getUser() =>', { 
      id: user?.id ?? null, 
      email: user?.email ?? null, 
      authErr: authErr?.message ?? null 
    });

    if (!user) {
      console.warn('DEBUG: No authenticated user found');
      return new Response(JSON.stringify({ error: 'Auth session missing' }), { status: 401 });
    }

    // 3) Temel sorgu (güvenli alan listesi ile)
    const { data, error } = await supabase
      .from('current_accounts')
      .select('id, name, phone, balance, tenant_id, created_at, updated_at, is_active, account_type')
      .eq('tenant_id', user.id);

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
  try {
    console.log('DEBUG: POST /api/current-accounts called');
    const supabase = await makeSupabaseClient(request);

    const body = await request.json();
    console.log('DEBUG: incoming body', body);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session ?? null;
    if (!session?.user) {
      console.warn('No session user');
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const userId = session.user.id;
    const tenantId = session.user.user_metadata?.tenant_id ?? userId;
    
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

    const { data: insertData, error: insertError } = await supabase
      .from('current_accounts')
      .insert([insertRow])
      .select();

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
    console.error('Unhandled POST error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
