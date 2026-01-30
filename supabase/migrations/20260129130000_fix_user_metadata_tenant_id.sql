-- Fix user metadata to ensure tenant_id is properly stored for RLS policies
-- This migration ensures that the auth.users table has the correct tenant_id in raw_app_meta_data

-- First, let's check the current state of user metadata
SELECT 
    id,
    email,
    raw_app_meta_data,
    raw_user_meta_data
FROM auth.users 
LIMIT 10;

-- Function to ensure user metadata has tenant_id
-- This should be called after user registration to set tenant_id in user metadata
CREATE OR REPLACE FUNCTION ensure_user_tenant_id(user_id UUID, tenant_id UUID)
RETURNS void AS $$
BEGIN
    -- Update the user's raw_app_meta_data to include tenant_id
    UPDATE auth.users 
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('tenant_id', tenant_id::text)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Create a trigger to automatically set tenant_id in metadata upon user creation
-- This would ensure that all new users get the proper tenant_id in their metadata
CREATE OR REPLACE FUNCTION set_user_tenant_id_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Set tenant_id in raw_app_meta_data to be the same as the user's ID
    -- This ensures that RLS policies can properly match tenant_id = auth.uid()
    NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || 
                           jsonb_build_object('tenant_id', NEW.id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to auth.users table (this would work for future users)
-- We can't add triggers directly to auth.users table in Supabase, so we'll update existing users instead

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

-- Also make sure that our RLS policies are still in place
-- These should already exist from previous migrations, but let's make sure they're correct
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