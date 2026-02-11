import { NextRequest, NextResponse } from 'next/server';
import {
  createServerSupabaseClientForRLS,
} from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'user_id and role required' },
        { status: 400 }
      );
    }

    // 🔴 KRİTİK: await EKLENDİ
    const supabase = await createServerSupabaseClientForRLS();

    // RPC çağrısı
    const { error } = await supabase.rpc('upsert_user_role', {
      p_user_id: user_id,
      p_role: role,
    });

    if (error) {
      console.error('Error assigning role:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true },
      { status: 200 }
    );
  } catch (err) {
    console.error('Assign role error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
