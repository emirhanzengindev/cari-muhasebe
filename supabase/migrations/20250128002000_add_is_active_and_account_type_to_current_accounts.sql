-- Add is_active and account_type columns to current_accounts table
-- This resolves the field mapping issue between frontend and database

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