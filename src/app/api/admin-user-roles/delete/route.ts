import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClientForRLS } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClientForRLS();
    
    const body = await request.json();
    const { user_id } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id required' },
        { status: 400 }
      );
    }

    // Supabase RPC çağrısı
    const { error } = await supabase.rpc('delete_user_role', { 
      p_user_id: user_id 
    });

    if (error) {
      console.error('Error deleting user role:', error);
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