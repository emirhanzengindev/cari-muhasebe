import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const body = await request.json();
    const { user_id, role } = body;
    
    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'user_id and role required' },
        { status: 400 }
      );
    }

    // Supabase RPC çağrısı
    const { error } = await supabase.rpc('upsert_user_role', { 
      p_user_id: user_id, 
      p_role: role 
    });

    if (error) {
      console.error('Error upserting user role:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}