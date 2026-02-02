export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClient, createServerSupabaseClientForRLS } from '@/lib/supabaseServer';

async function makeSupabaseClient(request: NextRequest) {
  // Mevcut wrapper fonksiyonumuzu kullanıyoruz
  return createServerSupabaseClientForRLS(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('DEBUG: POST /api/current-accounts called');
    const supabase = await makeSupabaseClient(request);

    const body = await request.json();
    console.log('DEBUG: incoming body', body);

    // Detaylı session debug
    console.log('DEBUG: Checking session with multiple methods...');
    
    // Yöntem 1: Standart getSession
    const { data: sessionData1, error: sessionError1 } = await supabase.auth.getSession();
    console.log('DEBUG: Method 1 - getSession:', {
      hasSession: !!sessionData1?.session,
      userId: sessionData1?.session?.user?.id,
      tenantId: sessionData1?.session?.user?.user_metadata?.tenant_id,
      error: sessionError1?.message
    });

    // Yöntem 2: getUser doğrudan
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('DEBUG: Method 2 - getUser:', {
      hasUser: !!userData?.user,
      userId: userData?.user?.id,
      tenantId: userData?.user?.user_metadata?.tenant_id,
      error: userError?.message
    });

    // Yöntem 3: RPC ile JWT context kontrolü
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('debug_current_user_context');
      console.log('DEBUG: Method 3 - RPC debug:', {
        rpcData: rpcData,
        rpcError: rpcError?.message
      });
    } catch (rpcException) {
      console.log('DEBUG: RPC method failed:', rpcException);
    }

    // En güvenli yöntem: getUser
    const user = userData?.user;
    if (!user) {
      console.warn('DEBUG: No authenticated user found via getUser');
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const userId = user.id;
    const tenantId = user.user_metadata?.tenant_id ?? userId;
    
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