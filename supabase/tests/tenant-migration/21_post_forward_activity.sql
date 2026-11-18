-- LOCAL TEST DATABASE ONLY. T2 part 2: activity between the forward migration
-- and the rollback. Run as postgres, after 20_signup_and_meta.sql.
--
-- Every user action runs through tenant_test.act(): SET LOCAL ROLE
-- authenticated + request.jwt.claims, exactly what PostgREST does for an API
-- request. Each action records its outcome; "expected" is the behaviour the
-- application needs (not the behaviour we predict), so a failed check here is
-- a defect to fix before going live.
--   token 'current' = minted after the migration (app_metadata has tenant_id)
--   token 'old'     = minted before the migration (still valid up to 1 hour)
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: tenant_test.local_marker not found (this is not the local test database)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tenant_test.activity WHERE kind = 'signup') THEN
    RAISE EXCEPTION 'Run 20_signup_and_meta.sql first';
  END IF;
  IF EXISTS (SELECT 1 FROM tenant_test.activity WHERE step LIKE 'a%') THEN
    RAISE EXCEPTION '21 already ran on this database';
  END IF;
END $$;

SELECT tenant_test.begin_stage('T2');

-- Creates (post-migration rows)
SELECT tenant_test.act('a01 new code: insert current_accounts with company id', 1, 'current', 'current_accounts', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.current_accounts (name, tenant_id, user_id) VALUES ('T2 cari yeni kod', %L, %L) RETURNING id::text$q$,
         tenant_test.cid(1), tenant_test.uid(1)));
SELECT tenant_test.act('a02 old code: insert current_accounts with user id', 2, 'current', 'current_accounts', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.current_accounts (name, tenant_id, user_id) VALUES ('T2 cari eski kod', %L, %L) RETURNING id::text$q$,
         tenant_test.uid(2), tenant_test.uid(2)));
SELECT tenant_test.act('a03 old code, old token: insert banks with user id', 3, 'old', 'banks', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.banks (name, tenant_id) VALUES ('T2 banka', %L) RETURNING id::text$q$, tenant_test.uid(3)));
SELECT tenant_test.act('a04 old code: insert cheques with user id', 3, 'current', 'cheques', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.cheques (tenant_id, cheque_number, amount) VALUES (%L, 'T2-CEK', 100) RETURNING id::text$q$, tenant_test.uid(3)));
SELECT tenant_test.act('a05 old code: insert warehouses with user id', 4, 'current', 'warehouses', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.warehouses (name, tenant_id) VALUES ('T2 depo', %L) RETURNING id::text$q$, tenant_test.uid(4)));
SELECT tenant_test.act('a06 insert categories without tenant_id (trigger)', 4, 'current', 'categories', 'insert_post_migration', 'ok',
  $q$INSERT INTO public.categories (name) VALUES ('T2 kategori') RETURNING id::text$q$);
SELECT tenant_test.act('a07 insert invoices with company id', 5, 'current', 'invoices', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.invoices (tenant_id, invoice_number, total_amount, date) VALUES (%L, 'T2-INV-5', 50, CURRENT_DATE) RETURNING id::text$q$,
         tenant_test.cid(5)));
SELECT tenant_test.act('a08 insert invoice_items with company id', 5, 'current', 'invoice_items', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.invoice_items (invoice_id, product_id, quantity, unit_price, total, tenant_id) VALUES (%L, %L, 1, 10, 10, %L) RETURNING id::text$q$,
         (SELECT row_id FROM tenant_test.activity WHERE step LIKE 'a07 %'), tenant_test.rid('prod', 5), tenant_test.cid(5)));
SELECT tenant_test.act('a09 insert products with company id', 5, 'current', 'products', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.products (name, default_unit_price, tenant_id) VALUES ('T2 urun', 5, %L) RETURNING id::text$q$, tenant_test.cid(5)));
-- Stock: only that the row lands at the company id. Stock arithmetic is not asserted.
-- Live ACL: authenticated has only SELECT on stock_movements (authenticated=r),
-- so a direct insert by a user must fail with 42501 (sqlstate checked below).
SELECT tenant_test.act('a10 authenticated direct insert stock_movements is denied (ACL r)', 5, 'current', 'stock_movements', 'acl_denied', 'error',
  format($q$INSERT INTO public.stock_movements (product_id, movement_type, quantity, tenant_id) VALUES (%L, 'in', 1, %L) RETURNING id::text$q$,
         tenant_test.rid('prod', 5), tenant_test.cid(5)));
-- The app's server path (service_role key, no user claims) writes at the company id.
INSERT INTO tenant_test.activity (step, actor, table_name, row_id, kind, expected, outcome, sqlstate, message, result)
SELECT 'a10b service_role insert stock_movements for company 5', 5, 'stock_movements',
       CASE WHEN r.ok THEN r.result::uuid END, 'insert_post_migration', 'ok',
       CASE WHEN r.ok THEN 'ok' ELSE 'error' END, r.state, r.msg, r.result
FROM tenant_test.try_sql('service_role', NULL, 'current',
  format($q$INSERT INTO public.stock_movements (product_id, movement_type, quantity, tenant_id) VALUES (%L, 'in', 1, %L) RETURNING id::text$q$,
         tenant_test.rid('prod', 5), tenant_test.cid(5))) r;
SELECT tenant_test.act('a11 RPC record_current_account_movement on own (moved) account', 6, 'current', 'current_account_movements', 'insert_post_migration', 'ok',
  format($q$SELECT public.record_current_account_movement(%L::uuid, 'COLLECTION', 10::numeric) ->> 'movement_id'$q$, tenant_test.rid('ca-user', 6)));
SELECT tenant_test.act('a12 RPC delete_current_account_movement on own moved row', 7, 'current', 'current_account_movements', 'deleted_moved', 'ok',
  format($q$SELECT public.delete_current_account_movement(%L::uuid) ->> 'movement_id'$q$, tenant_test.rid('cam-7', 14)));
SELECT tenant_test.act('a13 insert transactions with company id', 8, 'current', 'transactions', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.transactions (tenant_id, current_account_id, type, amount, date) VALUES (%L, %L, 'debit', 5, CURRENT_DATE) RETURNING id::text$q$,
         tenant_test.cid(8), tenant_test.rid('ca-user', 8)));
SELECT tenant_test.act('a14 insert safes with company id', 8, 'current', 'safes', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.safes (name, tenant_id) VALUES ('T2 kasa', %L) RETURNING id::text$q$, tenant_test.cid(8)));
SELECT tenant_test.act('a15 insert collection_invoice_matches with company id', 8, 'current', 'collection_invoice_matches', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.collection_invoice_matches (collection_movement_id, invoice_id, applied_amount, tenant_id, user_id) VALUES (%L, %L, 5, %L, %L) RETURNING id::text$q$,
         tenant_test.rid('cam-8', 8), tenant_test.rid('inv', 8), tenant_test.cid(8), tenant_test.uid(8)));
SELECT tenant_test.act('a16 update own moved current_account (no tenant change)', 9, 'current', 'current_accounts', 'updated_moved', 'ok',
  format($q$WITH x AS (UPDATE public.current_accounts SET name = name || ' (T2)' WHERE id = %L RETURNING 1) SELECT count(*)::text FROM x$q$,
         tenant_test.rid('ca-user', 9)));
SELECT tenant_test.act('a17 new user: insert categories', 17, 'current', 'categories', 'insert_post_migration', 'ok',
  $q$INSERT INTO public.categories (name) VALUES ('T2 kategori yeni kullanici') RETURNING id::text$q$);
SELECT tenant_test.act('a18 new user: insert invoices', 17, 'current', 'invoices', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.invoices (tenant_id, invoice_number, total_amount, date) VALUES (%L, 'T2-INV-17', 70, CURRENT_DATE) RETURNING id::text$q$,
         tenant_test.company_of(17)));
SELECT tenant_test.act('a19 new user: insert current_accounts', 17, 'current', 'current_accounts', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.current_accounts (name, tenant_id, user_id) VALUES ('T2 cari yeni kullanici', %L, %L) RETURNING id::text$q$,
         tenant_test.company_of(17), tenant_test.uid(17)));
SELECT tenant_test.act('a20 user with edited user_metadata: insert warehouses with user id', 18, 'current', 'warehouses', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.warehouses (name, tenant_id) VALUES ('T2 depo u18', %L) RETURNING id::text$q$, tenant_test.uid(18)));
SELECT tenant_test.act('a21 old token: insert banks with user id', 10, 'old', 'banks', 'insert_post_migration', 'ok',
  format($q$INSERT INTO public.banks (name, tenant_id) VALUES ('T2 banka eski token', %L) RETURNING id::text$q$, tenant_test.uid(10)));

-- Admin changes made directly in the database (SQL Editor, postgres)
WITH x AS (
  UPDATE public.current_account_movements SET tenant_id = tenant_test.cid(10)
  WHERE id = tenant_test.rid('cam-9', 10) RETURNING id)
INSERT INTO tenant_test.activity (step, actor, table_name, row_id, kind, expected, outcome)
SELECT 'b01 admin moves a migrated row to company 10', NULL, 'current_account_movements', id, 'changed_moved', 'ok', 'ok' FROM x;

WITH x AS (
  DELETE FROM public.current_account_movements WHERE id = tenant_test.rid('cam-11', 12) RETURNING id)
INSERT INTO tenant_test.activity (step, actor, table_name, row_id, kind, expected, outcome)
SELECT 'b02 admin deletes a migrated row', NULL, 'current_account_movements', id, 'deleted_moved', 'ok', 'ok' FROM x;

-- ---------------------------------------------------------------------------
-- Checks
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  a record;
  v_tenant uuid;
BEGIN
  FOR a IN SELECT * FROM tenant_test.activity ORDER BY id LOOP
    PERFORM tenant_test.check('T2', 'outcome ' || a.step, a.outcome = a.expected,
      format('expected %s, got %s %s %s', a.expected, a.outcome, COALESCE(a.sqlstate, ''), COALESCE(a.message, '')));
  END LOOP;

  -- every successful post-migration insert sits at the actor's company id
  FOR a IN SELECT * FROM tenant_test.activity
           WHERE kind = 'insert_post_migration' AND outcome = 'ok' AND row_id IS NOT NULL LOOP
    EXECUTE format('SELECT tenant_id FROM public.%I WHERE id = $1', a.table_name) INTO v_tenant USING a.row_id;
    PERFORM tenant_test.check('T2', 'tenant of ' || a.step, v_tenant = tenant_test.company_of(a.actor),
      format('tenant=%s company=%s', v_tenant, tenant_test.company_of(a.actor)));
  END LOOP;

  PERFORM tenant_test.check('T2', 'a10 denied with 42501 (no INSERT grant for authenticated)',
    (SELECT sqlstate FROM tenant_test.activity WHERE step LIKE 'a10 %') = '42501',
    (SELECT COALESCE(sqlstate, '') || ' ' || COALESCE(message, '') FROM tenant_test.activity WHERE step LIKE 'a10 %'));
  PERFORM tenant_test.check('T2', 'a16 updated exactly one row',
    (SELECT result FROM tenant_test.activity WHERE step LIKE 'a16 %') = '1',
    (SELECT result FROM tenant_test.activity WHERE step LIKE 'a16 %'));
  PERFORM tenant_test.check('T2', 'b01 changed one row', (SELECT count(*) FROM tenant_test.activity WHERE step LIKE 'b01 %') = 1);
  PERFORM tenant_test.check('T2', 'b02 deleted one row', (SELECT count(*) FROM tenant_test.activity WHERE step LIKE 'b02 %') = 1);
END $$;

SELECT tenant_test.capture('T2');

-- RLS after the activity: company model with fresh tokens (u12 and u18 carry a
-- tampered user_metadata.tenant_id in their token; it must be ignored)
SELECT tenant_test.rls_check('T2', 'current', 'company');

SELECT step, outcome, sqlstate, left(message, 120) AS message FROM tenant_test.activity ORDER BY id;
SELECT tenant_test.finish_stage('T2');
