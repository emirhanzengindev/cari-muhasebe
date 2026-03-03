-- Align public.invoices schema with application expectations and backfill legacy rows.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS invoice_type text DEFAULT 'SALES',
  ADD COLUMN IF NOT EXISTS date date,
  ADD COLUMN IF NOT EXISTS account_id uuid,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'TRY',
  ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.invoices
SET
  total_amount = COALESCE(total_amount, amount, 0),
  subtotal = COALESCE(subtotal, amount, 0),
  date = COALESCE(date, created_at::date),
  invoice_number = COALESCE(invoice_number, 'INV-LEGACY-' || substr(id::text, 1, 8)),
  updated_at = COALESCE(updated_at, now());

ALTER TABLE public.invoices
  ALTER COLUMN subtotal SET DEFAULT 0,
  ALTER COLUMN total_amount SET DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_account_id ON public.invoices (account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices (date);
