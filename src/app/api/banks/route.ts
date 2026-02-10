export const dynamic = 'force-dynamic'

import { NextRequest } from "next/server";
import {
  createServerSupabaseClientForRLS,
  getTenantIdFromJWT
} from '@/lib/supabaseServer'




export async function GET(request: NextRequest) {
  try {
    const supabase =  createServerSupabaseClientForRLS()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('DEBUG: Auth session missing')
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    const { data, error, status } = await supabase
      .from('banks')
      .select('*')

    // If table doesn't exist, return empty array
    if (error && status === 404) {
      console.warn('Table banks does not exist, returning empty array');
      return Response.json([]);
    }
    
    if (error) {
      console.error('SUPABASE ERROR (GET banks):', error);
      // For other errors, return the error message
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching banks:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const bankData = await request.json();
    
    const supabase = createServerSupabaseClientForRLS();

    
    const {
      data: { user }
    } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    const bankWithTenant = {
      ...bankData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: user.id  // Add tenant_id from authenticated user
    };
    
    // Validate required fields
    if (!bankWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Bank name is required' }, { status: 400 });
    }

    const { data, error, status } = await supabase
      .from('banks')
      .insert([bankWithTenant])
      .select()
      .single();

    if (error && status === 404) {
      console.error('Table banks does not exist for insert operation');
      return Response.json({ error: 'Banks table does not exist' }, { status: 500 });
    }
    
    if (error) {
      console.error('SUPABASE ERROR (POST banks):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating bank:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}