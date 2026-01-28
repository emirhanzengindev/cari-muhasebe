-- Refresh PostgREST schema cache for current_accounts table
-- This resolves PGRST204 errors after column additions

-- First, ensure the columns exist (double-check)
ALTER TABLE public.current_accounts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'CUSTOMER';

-- Update existing records to have proper defaults
UPDATE public.current_accounts 
SET is_active = TRUE 
WHERE is_active IS NULL;

UPDATE public.current_accounts 
SET account_type = 'CUSTOMER' 
WHERE account_type IS NULL;

-- Refresh the PostgREST schema cache by commenting on the table
COMMENT ON TABLE public.current_accounts IS 'Current accounts table - cache refresh 2025-01-28';

-- Ensure RLS policies still apply to new columns
ALTER TABLE public.current_accounts ENABLE ROW LEVEL SECURITY;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_current_accounts_tenant_id ON public.current_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_current_accounts_account_type ON public.current_accounts(account_type);