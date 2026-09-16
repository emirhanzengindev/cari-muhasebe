-- Let the database derive the tenant for safe inserts from the authenticated session.
DO $$
BEGIN
  IF to_regprocedure('public.app_tenant_id()') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.safes ALTER COLUMN tenant_id SET DEFAULT public.app_tenant_id()';
  END IF;
END
$$;
