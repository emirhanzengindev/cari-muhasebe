-- Fix products RLS policies to tolerate missing/late tenant_id claim in JWT.
-- We still enforce tenant isolation by matching tenant_id to either JWT tenant_id
-- (when present) or auth.uid() as a safe fallback.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

CREATE POLICY "products_select" ON public.products
FOR SELECT TO authenticated
USING (
  tenant_id = COALESCE((NULLIF(auth.jwt() ->> 'tenant_id', ''))::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

CREATE POLICY "products_insert" ON public.products
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = COALESCE((NULLIF(auth.jwt() ->> 'tenant_id', ''))::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

CREATE POLICY "products_update" ON public.products
FOR UPDATE TO authenticated
USING (
  tenant_id = COALESCE((NULLIF(auth.jwt() ->> 'tenant_id', ''))::uuid, auth.uid())
  OR tenant_id = auth.uid()
)
WITH CHECK (
  tenant_id = COALESCE((NULLIF(auth.jwt() ->> 'tenant_id', ''))::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

CREATE POLICY "products_delete" ON public.products
FOR DELETE TO authenticated
USING (
  tenant_id = COALESCE((NULLIF(auth.jwt() ->> 'tenant_id', ''))::uuid, auth.uid())
  OR tenant_id = auth.uid()
);
