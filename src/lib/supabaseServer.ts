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

  // Log for debugging
  console.log('DEBUG: Creating Supabase client');
  
  // Log all available cookies
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;
  const providerToken = cookieStore.get('sb-provider-token')?.value;
  const providerRefreshToken = cookieStore.get('sb-provider-refresh-token')?.value;
  
  console.log('DEBUG: sb-access-token exists:', !!accessToken);
  console.log('DEBUG: sb-refresh-token exists:', !!refreshToken);
  console.log('DEBUG: sb-provider-token exists:', !!providerToken);
  console.log('DEBUG: sb-provider-refresh-token exists:', !!providerRefreshToken);

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          console.log(`DEBUG: Getting cookie ${name}: ${value ? 'exists' : 'missing'}`);
          return value;
        },
        set(name: string, value: string, options: any) {
          console.log(`DEBUG: Setting cookie ${name}: ${value ? 'exists' : 'missing'}`);
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: any) {
          console.log(`DEBUG: Removing cookie ${name}`);
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error);
          }
        },
      },
    }
  );

  return supabase;
}

// Function to extract tenant ID from Supabase auth
export async function getTenantIdFromJWT() {
  const supabase = createServerSupabaseClient();

  // First, try to get the user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log('DEBUG: getTenantIdFromJWT called');
  console.log('DEBUG: Supabase auth error:', error);
  console.log('DEBUG: User object:', user);
  console.log('DEBUG: User metadata:', user?.user_metadata);

  if (error || !user) {
    console.error('SUPABASE AUTH ERROR:', error);
    console.error('USER OBJECT:', user);
    // Check if there are cookies available
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    console.log('DEBUG: Access token in cookies:', !!accessToken);
    if (!accessToken) {
      console.error('ERROR: No access token found in cookies');
    }
    return null;
  }

  // Get tenant_id directly from user metadata
  let tenantId = user.user_metadata?.tenant_id;
  
  // Clean tenant ID if it has unwanted suffix (fix for malformed tenant IDs)
  if (tenantId && typeof tenantId === 'string') {
    if (tenantId.endsWith('ENANT_ID')) {
      tenantId = tenantId.replace(/ENANT_ID$/, '');
      console.log('DEBUG: Fixed malformed tenant ID by removing suffix');
    }
  }
  
  console.log('DEBUG: Extracted tenantId:', tenantId);

  if (!tenantId) {
    console.error('TENANT ID MISSING IN USER METADATA');
    console.error('USER METADATA:', user.user_metadata);
    return null;
  }
  
  return tenantId;
}