import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}

// Function to create a Supabase client that reads cookies automatically
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error)
          }
        },
      },
    }
  )
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
    // Additional check to see if cookies exist
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token');
    const refreshToken = cookieStore.get('sb-refresh-token');
    console.error('Access token exists:', !!accessToken);
    console.error('Refresh token exists:', !!refreshToken);
    return null;
  }

  // Get tenant_id directly from user metadata
  let tenantId = user.user_metadata?.tenant_id;
  
  // Clean tenant ID if it has unwanted suffix (fix for malformed tenant IDs)
  if (tenantId && typeof tenantId === 'string') {
    if (tenantId.endsWith('ENANT_ID')) {
      tenantId = tenantId.replace(/ENANT_ID$/, '');
    }
  }
  
  if (!tenantId) {
    console.error('TENANT ID MISSING IN USER METADATA');
    return null;
  }
  
  return tenantId;
}