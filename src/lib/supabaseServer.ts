import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

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
      },
    }
  )
}

// Function to extract tenant ID directly from JWT token
async function getTenantIdFromToken(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    
    // Check for NextAuth session token
    const sessionToken = cookieStore.get('next-auth.session-token')?.value || 
                        cookieStore.get('__Secure-next-auth.session-token')?.value;
    
    if (!sessionToken) {
      console.log('No session token found in cookies');
      return null;
    }
    
    // Decode JWT token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(sessionToken, secret);
    
    // Extract tenant_id from payload
    const tenantId = (payload as any).tenantId || null;
    console.log('TENANT ID FROM TOKEN PAYLOAD:', tenantId);
    
    return tenantId;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

// Function to extract tenant ID from JWT using Supabase auth
export async function getTenantIdFromJWT() {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log('DEBUG AUTH:', { 
    userExists: !!user, 
    userId: user?.id, 
    hasMetadata: !!user?.user_metadata, 
    metadataKeys: user?.user_metadata ? Object.keys(user.user_metadata) : null,
    email: user?.email
  })

  if (error || !user) {
    console.error('AUTH ERROR:', error)
    return null
  }

  // Try to get tenant_id from user metadata
  let tenantId = user.user_metadata?.tenant_id
  
  // If not found, try tenantId (for backward compatibility)
  if (!tenantId) {
    tenantId = user.user_metadata?.tenantId
  }
  
  console.log('TENANT ID FROM SUPABASE AUTH:', tenantId)
  
  // If still not found, try to get from JWT token directly
  if (!tenantId) {
    console.log('Trying to get tenant ID from JWT token directly...');
    tenantId = await getTenantIdFromToken();
  }
  
  if (!tenantId) {
    console.error('USER HAS NO TENANT ID IN METADATA OR TOKEN!')
    console.error('FULL USER METADATA:', JSON.stringify(user.user_metadata, null, 2))
    console.error('FULL USER DATA:', JSON.stringify(user, null, 2))
  }

  return tenantId
}