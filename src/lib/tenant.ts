const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type UserLike = {
  id: string;
  app_metadata?: Record<string, unknown> | null;
} | null | undefined;

/**
 * The company (tenant) id of a signed-in user.
 *
 * Reads only app_metadata, which users cannot edit. Never read
 * user_metadata here: any user can change it with supabase.auth.updateUser().
 * Mirrors public.app_tenant_id() in the database.
 */
export function resolveTenantId(user: UserLike): string | null {
  if (!user?.id) return null;
  const fromAppMetadata = user.app_metadata?.tenant_id;
  if (typeof fromAppMetadata === "string" && UUID_PATTERN.test(fromAppMetadata)) {
    return fromAppMetadata;
  }
  return user.id;
}

/**
 * Tenant ids a request may read: the company id, plus the user id for rows
 * written before the tenant migration. Both values come from the verified
 * session, never from user-editable data.
 */
export function resolveTenantCandidates(user: UserLike): string[] {
  const tenantId = resolveTenantId(user);
  if (!tenantId || !user?.id) return [];
  return Array.from(new Set([tenantId, user.id]));
}
