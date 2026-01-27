export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClientWithRequest(request)

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
      .from('safes')
      .select('*')
      .eq('tenant_id', user.id)  // Filter by authenticated user's tenant ID

    // If table doesn't exist, return empty array
    if (error && status === 404) {
      console.warn('Table safes does not exist, returning empty array');
      return Response.json([]);
    }
    
    if (error) {
      console.error('SUPABASE ERROR (GET safes):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: status
      });
      
      // Handle specific error cases
      if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
        // Table does not exist - return empty array instead of error
        console.warn('Table safes does not exist, returning empty array');
        return Response.json([]);
      }
      
      // For other errors, return the error message
      return Response.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching safes:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const safeData = await request.json();
    
    const supabase = createServerSupabaseClientWithRequest(request);
    
    const {
      data: { user }
    } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    const safeWithTenant = {
      ...safeData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: user.id  // Add tenant_id from authenticated user
    };
    
    // Validate required fields
    if (!safeWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Safe name is required' }, { status: 400 });
    }

    const { data, error, status } = await supabase
      .from('safes')
      .insert([safeWithTenant])
      .select()
      .single();

    if (error && status === 404) {
      console.error('Table safes does not exist for insert operation');
      return Response.json({ error: 'Safes table does not exist' }, { status: 500 });
    }
    
    if (error) {
      console.error('SUPABASE ERROR (POST safes):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating safe:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}