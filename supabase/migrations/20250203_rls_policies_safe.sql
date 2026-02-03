-- Comprehensive RLS policies - Only for tables with tenant_id column
-- This migration safely applies tenant-based RLS to all tables that have tenant_id

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

-- ============================================================================
-- STOCK_MOVEMENTS TABLE
-- ============================================================================
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stock_movements_select" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_update" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_delete" ON public.stock_movements;

CREATE POLICY "stock_movements_select" ON public.stock_movements FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "stock_movements_insert" ON public.stock_movements FOR INSERT TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "stock_movements_update" ON public.stock_movements FOR UPDATE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "stock_movements_delete" ON public.stock_movements FOR DELETE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON public.stock_movements(tenant_id);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;

CREATE POLICY "transactions_select" ON public.transactions FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON public.transactions(tenant_id);

-- ============================================================================
-- WAREHOUSES TABLE
-- ============================================================================
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouses_select" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_insert" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_update" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_delete" ON public.warehouses;

CREATE POLICY "warehouses_select" ON public.warehouses FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "warehouses_insert" ON public.warehouses FOR INSERT TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "warehouses_update" ON public.warehouses FOR UPDATE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "warehouses_delete" ON public.warehouses FOR DELETE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant_id ON public.warehouses(tenant_id);
