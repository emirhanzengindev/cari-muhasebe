export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createServerSupabaseClientForRLS } from '@/lib/supabaseServer';

/* =========================
   GET /api/safes
========================= */
export async function GET() {
  try {
    const supabase = createServerSupabaseClientForRLS();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('safes')
      .select('*')
      .eq('tenant_id', user.id);

    // tablo yoksa → boş array
    if (
      error &&
      (error.code === '42P01' ||
        error.message.toLowerCase().includes('does not exist'))
    ) {
      return Response.json([]);
    }

    if (error) {
      console.error('SUPABASE GET safes error:', error);
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(data ?? []);
  } catch (error) {
    console.error('GET /api/safes error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/* =========================
   POST /api/safes
========================= */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerSupabaseClientForRLS();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }

    if (!body?.name) {
      return Response.json(
        { error: 'Safe name is required' },
        { status: 400 }
      );
    }

    const payload = {
      ...body,
      tenant_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('safes')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('SUPABASE POST safes error:', error);
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error('POST /api/safes error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
