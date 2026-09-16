-- Let finance transactions use the same authenticated tenant resolver as safes.
DO $$
BEGIN
  IF to_regprocedure('public.app_tenant_id()') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.transactions ALTER COLUMN tenant_id SET DEFAULT public.app_tenant_id()';
  END IF;
END
$$;