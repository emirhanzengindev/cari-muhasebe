import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

// Helper function to parse cookies from header string
function parseCookies(cookieHeader: string | null): Map<string, string> {
  const cookiesMap = new Map<string, string>();
  if (!cookieHeader) return cookiesMap;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookiesMap.set(name, value);
    }
  });
  
  return cookiesMap;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}

// Function to create a Supabase client that reads cookies automatically - Updated for Vercel deployment
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          try {
            const value = cookieStore.get(name)?.value;
            if (name.startsWith('sb-')) {
              console.log('DEBUG: Supabase cookie found:', name, 'exists:', !!value);
            }
            return value;
          } catch (error) {
            console.error('Error getting cookie:', error);
            return undefined;
          }
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options);
            if (name.startsWith('sb-')) {
              console.log('DEBUG: Supabase cookie set:', name);
            }
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
            if (name.startsWith('sb-')) {
              console.log('DEBUG: Supabase cookie removed:', name);
            }
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error);
          }
        },
      },
    }
  );
}

// Function to create a Supabase client for API routes with request context
export async function createServerSupabaseClientWithRequest(request: NextRequest) {
  try {
    console.log('DEBUG: createServerSupabaseClientWithRequest called')
    
    // Extract Authorization header if present
    const authorizationHeader = request.headers.get('authorization') || '';
    console.log('DEBUG: Authorization header from request:', authorizationHeader ? 'Present' : 'Absent')
    
    // Create client with Authorization header - PostgREST will read this for RLS
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      global: { 
        headers: authorizationHeader ? { authorization: authorizationHeader } : {}
      },
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
      auth: {
        detectSessionInUrl: false,
        persistSession: false,
      },
    });

    console.log('DEBUG: Supabase client created successfully with Authorization header')
    return supabase;
  } catch (error) {
    console.error('ERROR creating Supabase client:', error)
    throw error;
  }
}

// Function to extract tenant ID from Supabase auth
export async function getTenantIdFromJWT() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('SUPABASE AUTH ERROR:', error);
    return null;
  }

  // Always use user.id as tenantId since it's the correct UUID
  return user.id;
}

// Function to create a Supabase client with proper RLS authentication
export async function createServerSupabaseClientForRLS(request: NextRequest) {
  console.log('DEBUG: createServerSupabaseClientForRLS called');
  
  // Only extract the Authorization header - don't pass all headers
  const authHeader = request.headers.get('authorization') || '';
  console.log('DEBUG: Authorization header present:', !!authHeader);
  
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { authorization: authHeader } : {}
    },
    cookies: {
      get: () => undefined,
      set: () => {},
      remove: () => {},
    },
  });

  return supabase;
}

// Function to extract tenant ID from Supabase auth with request context
export async function getTenantIdFromJWTWithRequest(request: NextRequest) {
  console.log('DEBUG: getTenantIdFromJWTWithRequest called');
  
  // First try to get user from Supabase client
  const supabase = await createServerSupabaseClientWithRequest(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('SUPABASE AUTH ERROR:', error);
  }

  if (user) {
    console.log('DEBUG: User found:', user.id);
    // Always use user.id as tenantId since it's the correct UUID
    return user.id;
  }

  // Fallback: try to extract from JWT directly
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Decode JWT payload (without verification)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('DEBUG: JWT payload sub:', payload.sub);
      if (payload.sub) {
        return payload.sub; // sub is the user ID
      }
    } catch (decodeError) {
      console.error('DEBUG: JWT decode error:', decodeError);
    }
  }

  console.log('DEBUG: No tenant ID found');
  return null;
}
