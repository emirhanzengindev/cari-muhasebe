-- Updated RLS Policies for Tenant Context
-- These policies work with tenant_id from user metadata

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can insert their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can update their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can delete their tenant's current accounts" ON public.current_accounts;

DROP POLICY IF EXISTS "Users can view their tenant's transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their tenant's transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their tenant's transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their tenant's transactions" ON public.transactions;

-- Create new policies using user metadata for tenant_id
CREATE POLICY "Users can view their tenant's current accounts" 
ON public.current_accounts 
FOR SELECT 
TO authenticated 
USING (
  tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::UUID
  OR tenant_id = auth.uid()  -- Fallback to user id
);

CREATE POLICY "Users can insert their tenant's current accounts" 
ON public.current_accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (
  tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::UUID
  OR tenant_id = auth.uid()  -- Fallback to user id
);

CREATE POLICY "Users can update their tenant's current accounts" 
ON public.current_accounts 
FOR UPDATE 
TO authenticated 
USING (
  tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::UUID
  OR tenant_id = auth.uid()  -- Fallback to user id
);

CREATE POLICY "Users can delete their tenant's current accounts" 
ON public.current_accounts 
FOR DELETE 
TO authenticated 
USING (
  tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::UUID
  OR tenant_id = auth.uid()  -- Fallback to user id
);

-- Transactions policies
CREATE POLICY "Users can view their tenant's transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated 
USING (
  tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::UUID
  OR tenant_id = auth.uid()  -- Fallback to user id
);

CREATE POLICY "Users can insert their tenant's transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated 
WITH CHECK (
  tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::UUID
  OR tenant_id = auth.uid()  -- Fallback to user id
);

CREATE POLICY "Users can update their tenant's transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated 
USING (
  tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::UUID
  OR tenant_id = auth.uid()  -- Fallback to user id
);

CREATE POLICY "Users can delete their tenant's transactions" 
ON public.transactions 
FOR DELETE 
TO authenticated 
USING (
  tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::UUID
  OR tenant_id = auth.uid()  -- Fallback to user id
);