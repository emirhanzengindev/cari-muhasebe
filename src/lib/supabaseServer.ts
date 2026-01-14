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
export async function getTenantIdFromJWT(request?: Request): Promise<string | null> {
  try {
    const cookieStore = cookies();
    
    // Check all possible cookie names
    const possibleTokens = [
      cookieStore.get('next-auth.session-token'),
      cookieStore.get('__Secure-next-auth.session-token'),
      cookieStore.get('next-auth.csrf-token')
    ];
    
    console.log('COOKIE DEBUG: Available cookies:', Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value.substring(0, 20) + '...'])));
    
    const tokenCookie = possibleTokens.find(cookie => cookie?.value);
    const token = tokenCookie?.value;
    
    if (!token) {
      console.error('NO AUTH TOKEN FOUND IN COOKIES');
      return null;
    }
    
    console.log('TOKEN COOKIE NAME:', tokenCookie?.name);
    
    // Verify and decode JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    console.log('JWT PAYLOAD:', {
      sub: payload.sub,
      tenantId: (payload as any).tenantId,
      exp: payload.exp,
      iat: payload.iat
    });
    
    // Extract tenantId from JWT payload
    let tenantId = (payload as any).tenantId || null;
    
    if (!tenantId) {
      console.error('TENANT ID NOT FOUND IN JWT PAYLOAD');
      console.error('FULL PAYLOAD KEYS:', Object.keys(payload));
      
      // Fallback: Try to get tenantId from request headers if available
      if (request) {
        const headerTenantId = request.headers.get('x-tenant-id');
        if (headerTenantId) {
          console.warn('Using tenantId from headers as fallback:', headerTenantId);
          tenantId = headerTenantId;
        }
      }
    }
    
    return tenantId;
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