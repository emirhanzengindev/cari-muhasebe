# RLS (Row Level Security) Setup for Multi-Tenant Application

This document explains how to set up Row Level Security policies in Supabase for proper tenant isolation.

## Database Tables with RLS

The following tables need RLS policies to ensure proper tenant isolation:
- products
- stock_movements
- categories
- warehouses

## SQL Script for RLS Policies

Run the following SQL script in your Supabase SQL Editor to set up complete RLS policies:

```sql
-- ===============================
-- 1️⃣ Enable RLS on all tables
-- ===============================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- ===============================
-- 2️⃣ PRODUCTS
-- ===============================
DROP POLICY IF EXISTS "Tenant can select own products" ON products;
CREATE POLICY "Tenant can select own products"
ON products
FOR SELECT
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can insert own products" ON products;
CREATE POLICY "Tenant can insert own products"
ON products
FOR INSERT
WITH CHECK (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can update own products" ON products;
CREATE POLICY "Tenant can update own products"
ON products
FOR UPDATE
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can delete own products" ON products;
CREATE POLICY "Tenant can delete own products"
ON products
FOR DELETE
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- ===============================
-- 3️⃣ STOCK_MOVEMENTS
-- ===============================
DROP POLICY IF EXISTS "Tenant can select own stock_movements" ON stock_movements;
CREATE POLICY "Tenant can select own stock_movements"
ON stock_movements
FOR SELECT
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can insert own stock_movements" ON stock_movements;
CREATE POLICY "Tenant can insert own stock_movements"
ON stock_movements
FOR INSERT
WITH CHECK (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can update own stock_movements" ON stock_movements;
CREATE POLICY "Tenant can update own stock_movements"
ON stock_movements
FOR UPDATE
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can delete own stock_movements" ON stock_movements;
CREATE POLICY "Tenant can delete own stock_movements"
ON stock_movements
FOR DELETE
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- ===============================
-- 4️⃣ CATEGORIES
-- ===============================
DROP POLICY IF EXISTS "Tenant can select own categories" ON categories;
CREATE POLICY "Tenant can select own categories"
ON categories
FOR SELECT
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can insert own categories" ON categories;
CREATE POLICY "Tenant can insert own categories"
ON categories
FOR INSERT
WITH CHECK (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can update own categories" ON categories;
CREATE POLICY "Tenant can update own categories"
ON categories
FOR UPDATE
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can delete own categories" ON categories;
CREATE POLICY "Tenant can delete own categories"
ON categories
FOR DELETE
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- ===============================
-- 5️⃣ WAREHOUSES
-- ===============================
DROP POLICY IF EXISTS "Tenant can select own warehouses" ON warehouses;
CREATE POLICY "Tenant can select own warehouses"
ON warehouses
FOR SELECT
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can insert own warehouses" ON warehouses;
CREATE POLICY "Tenant can insert own warehouses"
ON warehouses
FOR INSERT
WITH CHECK (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can update own warehouses" ON warehouses;
CREATE POLICY "Tenant can update own warehouses"
ON warehouses
FOR UPDATE
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

DROP POLICY IF EXISTS "Tenant can delete own warehouses" ON warehouses;
CREATE POLICY "Tenant can delete own warehouses"
ON warehouses
FOR DELETE
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');
```

## How to Apply

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Paste the above SQL script
4. Click "Run" to execute the script

## Verification

After applying the RLS policies, you can verify they are working by:

1. Checking that each policy appears in the "Policies" section of each table in the Table Editor
2. Testing that users can only access records belonging to their tenant
3. Confirming that the application no longer returns "permission denied" errors

## Application Integration

The application is already configured to work with these RLS policies:

- The `createServerSupabaseClient()` function properly handles authentication via cookies
- The Supabase client automatically uses the authenticated user's session
- RLS policies will automatically filter records based on the user's tenant_id stored in their JWT claims