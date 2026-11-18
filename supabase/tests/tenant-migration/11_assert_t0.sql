-- LOCAL TEST DATABASE ONLY. T0: state after seeding, before the migration.
-- Run as postgres (the role the SQL Editor uses on live; not a superuser).
-- Captures the T0 fingerprint that T1 and T4 are compared against.
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: tenant_test.local_marker not found (this is not the local test database)';
  END IF;
END $$;

SELECT tenant_test.begin_stage('T0');
SELECT tenant_test.capture('T0');

DO $$
DECLARE
  e record;
  n_now bigint;
  n_user bigint;
BEGIN
  PERFORM tenant_test.check('T0', 'session role is postgres, not superuser',
    current_user = 'postgres' AND NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user),
    current_user::text);

  -- counts and rows under a user id
  FOR e IN SELECT * FROM tenant_test.expected_counts LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', e.table_name) INTO n_now;
    EXECUTE format('SELECT count(*) FROM public.%I r JOIN tenant_test.test_users t ON t.user_id = r.tenant_id', e.table_name) INTO n_user;
    PERFORM tenant_test.check('T0', 'count ' || e.table_name, n_now = e.n, format('%s (expected %s)', n_now, e.n));
    PERFORM tenant_test.check('T0', 'at user id ' || e.table_name, n_user = e.moved, format('%s (expected %s)', n_user, e.moved));
  END LOOP;

  PERFORM tenant_test.check('T0', 'orphan stock_movements = 7',
    (SELECT count(*) FROM public.stock_movements s
      WHERE NOT EXISTS (SELECT 1 FROM tenant_test.test_users t WHERE s.tenant_id IN (t.user_id, t.company_id))) = 7);

  -- users
  PERFORM tenant_test.check('T0', '16 users', (SELECT count(*) FROM auth.users) = 16);
  PERFORM tenant_test.check('T0', 'user_metadata.tenant_id = own company for all',
    NOT EXISTS (SELECT 1 FROM auth.users u JOIN tenant_test.test_users t ON t.user_id = u.id
                WHERE u.raw_user_meta_data ->> 'tenant_id' IS DISTINCT FROM t.company_id::text));
  PERFORM tenant_test.check('T0', 'app_metadata.tenant_id absent except case A',
    NOT EXISTS (SELECT 1 FROM auth.users u JOIN tenant_test.test_users t ON t.user_id = u.id
                WHERE (u.raw_app_meta_data ? 'tenant_id') <> (t.scenario = 'case_A_preexisting_app_tenant')));

  -- pre-migration schema objects the migration expects
  PERFORM tenant_test.check('T0', 'old app_tenant_id() body (jwt claim or auth.uid())',
    (SELECT prosrc FROM pg_proc WHERE oid = 'public.app_tenant_id()'::regprocedure) ~ 'COALESCE\(NULLIF\(auth\.jwt\(\) ->> ''tenant_id'', ''''\)::uuid, auth\.uid\(\)\)');
  PERFORM tenant_test.check('T0', '20 policies on stock_movements/categories/warehouses',
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
      AND tablename IN ('stock_movements', 'categories', 'warehouses')) = 20);
  PERFORM tenant_test.check('T0', 'current_accounts_tenant_check = CHECK ((tenant_id = get_jwt_tenant())), validated',
    EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'current_accounts_tenant_check'
             AND conrelid = 'public.current_accounts'::regclass AND convalidated AND NOT connoinherit
             AND pg_get_constraintdef(oid) = 'CHECK ((tenant_id = get_jwt_tenant()))'));
  PERFORM tenant_test.check('T0', '28 unwrapped *_tenant_* policies on the 7 tables (tenant_id = app_tenant_id())',
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
      AND tablename IN ('current_accounts', 'current_account_movements', 'invoices', 'invoice_items',
                        'products', 'transactions', 'collection_invoice_matches')
      AND policyname LIKE '%\_tenant\_%'
      AND (qual IS NULL OR qual = '(tenant_id = app_tenant_id())')
      AND (with_check IS NULL OR with_check = '(tenant_id = app_tenant_id())')) = 28);
  PERFORM tenant_test.check('T0', 'no backup schema yet', to_regnamespace('backup') IS NULL);
  PERFORM tenant_test.check('T0', 'normalize_tenant_id() absent', to_regprocedure('public.normalize_tenant_id()') IS NULL);
END $$;

-- RLS: pre-migration model, every user sees exactly the rows at its user id
SELECT tenant_test.rls_check('T0', 'current', 'user_id');

SELECT tenant_test.finish_stage('T0');
