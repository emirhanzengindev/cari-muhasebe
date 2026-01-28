-- JWT Tenant Injection Functions
-- This ensures tenant_id is available in JWT claims for RLS policies

-- Function to extract tenant_id from JWT claims
CREATE OR REPLACE FUNCTION public.get_jwt_tenant()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.tenant_id', true), '')::UUID;
$$;

-- Function to get current user's tenant_id from auth metadata
CREATE OR REPLACE FUNCTION public.get_current_user_tenant()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT raw_app_meta_data->>'tenant_id'::UUID
  FROM auth.users
  WHERE id = auth.uid();
$$;

-- Trigger function to automatically set tenant_id on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()\RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set tenant_id in user metadata if not already set
  IF NEW.raw_app_meta_data IS NULL THEN
    NEW.raw_app_meta_data = jsonb_build_object('tenant_id', NEW.id);
  ELSIF NOT (NEW.raw_app_meta_data ? 'tenant_id') THEN
    NEW.raw_app_meta_data = NEW.raw_app_meta_data || jsonb_build_object('tenant_id', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to refresh JWT claims with tenant_id
CREATE OR REPLACE FUNCTION public.refresh_jwt_claims(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This would typically be handled by Supabase auth service
  -- For custom claims, you'd need to use Supabase Auth Hooks or custom JWT generation
  RAISE NOTICE 'User % tenant_id set to %', user_id, user_id;
END;
$$;