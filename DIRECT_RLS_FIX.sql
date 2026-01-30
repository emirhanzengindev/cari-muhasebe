-- DIRECT SQL FIX FOR RLS POLICY ISSUE
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- Update all existing users to have tenant_id in their metadata (matching their user ID)
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
                       jsonb_build_object('tenant_id', id::text)
WHERE (raw_app_meta_data->>'tenant_id') IS NULL OR (raw_app_meta_data->>'tenant_id') = '';

-- Verify the update worked
SELECT 
    id,
    email,
    raw_app_meta_data->>'tenant_id' as tenant_id
FROM auth.users 
LIMIT 10;

-- Make sure RLS policies are correct
CREATE OR REPLACE POLICY "Users can insert their tenant's current accounts" 
ON public.current_accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (
  tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::UUID
  OR tenant_id = auth.uid()  -- Fallback to user id
);

-- Refresh the schema cache to make sure PostgREST picks up the changes
COMMENT ON TABLE public.current_accounts IS 'Schema refreshed for tenant_id RLS policies - 20260129130000';

-- Test that the fix works by attempting an insert with the correct tenant_id
-- First, make sure we're in a proper auth context
-- You may need to set a test JWT context like:
-- SET LOCAL "request.jwt.claim.sub" = 'your-user-id';
-- SET LOCAL "request.jwt.claim.role" = 'authenticated';

-- Then test an insert:
-- INSERT INTO current_accounts (name, tenant_id, user_id) VALUES ('Test Account', 'your-user-id', 'your-user-id');