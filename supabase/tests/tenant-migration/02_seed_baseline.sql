-- LOCAL TEST DATABASE ONLY. Synthetic data, no live content.
-- Run as supabase_admin (disables three triggers for the load only).
--
-- Mirrors the live distribution read on 2026-11-18 (counts and NULL counts only):
--   16 users, user_metadata.tenant_id = a distinct company id, app_metadata
--   without tenant_id; 11 of the 16 companies have a public.tenants row.
--   current_accounts           17  (16 at user id, 1 at company id)
--   current_account_movements 232  (all at user id)
--   categories                  2  (1 at user id, 1 at company id)
--   warehouses 1 / safes 1         (at user id)
--   invoices 199 / invoice_items 119 / products 41   (all at company id)
--   stock_movements           147  (140 at company id, 7 at an id matching nobody)
--   banks / cheques / transactions / collection_invoice_matches: 0
-- Rows the migration moves (stored under a user id): 16 + 232 + 1 + 1 + 1 = 251.
-- Rows in the 13 tables: 759.
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: tenant_test.local_marker not found (this is not the local test database)';
  END IF;
END $$;

BEGIN;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM auth.users) OR EXISTS (SELECT 1 FROM public.invoices)
     OR EXISTS (SELECT 1 FROM tenant_test.test_users) THEN
    RAISE EXCEPTION 'Refusing to seed: database is not empty (run supabase db reset first)';
  END IF;
END $$;

-- Load-only: these triggers would rewrite the synthetic tenant ids.
--   on_auth_user_created      -> would create random companies
--   trg_set_categories_tenant_id -> would replace tenant_id from user_metadata
--   trg_update_product_stock  -> stock logic; would take the product's tenant
-- All three are enabled again before COMMIT. Stock logic itself is untouched.
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
ALTER TABLE public.categories DISABLE TRIGGER trg_set_categories_tenant_id;
ALTER TABLE public.stock_movements DISABLE TRIGGER trg_update_product_stock;

INSERT INTO tenant_test.test_users (n, user_id, company_id, has_tenant_row, email, scenario)
SELECT n, tenant_test.uid(n), tenant_test.cid(n), n <= 11,
       format('tenant-test-%s@example.test', lpad(n::text, 2, '0')),
       CASE WHEN n <= 11 THEN 'baseline_with_tenant_row' ELSE 'baseline_without_tenant_row' END
FROM generate_series(1, 16) n;

-- Users. Password: Test-Password-NN!  (NN = 01..16)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
SELECT '00000000-0000-0000-0000-000000000000', t.user_id, 'authenticated', 'authenticated', t.email,
       extensions.crypt('Test-Password-' || lpad(t.n::text, 2, '0') || '!', extensions.gen_salt('bf')),
       now() - interval '80 days', now() - interval '1 day',
       '{"provider": "email", "providers": ["email"]}'::jsonb,
       jsonb_build_object('name', 'Test Kullanici ' || t.n, 'tenant_id', t.company_id::text, 'email_verified', true),
       now() - interval '90 days', now() - interval '1 day', '', '', '', ''
FROM tenant_test.test_users t;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), t.user_id::text, t.user_id,
       jsonb_build_object('sub', t.user_id::text, 'email', t.email, 'email_verified', true, 'phone_verified', false),
       'email', now() - interval '1 day', now() - interval '90 days', now() - interval '1 day'
FROM tenant_test.test_users t;

INSERT INTO public.tenants (id, name, owner_user_id)
SELECT company_id, 'Test Firma ' || n, user_id FROM tenant_test.test_users WHERE has_tenant_row;

-- current_accounts: one per user at the user id, plus one at company 1
INSERT INTO public.current_accounts (
  id, user_id, tenant_id, name, account_number, phone, address, tax_number, tax_office,
  company, balance, account_type, is_active)
SELECT tenant_test.rid('ca-user', n), user_id, user_id, 'Test Cari ' || n,
       NULL,
       CASE WHEN n % 2 = 0 THEN '0500000' || lpad(n::text, 4, '0') END,
       CASE WHEN n <= 12 THEN 'Test Adres ' || n END,
       CASE WHEN n <= 6 THEN '10000' || lpad(n::text, 5, '0') END,
       CASE WHEN n <= 6 THEN 'Test Vergi Dairesi' END,
       CASE WHEN n = 1 THEN 'Test Sirket 1' END,
       0,
       CASE WHEN n = 16 THEN NULL ELSE 'CUSTOMER' END,
       true
FROM tenant_test.test_users;
INSERT INTO public.current_accounts (
  id, user_id, tenant_id, name, account_number, phone, address, tax_number, tax_office,
  company, balance, account_type, is_active)
VALUES (tenant_test.rid('ca-company', 1), tenant_test.uid(1), tenant_test.cid(1), 'Test Cari Firma 1',
        'ACC-0001', '05000009999', 'Test Adres F', NULL, NULL, 'Test Sirket F', 0, 'SUPPLIER', true);

-- invoices: 199 at company ids, round-robin over the 16 companies
INSERT INTO public.invoices (
  id, tenant_id, amount, invoice_number, invoice_type, date, account_id,
  subtotal, discount, vat_amount, total_amount, currency, is_draft, description, due_date)
SELECT tenant_test.rid('inv', i), tenant_test.cid(k),
       CASE WHEN i % 4 = 0 THEN NULL ELSE 100 + i END,
       'TEST-INV-' || lpad(i::text, 4, '0'),
       'SALES',
       date '2026-01-01' + i,
       CASE WHEN i % 3 = 0 THEN NULL ELSE tenant_test.rid('ca-user', k) END,
       100 + i, 0, 20, 120 + i, 'TRY', false,
       CASE WHEN i % 5 = 0 THEN 'Test aciklama' END,
       CASE WHEN i = 1 THEN date '2026-12-31' END
FROM generate_series(1, 199) i
CROSS JOIN LATERAL (SELECT ((i - 1) % 16) + 1 AS k) x;

-- products: 41 at company ids (company k owns products k, k+16, k+32)
INSERT INTO public.products (id, name, sku, default_unit_price, created_by, tenant_id, stock_quantity)
SELECT tenant_test.rid('prod', i), 'Test Urun ' || i,
       CASE WHEN i % 3 = 0 THEN 'TEST-SKU-' || i END,
       10 * i, NULL, tenant_test.cid(((i - 1) % 16) + 1), 100
FROM generate_series(1, 41) i;

-- invoice_items: 119, item j on invoice j, product of the same company
INSERT INTO public.invoice_items (
  id, invoice_id, product_id, product_name, quantity, unit, price, total, tenant_id, unit_price)
SELECT tenant_test.rid('item', j), tenant_test.rid('inv', j), tenant_test.rid('prod', k),
       NULL, 2, 'adet', NULL, 20 * j, tenant_test.cid(k), 10 * j
FROM generate_series(1, 119) j
CROSS JOIN LATERAL (SELECT ((j - 1) % 16) + 1 AS k) x;

-- stock_movements: 140 at company ids + 7 whose tenant matches no user/company
INSERT INTO public.stock_movements (id, product_id, variant_id, movement_type, quantity, price, description, tenant_id, warehouse_id)
SELECT tenant_test.rid('sm', s), tenant_test.rid('prod', k), NULL,
       CASE WHEN s % 2 = 0 THEN 'out' ELSE 'in' END, 1 + (s % 5),
       CASE WHEN s <= 2 THEN NULL ELSE 10 + s END,
       'Test stok hareketi', tenant_test.cid(k), NULL
FROM generate_series(1, 140) s
CROSS JOIN LATERAL (SELECT ((s - 1) % 16) + 1 AS k) x;
INSERT INTO public.stock_movements (id, product_id, variant_id, movement_type, quantity, price, description, tenant_id, warehouse_id)
SELECT tenant_test.rid('sm', s), NULL, NULL, 'in', 1, 10, 'Test sahipsiz stok hareketi',
       tenant_test.rid('orphan-tenant', s), NULL
FROM generate_series(141, 147) s;

-- current_account_movements: 232 at user ids (users 1-8: 15, users 9-16: 14).
-- Movements 1-7 (1-8 for users 1-3) are INVOICE rows linked to an invoice of
-- the user's company (115 linked, 117 without invoice, as on live); the rest
-- are COLLECTION rows. balance_after is the running balance in the order the
-- delete trigger uses (document_date, created_at, id).
WITH base AS (
  SELECT k, j, (j <= 7 OR (k <= 3 AND j = 8)) AS linked
  FROM generate_series(1, 16) k
  CROSS JOIN generate_series(1, 15) j
  WHERE j <= CASE WHEN k <= 8 THEN 15 ELSE 14 END
), r AS (
  SELECT k, j, linked,
         tenant_test.rid('cam-' || k, j) AS id,
         CASE WHEN linked THEN 'INVOICE' ELSE 'COLLECTION' END AS movement_type,
         CASE WHEN linked THEN tenant_test.rid('inv', k + 16 * (j - 1)) END AS invoice_id,
         (CASE WHEN linked THEN 100 + j ELSE 50 END)::numeric AS amount,
         CASE WHEN linked THEN 1 ELSE -1 END AS direction,
         date '2026-02-01' + j AS document_date,
         timestamptz '2026-02-01 10:00:00+00' + j * interval '1 day' AS created_at
  FROM base
)
INSERT INTO public.current_account_movements (
  id, current_account_id, invoice_id, movement_type, amount, direction, signed_amount,
  balance_after, currency, document_no, document_date, description, tenant_id, user_id,
  created_at, updated_at, safe_id, payment_method)
SELECT id, tenant_test.rid('ca-user', k), invoice_id, movement_type, amount, direction,
       amount * direction,
       sum(amount * direction) OVER (PARTITION BY k ORDER BY document_date, created_at, id),
       'TRY',
       CASE WHEN j % 3 = 0 THEN NULL ELSE 'TEST-DOC-' || k || '-' || j END,
       document_date,
       CASE WHEN k = 1 AND j <= 3 THEN NULL ELSE 'Test hareketi' END,
       tenant_test.uid(k), tenant_test.uid(k), created_at, created_at, NULL, NULL
FROM r;

UPDATE public.current_accounts ca
SET balance = s.b
FROM (SELECT current_account_id, sum(signed_amount) AS b
      FROM public.current_account_movements GROUP BY 1) s
WHERE ca.id = s.current_account_id;

INSERT INTO public.categories (id, name, tenant_id) VALUES
  (tenant_test.rid('cat-user', 1), 'Test Kategori Kullanici 1', tenant_test.uid(1)),
  (tenant_test.rid('cat-company', 2), 'Test Kategori Firma 2', tenant_test.cid(2));
INSERT INTO public.warehouses (id, name, location, tenant_id) VALUES
  (tenant_test.rid('wh-user', 1), 'Test Depo 1', 'Test Konum', tenant_test.uid(1));
INSERT INTO public.safes (id, tenant_id, name, balance, currency, description) VALUES
  (tenant_test.rid('safe-user', 1), tenant_test.uid(1), 'Test Kasa 1', 0, 'TRY', NULL);

ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
ALTER TABLE public.categories ENABLE TRIGGER trg_set_categories_tenant_id;
ALTER TABLE public.stock_movements ENABLE TRIGGER trg_update_product_stock;

-- Expected counts (checked here and again in 11_assert_t0.sql)
INSERT INTO tenant_test.expected_counts (table_name, n, moved) VALUES
  ('categories', 2, 1), ('invoices', 199, 0), ('warehouses', 1, 1),
  ('stock_movements', 147, 0), ('current_accounts', 17, 16),
  ('current_account_movements', 232, 232), ('collection_invoice_matches', 0, 0),
  ('transactions', 0, 0), ('products', 41, 0), ('invoice_items', 119, 0),
  ('safes', 1, 1), ('banks', 0, 0), ('cheques', 0, 0);

DO $$
DECLARE
  e record;
  n_now bigint;
  n_user bigint;
BEGIN
  FOR e IN SELECT * FROM tenant_test.expected_counts LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', e.table_name) INTO n_now;
    EXECUTE format('SELECT count(*) FROM public.%I r JOIN tenant_test.test_users t ON t.user_id = r.tenant_id', e.table_name) INTO n_user;
    IF n_now <> e.n OR n_user <> e.moved THEN
      RAISE EXCEPTION 'Seed check failed for %: rows % (expected %), at user id % (expected %)',
        e.table_name, n_now, e.n, n_user, e.moved;
    END IF;
  END LOOP;
  IF (SELECT sum(moved) FROM tenant_test.expected_counts) <> 251
     OR (SELECT sum(n) FROM tenant_test.expected_counts) <> 759
     OR (SELECT count(*) FROM auth.users) <> 16
     OR (SELECT count(*) FROM public.tenants) <> 11
     OR (SELECT count(*) FROM public.current_account_movements WHERE invoice_id IS NOT NULL) <> 115 THEN
    RAISE EXCEPTION 'Seed check failed: totals do not match the live profile';
  END IF;
  RAISE NOTICE 'Baseline seed OK: 16 users, 759 rows in 13 tables, 251 at user id';
END $$;

COMMIT;
