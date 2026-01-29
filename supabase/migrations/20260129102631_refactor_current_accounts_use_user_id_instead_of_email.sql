-- Refactor current_accounts to use user_id instead of email for proper Supabase architecture
-- Drop email column and add user_id reference
ALTER TABLE public.current_accounts DROP COLUMN IF EXISTS email;
ALTER TABLE public.current_accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Populate user_id from existing tenant_id relationships
-- This assumes tenant_id was being used as user identifier
UPDATE public.current_accounts SET user_id = tenant_id WHERE user_id IS NULL;

-- Make user_id NOT NULL and add constraint
ALTER TABLE public.current_accounts ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies to use user_id instead of tenant_id for user isolation
DROP POLICY IF EXISTS "Users can view their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can insert their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can update their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can delete their tenant's current accounts" ON public.current_accounts;

-- New policies using user_id for proper user isolation
CREATE POLICY "Users can view their own current accounts" ON public.current_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own current accounts" ON public.current_accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own current accounts" ON public.current_accounts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own current accounts" ON public.current_accounts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Update indexes
DROP INDEX IF EXISTS idx_current_accounts_tenant_id;
CREATE INDEX IF NOT EXISTS idx_current_accounts_user_id ON public.current_accounts(user_id);

-- Force PostgREST schema cache refresh
COMMENT ON TABLE public.current_accounts IS 'Refactored current accounts table using user_id references instead of email - clean Supabase architecture 20260129102631';
