-- Final schema for current_accounts table after architectural cleanup
-- Completed migration: email column removed, all required columns present
-- This establishes the canonical architecture for current_accounts

-- Ensure all required columns exist
ALTER TABLE public.current_accounts
ADD COLUMN IF NOT EXISTS tax_number TEXT,
ADD COLUMN IF NOT EXISTS tax_office TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS account_type TEXT;

-- Remove email column if it somehow still exists
ALTER TABLE public.current_accounts DROP COLUMN IF EXISTS email;

-- Force PostgREST schema cache refresh
COMMENT ON TABLE public.current_accounts IS 'FINAL: Canonical current_accounts schema established - email removed, user_id-based RLS enforced, all required columns present 20260129110000';

-- Document the canonical architecture
/*
Canonical Architecture for current_accounts:
- Primary identifier: id (UUID, PK)
- User association: user_id (UUID, references auth.users.id)  
- Tenant isolation: tenant_id (UUID, for RLS policies)
- Business data: name, phone, address, tax_number, tax_office, company
- Financial data: balance
- Metadata: created_at, updated_at, is_active, account_type
- No duplicated auth data (email removed)
- RLS policies based on user_id/tenant_id only
*/