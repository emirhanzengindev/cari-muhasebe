import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    
    // Direct RPC call to get user role
    const { data, error } = await supabase.rpc('get_user_role', { 
      p_user_id: user_id 
    });

    if (error) {
      console.error('Error getting role:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ role: data }, { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err: any) {
    console.error('Get role error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}