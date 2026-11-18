import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveTenantId } from "@/lib/tenant";

/**
 * Ana Supabase client (RLS için)
 */
export async function createServerSupabaseClientForRLS() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

/**
 * 🔥 BACKWARD COMPATIBILITY
 * Eski kodları bozmamak için alias exportlar
 */

export const createServerSupabaseClient =
  createServerSupabaseClientForRLS;

export const createServerSupabaseClientWithRequest =
  createServerSupabaseClientForRLS;

/**
 * Company (tenant) id of the signed-in user, from app_metadata only.
 * Same value as public.app_tenant_id() in the database; see src/lib/tenant.ts.
 */
export async function getTenantIdFromJWT() {
  const supabase = await createServerSupabaseClientForRLS();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return resolveTenantId(user);
}

export const getTenantIdFromJWTWithRequest = getTenantIdFromJWT;
