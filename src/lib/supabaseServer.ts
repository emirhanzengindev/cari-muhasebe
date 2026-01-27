import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}

// Function to create a Supabase client that reads cookies automatically - Updated for Vercel deployment
export function createServerSupabaseClient() {
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          try {
            const cookieStore = cookies();
            // Next.js 14 returns a synchronous cookies object
            // Use type assertion to handle the typing issue
            const syncCookieStore = cookieStore as any;
            const value = syncCookieStore.get(name)?.value;
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
            const cookieStore = cookies();
            const syncCookieStore = cookieStore as any;
            syncCookieStore.set(name, value, options);
            if (name.startsWith('sb-')) {
              console.log('DEBUG: Supabase cookie set:', name);
            }
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: any) {
          try {
            const cookieStore = cookies();
            const syncCookieStore = cookieStore as any;
            syncCookieStore.delete({ name, ...options });
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
export function createServerSupabaseClientWithRequest(request: NextRequest) {
  try {
    console.log('DEBUG: createServerSupabaseClientWithRequest called')
    
    // Extract Authorization header if present
    const authorizationHeader = request.headers.get('authorization')
    console.log('DEBUG: Authorization header from request:', authorizationHeader ? 'Present' : 'Absent')
    if (authorizationHeader) {
      console.log('DEBUG: Authorization header first 20 chars:', authorizationHeader.substring(0, 20) + '...')
    }
    
    // Extract other important headers
    console.log('DEBUG: Request headers:', Object.fromEntries(request.headers))
    
    // Create header map for the client
    const headers = new Map(Object.entries(request.headers))
    
    const supabaseClient = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: headers.get('authorization') || '',
          },
        },
        cookies: {
          get(name: string) {
            try {
              console.log('DEBUG: cookieStore getter called with:', name)
              const cookieStore = cookies();
              console.log('DEBUG: cookieStore object keys:', Object.keys(cookieStore))
              
              // Check if cookie store is available
              if (!cookieStore || typeof cookieStore !== 'object') {
                console.error('ERROR: No cookie store available')
                return undefined;
              }
              
              const syncCookieStore = cookieStore as any;
              const result = syncCookieStore.get(name)?.value;
              console.log('DEBUG: cookieStore getter result for', name, ':', result)
              return result;
            } catch (error) {
              console.error('ERROR in cookieStore getter:', error)
              return undefined;
            }
          },
          set() {},
          remove() {},
        },
      }
    );
    
    console.log('DEBUG: Supabase client created successfully')
    return supabaseClient;
  } catch (error) {
    console.error('ERROR creating Supabase client:', error)
    throw error;
  }
}

// Function to extract tenant ID from Supabase auth
export async function getTenantIdFromJWT() {
  const supabase = createServerSupabaseClient();

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

// Function to extract tenant ID from Supabase auth with request context
export async function getTenantIdFromJWTWithRequest(request: NextRequest) {
  const supabase = createServerSupabaseClientWithRequest(request);

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