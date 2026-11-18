-- LOCAL TEST DATABASE ONLY. Optional second run ("extended"), loaded right
-- after 02_seed_baseline.sql. Run as supabase_admin.
--
-- Covers what live does not have today but the migration and rollback must
-- handle:
--   * the four tables that are empty on live, with rows under a user id:
--     banks 2, cheques 2, transactions 3, collection_invoice_matches 3 (+10 moved)
--   * rollback case A: a user whose app_metadata already had a tenant_id before
--     the migration (user 16, value differs from user_metadata on purpose so the
--     exact restore is visible)
-- Totals after this file: 769 rows in 13 tables, 261 at user id.
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: tenant_test.local_marker not found (this is not the local test database)';
  END IF;
END $$;

BEGIN;

DO $$ BEGIN
  IF (SELECT count(*) FROM tenant_test.test_users) <> 16 OR EXISTS (SELECT 1 FROM public.banks)
     OR to_regnamespace('backup') IS NOT NULL THEN
    RAISE EXCEPTION 'Refusing: run right after 02_seed_baseline.sql on a fresh database';
  END IF;
END $$;

INSERT INTO public.banks (id, tenant_id, name, bank_name, iban, balance) VALUES
  (tenant_test.rid('bank-user', 1), tenant_test.uid(1), 'Test Banka 1', 'Test Bank', 'TR000000000000000000000001', 0),
  (tenant_test.rid('bank-user', 2), tenant_test.uid(2), 'Test Banka 2', 'Test Bank', 'TR000000000000000000000002', 0);

INSERT INTO public.cheques (id, tenant_id, cheque_number, cheque_type, status, amount, due_date, bank_id) VALUES
  (tenant_test.rid('cheque-user', 1), tenant_test.uid(1), 'TEST-CEK-1', 'received', 'pending', 500, date '2026-12-01', tenant_test.rid('bank-user', 1)),
  (tenant_test.rid('cheque-user', 2), tenant_test.uid(2), 'TEST-CEK-2', 'issued', 'pending', 300, date '2026-12-15', NULL);

INSERT INTO public.transactions (id, tenant_id, current_account_id, type, amount, description, date)
SELECT tenant_test.rid('tx-user', k), tenant_test.uid(k), tenant_test.rid('ca-user', k),
       CASE WHEN k % 2 = 0 THEN 'credit' ELSE 'debit' END, 10 * k, 'Test islem', date '2026-03-01' + k
FROM generate_series(1, 3) k;

-- Movement 9 of users 1-3 is a COLLECTION row (see 02); invoice k belongs to company k.
INSERT INTO public.collection_invoice_matches (id, collection_movement_id, invoice_id, applied_amount, tenant_id, user_id)
SELECT tenant_test.rid('cim-user', k), tenant_test.rid('cam-' || k, 9), tenant_test.rid('inv', k), 25,
       tenant_test.uid(k), tenant_test.uid(k)
FROM generate_series(1, 3) k;

-- Rollback case A
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('tenant_id', tenant_test.rid('stale-app-tenant', 16)::text)
WHERE id = tenant_test.uid(16);
UPDATE tenant_test.test_users SET scenario = 'case_A_preexisting_app_tenant' WHERE n = 16;

UPDATE tenant_test.expected_counts SET n = n + 2, moved = moved + 2 WHERE table_name IN ('banks', 'cheques');
UPDATE tenant_test.expected_counts SET n = n + 3, moved = moved + 3 WHERE table_name IN ('transactions', 'collection_invoice_matches');

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
      RAISE EXCEPTION 'Extended seed check failed for %: rows % (expected %), at user id % (expected %)',
        e.table_name, n_now, e.n, n_user, e.moved;
    END IF;
  END LOOP;
  IF (SELECT sum(moved) FROM tenant_test.expected_counts) <> 261
     OR (SELECT sum(n) FROM tenant_test.expected_counts) <> 769 THEN
    RAISE EXCEPTION 'Extended seed check failed: totals';
  END IF;
  RAISE NOTICE 'Extended seed OK: 769 rows in 13 tables, 261 at user id, user 16 has a pre-existing app_metadata.tenant_id';
END $$;

COMMIT;
