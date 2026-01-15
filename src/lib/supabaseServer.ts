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

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          console.log(`DEBUG: Getting cookie ${name}: ${value ? 'exists' : 'missing'}`);
          return value;
        },
      },
    }
  )
}

// Function to extract tenant ID from Supabase auth
export async function getTenantIdFromJWT() {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log('DEBUG: getTenantIdFromJWT called');
  console.log('DEBUG: Supabase auth error:', error);
  console.log('DEBUG: User object:', user);

  if (error || !user) {
    console.error('SUPABASE AUTH ERROR:', error)
    return null
  }

  // Get tenant_id directly from user metadata
  const tenantId = user.user_metadata?.tenant_id
  
  console.log('DEBUG: Extracted tenantId:', tenantId);

  if (!tenantId) {
    console.error('TENANT ID MISSING IN USER METADATA')
    console.error('USER METADATA:', user.user_metadata)
    return null
  }
  
  return tenantId
}