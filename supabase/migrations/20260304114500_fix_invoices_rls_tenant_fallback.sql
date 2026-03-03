-- Normalize invoices RLS to support tenant_id claim + auth.uid() fallback.

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;

CREATE POLICY "invoices_select" ON public.invoices
FOR SELECT TO authenticated
USING (
  tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

CREATE POLICY "invoices_insert" ON public.invoices
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

CREATE POLICY "invoices_update" ON public.invoices
FOR UPDATE TO authenticated
USING (
  tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
)
WITH CHECK (
  tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

CREATE POLICY "invoices_delete" ON public.invoices
FOR DELETE TO authenticated
USING (
  tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
);
