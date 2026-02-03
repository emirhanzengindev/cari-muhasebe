import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    
    // Direct RPC call to delete user role
    const { error } = await supabase.rpc('delete_user_role', { 
      p_user_id: user_id 
    });

    if (error) {
      console.error('Error deleting role:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err: any) {
    console.error('Delete role error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}