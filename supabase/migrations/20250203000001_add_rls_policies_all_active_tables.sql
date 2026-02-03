-- Comprehensive RLS policies for all active tables
-- These policies ensure users can only access their own tenant's data

-- ============================================================================
-- CURRENT_ACCOUNTS TABLE
-- ============================================================================
ALTER TABLE public.current_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "current_accounts_select" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_insert" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_update" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_delete" ON public.current_accounts;

CREATE POLICY "current_accounts_select" ON public.current_accounts FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "current_accounts_insert" ON public.current_accounts FOR INSERT TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "current_accounts_update" ON public.current_accounts FOR UPDATE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "current_accounts_delete" ON public.current_accounts FOR DELETE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_current_accounts_tenant_id ON public.current_accounts(tenant_id);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;

CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);

-- ============================================================================
-- INVOICE_ITEMS TABLE
-- ============================================================================
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON public.invoice_items;

CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "invoice_items_insert" ON public.invoice_items FOR INSERT TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "invoice_items_update" ON public.invoice_items FOR UPDATE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "invoice_items_delete" ON public.invoice_items FOR DELETE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant_id ON public.invoice_items(tenant_id);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;

CREATE POLICY "categories_select" ON public.categories FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "categories_insert" ON public.categories FOR INSERT TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "categories_update" ON public.categories FOR UPDATE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "categories_delete" ON public.categories FOR DELETE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON public.categories(tenant_id);
