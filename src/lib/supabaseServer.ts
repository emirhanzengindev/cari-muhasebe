import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
}

// Function to extract tenant ID from JWT token
export async function getTenantIdFromJWT(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('next-auth.session-token')?.value || 
                  cookieStore.get('__Secure-next-auth.session-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify and decode JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Extract tenantId from JWT payload
    return (payload as any).tenantId || null;
  } catch (error) {
    console.error('Error extracting tenant ID from JWT:', error);
    return null;
  }
}

// Function to create a Supabase client with tenant ID in headers
export function createServerSupabaseClient(tenantId: string) {
  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      global: {
        headers: {
          'x-tenant-id': tenantId
        }
      }
    }
  );
}