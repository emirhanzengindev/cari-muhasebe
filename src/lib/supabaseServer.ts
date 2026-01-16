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

// Function to create a Supabase client that reads cookies automatically - Updated for Vercel deployment
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          if (name.startsWith('sb-')) {
            console.log('DEBUG: Supabase cookie found:', name, 'exists:', !!value)
          }
          return value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
            if (name.startsWith('sb-')) {
              console.log('DEBUG: Supabase cookie set:', name)
            }
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options })
            if (name.startsWith('sb-')) {
              console.log('DEBUG: Supabase cookie removed:', name)
            }
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
    return null;
  }

  // Always use user.id as tenantId since it's the correct UUID
  return user.id;
}