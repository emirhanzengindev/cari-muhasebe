-- Align finance account policies with the project's authenticated tenant resolver.
DO $$
BEGIN
  IF to_regprocedure('public.app_tenant_id()') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "safes_select_policy" ON public.safes';
    EXECUTE 'DROP POLICY IF EXISTS "safes_insert_policy" ON public.safes';
    EXECUTE 'DROP POLICY IF EXISTS "safes_update_policy" ON public.safes';
    EXECUTE 'DROP POLICY IF EXISTS "safes_delete_policy" ON public.safes';

    EXECUTE $policy$
      CREATE POLICY "safes_select_policy" ON public.safes
      FOR SELECT TO authenticated
      USING (tenant_id = public.app_tenant_id() OR tenant_id = auth.uid())
    $policy$;
    EXECUTE $policy$
      CREATE POLICY "safes_insert_policy" ON public.safes
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id = public.app_tenant_id() OR tenant_id = auth.uid())
    $policy$;
    EXECUTE $policy$
      CREATE POLICY "safes_update_policy" ON public.safes
      FOR UPDATE TO authenticated
      USING (tenant_id = public.app_tenant_id() OR tenant_id = auth.uid())
      WITH CHECK (tenant_id = public.app_tenant_id() OR tenant_id = auth.uid())
    $policy$;
    EXECUTE $policy$
      CREATE POLICY "safes_delete_policy" ON public.safes
      FOR DELETE TO authenticated
      USING (tenant_id = public.app_tenant_id() OR tenant_id = auth.uid())
    $policy$;
  END IF;
END
$$;
