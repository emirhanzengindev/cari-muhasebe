-- Cash accounts used by the finance screen.
CREATE TABLE IF NOT EXISTS public.safes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  balance numeric(14, 2) NOT NULL DEFAULT 0,
  tenant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safes_tenant_id ON public.safes(tenant_id);

ALTER TABLE public.safes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "safes_select_policy" ON public.safes;
DROP POLICY IF EXISTS "safes_insert_policy" ON public.safes;
DROP POLICY IF EXISTS "safes_update_policy" ON public.safes;
DROP POLICY IF EXISTS "safes_delete_policy" ON public.safes;

CREATE POLICY "safes_select_policy"
ON public.safes FOR SELECT TO authenticated
USING (
  tenant_id = auth.uid()
  OR tenant_id = NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid
);

CREATE POLICY "safes_insert_policy"
ON public.safes FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = auth.uid()
  OR tenant_id = NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid
);

CREATE POLICY "safes_update_policy"
ON public.safes FOR UPDATE TO authenticated
USING (
  tenant_id = auth.uid()
  OR tenant_id = NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid
)
WITH CHECK (
  tenant_id = auth.uid()
  OR tenant_id = NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid
);

CREATE POLICY "safes_delete_policy"
ON public.safes FOR DELETE TO authenticated
USING (
  tenant_id = auth.uid()
  OR tenant_id = NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid
);