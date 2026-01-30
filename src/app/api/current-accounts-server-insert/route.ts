import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE environment variables');
}

// Create admin client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const payload = await request.json();
    
    // Validate required fields
    if (!payload.tenant_id || !payload.user_id) {
      return Response.json({ 
        error: 'tenant_id and user_id required' 
      }, { status: 400 });
    }
    
    // Extract JWT to get the authenticated user's ID for verification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing authorization header' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    let authenticatedUserId = null;
    try {
      const jwtPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      authenticatedUserId = jwtPayload.sub;
    } catch (decodeError) {
      console.error('JWT decode error:', decodeError);
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Verify that the payload's user_id matches the authenticated user
    if (payload.user_id !== authenticatedUserId) {
      return Response.json({ error: 'Unauthorized: user_id mismatch' }, { status: 403 });
    }
    
    // Ensure tenant_id also matches the authenticated user for consistency
    if (payload.tenant_id !== authenticatedUserId) {
      console.warn('Warning: tenant_id does not match authenticated user_id');
      // For security, we'll set tenant_id to match the authenticated user
      payload.tenant_id = authenticatedUserId;
    }

    // Optional: Add additional validation/security checks here
    // For example: verify user has permission to insert this data
    
    console.log('Server-side insert with service role:', {
      tenant_id: payload.tenant_id,
      user_id: payload.user_id,
      name: payload.name
    });

    const { data, error } = await supabaseAdmin
      .from('current_accounts')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Insert error (server role):', error);
      return Response.json({ 
        error: error.message, 
        details: error 
      }, { status: 500 });
    }

    console.log('SUCCESS: Record inserted using service role');
    return Response.json({ data }, { status: 200 });

  } catch (err: any) {
    console.error('Unexpected server error:', err);
    return Response.json({ 
      error: err.message || 'unknown' 
    }, { status: 500 });
  }
}

// Optional: Add authentication verification for extra security
async function verifyAdminAccess(request: NextRequest): Promise<boolean> {
  try {
    // Extract JWT from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    
    // Create regular Supabase client to verify the token
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return false;
    }

    // Optional: Check if user has admin role
    // This would depend on your user metadata structure
    // const isAdmin = user.user_metadata?.role === 'admin';
    // return isAdmin;

    return true; // For now, any authenticated user can use this endpoint
    
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return false;
  }
}