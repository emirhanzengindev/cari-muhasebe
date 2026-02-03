-- Enable RLS on current_accounts table
ALTER TABLE public.current_accounts ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can only see rows where tenant_id matches their JWT tenant_id
CREATE POLICY "current_accounts_select"
ON public.current_accounts
FOR SELECT
TO authenticated
USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- INSERT policy: Users can only insert rows where tenant_id matches their JWT tenant_id
CREATE POLICY "current_accounts_insert"
ON public.current_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- UPDATE policy: Users can only update rows where tenant_id matches their JWT tenant_id
CREATE POLICY "current_accounts_update"
ON public.current_accounts
FOR UPDATE
TO authenticated
USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
)
WITH CHECK (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- DELETE policy: Users can only delete rows where tenant_id matches their JWT tenant_id
CREATE POLICY "current_accounts_delete"
ON public.current_accounts
FOR DELETE
TO authenticated
USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- Create index on tenant_id for performance
CREATE INDEX IF NOT EXISTS idx_current_accounts_tenant_id 
ON public.current_accounts(tenant_id);
