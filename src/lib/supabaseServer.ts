import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';

export function createServerSupabaseClientForRLS() {
  const cookieStore = cookies();
  const headerStore = headers();

  // Supabase auth token (cookie veya Authorization header)
  const accessToken =
    cookieStore.get('sb-access-token')?.value ||
    headerStore.get('authorization')?.replace('Bearer ', '');

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          Authorization: accessToken
            ? `Bearer ${accessToken}`
            : '',
        },
      },
    }
  );
}

/**
 * JWT içinden tenant_id okumak için (opsiyonel)
 */
export function getTenantIdFromJWT(token?: string) {
  if (!token) return null;
  const decoded = jwt.decode(token) as any;
  return decoded?.tenant_id ?? null;
}
