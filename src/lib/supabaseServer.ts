import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
 * Tenant ID artık JWT’den otomatik geliyor.
 * Ama eski kod kırılmasın diye dummy fonksiyon bırakıyoruz.
 */
export async function getTenantIdFromJWT() {
  const supabase = await createServerSupabaseClientForRLS();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export const getTenantIdFromJWTWithRequest = getTenantIdFromJWT;
