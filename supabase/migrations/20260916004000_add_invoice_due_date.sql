-- Optional maturity date for simple receivables/payables tracking.
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS due_date date;

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_due_date
  ON public.invoices (tenant_id, due_date);