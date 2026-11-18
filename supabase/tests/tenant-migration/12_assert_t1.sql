-- LOCAL TEST DATABASE ONLY. T1: right after the forward migration
-- (supabase/migrations/20261118130000_tenant_model_app_metadata.sql).
-- Run as postgres. Compares against the T0 capture.
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: tenant_test.local_marker not found (this is not the local test database)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tenant_test.fingerprint WHERE stage = 'T0') THEN
    RAISE EXCEPTION 'T0 capture missing: run 11_assert_t0.sql first';
  END IF;
END $$;

SELECT tenant_test.begin_stage('T1');
SELECT tenant_test.capture('T1');

DO $$
DECLARE
  n bigint;
  d text;
BEGIN
  -- 1. Row counts unchanged, no row added or lost
  FOR d IN SELECT tenant_test.tables() LOOP
    PERFORM tenant_test.check('T1', 'count unchanged ' || d,
      (SELECT count(*) FROM tenant_test.row_tenants WHERE stage = 'T1' AND table_name = d)
      = (SELECT count(*) FROM tenant_test.row_tenants WHERE stage = 'T0' AND table_name = d));
  END LOOP;
  SELECT count(*) INTO n FROM (
    (SELECT table_name, row_id FROM tenant_test.row_tenants WHERE stage = 'T0'
     EXCEPT SELECT table_name, row_id FROM tenant_test.row_tenants WHERE stage = 'T1')
    UNION ALL
    (SELECT table_name, row_id FROM tenant_test.row_tenants WHERE stage = 'T1'
     EXCEPT SELECT table_name, row_id FROM tenant_test.row_tenants WHERE stage = 'T0')) x;
  PERFORM tenant_test.check('T1', 'same row ids as T0', n = 0, n || ' rows differ');

  -- 2. Every row: user id -> that user's company, everything else unchanged
  SELECT count(*) INTO n
  FROM tenant_test.row_tenants a
  JOIN tenant_test.row_tenants b ON b.stage = 'T1' AND b.table_name = a.table_name AND b.row_id = a.row_id
  LEFT JOIN tenant_test.test_users u ON u.user_id = a.tenant_id
  WHERE a.stage = 'T0'
    AND b.tenant_id IS DISTINCT FROM COALESCE(u.company_id, a.tenant_id);
  PERFORM tenant_test.check('T1', 'every row at the expected tenant', n = 0, n || ' rows wrong');

  SELECT count(*) INTO n
  FROM tenant_test.row_tenants b JOIN tenant_test.test_users u ON u.user_id = b.tenant_id
  WHERE b.stage = 'T1';
  PERFORM tenant_test.check('T1', 'no row left under a user id', n = 0, n || ' rows');

  PERFORM tenant_test.check('T1', 'orphan stock_movements untouched (7)',
    (SELECT count(*) FROM public.stock_movements s
      WHERE NOT EXISTS (SELECT 1 FROM tenant_test.test_users t WHERE s.tenant_id IN (t.user_id, t.company_id))) = 7);

  -- 3. Moved-row backup = expected moved rows, per table
  PERFORM tenant_test.check('T1', 'backup _rows total = expected moved',
    (SELECT count(*) FROM backup.tenant_migration_20261118_rows) = (SELECT sum(moved) FROM tenant_test.expected_counts),
    format('%s (expected %s)', (SELECT count(*) FROM backup.tenant_migration_20261118_rows),
                               (SELECT sum(moved) FROM tenant_test.expected_counts)));
  FOR d IN SELECT table_name FROM tenant_test.expected_counts LOOP
    PERFORM tenant_test.check('T1', 'backup _rows ' || d,
      (SELECT count(*) FROM backup.tenant_migration_20261118_rows WHERE table_name = d)
      = (SELECT moved FROM tenant_test.expected_counts WHERE table_name = d));
  END LOOP;
  PERFORM tenant_test.check('T1', 'backup _snapshot = all T0 rows',
    (SELECT count(*) FROM backup.tenant_migration_20261118_snapshot)
    = (SELECT count(*) FROM tenant_test.row_tenants WHERE stage = 'T0'));
  PERFORM tenant_test.check('T1', 'backup _users = 16', (SELECT count(*) FROM backup.tenant_migration_20261118_users) = 16);
  PERFORM tenant_test.check('T1', 'backup _functions 7 (5 replaced)',
    (SELECT count(*) FROM backup.tenant_migration_20261118_functions) = 7
    AND (SELECT count(*) FROM backup.tenant_migration_20261118_functions WHERE replaced) = 5);
  PERFORM tenant_test.check('T1', 'backup _policies 20', (SELECT count(*) FROM backup.tenant_migration_20261118_policies) = 20);
  PERFORM tenant_test.check('T1', 'backup _defaults 2', (SELECT count(*) FROM backup.tenant_migration_20261118_defaults) = 2);
  PERFORM tenant_test.check('T1', 'backup _constraints = the T0 constraint',
    (SELECT count(*) FROM backup.tenant_migration_20261118_constraints b
      JOIN tenant_test.fingerprint f ON f.stage = 'T0' AND f.kind = 'constraint'
       AND f.obj = 'current_accounts.' || b.constraint_name
       AND f.val = 'c ' || b.definition || ' valid=' || b.validated::text) = 1
    AND (SELECT count(*) FROM backup.tenant_migration_20261118_constraints) = 1);

  -- 4. Users: app_metadata = T0 app_metadata + tenant_id (other keys kept), user_metadata unchanged
  SELECT count(*) INTO n
  FROM tenant_test.user_meta a
  JOIN tenant_test.user_meta b ON b.stage = 'T1' AND b.user_id = a.user_id
  JOIN tenant_test.test_users t ON t.user_id = a.user_id
  WHERE a.stage = 'T0'
    AND (b.raw_app_meta_data IS DISTINCT FROM (a.raw_app_meta_data || jsonb_build_object('tenant_id', t.company_id::text))
         OR b.raw_user_meta_data IS DISTINCT FROM a.raw_user_meta_data);
  PERFORM tenant_test.check('T1', 'user metadata exactly as expected', n = 0, n || ' users differ');

  -- 5. Backup schema not reachable from the API roles
  PERFORM tenant_test.check('T1', 'backup schema: no USAGE for anon/authenticated/service_role',
    NOT has_schema_privilege('anon', 'backup', 'USAGE')
    AND NOT has_schema_privilege('authenticated', 'backup', 'USAGE')
    AND NOT has_schema_privilege('service_role', 'backup', 'USAGE'));

  -- 6. Schema change is exactly the intended set (everything else, stock
  --    functions and triggers included, is identical to T0)
  SELECT string_agg(kind || ':' || obj, ', ') INTO d FROM (
    SELECT kind, obj FROM tenant_test.fingerprint_diff('T0', 'T1')
    EXCEPT
    SELECT * FROM (VALUES
      ('func', 'app_tenant_id()'), ('func', 'handle_new_user()'), ('func', 'set_tenant_id_from_user()'),
      ('func', 'record_current_account_movement(uuid,text,numeric,integer,text,text,date,text,uuid,jsonb)'),
      ('func', 'delete_current_account_movement(uuid)'),
      ('func', 'record_current_account_movement(uuid,uuid,text,numeric,integer,date,text,text,uuid,jsonb)'),
      ('func', 'delete_current_account_movement(uuid,uuid)'),
      ('func', 'normalize_tenant_id()'),
      ('trigger', 'current_accounts.trg_normalize_tenant_id'), ('trigger', 'banks.trg_normalize_tenant_id'),
      ('trigger', 'cheques.trg_normalize_tenant_id'), ('trigger', 'warehouses.trg_normalize_tenant_id'),
      ('default', 'categories.tenant_id'), ('default', 'current_accounts.tenant_id'),
      ('constraint', 'current_accounts.current_accounts_tenant_check')) v(kind, obj)
    EXCEPT
    SELECT 'policy', tablename || '.' || policyname FROM backup.tenant_migration_20261118_policies
    EXCEPT
    SELECT 'policy', tablename || '.' || policyname FROM backup.tenant_migration_20261118_wrapped_policies
    EXCEPT
    SELECT 'policy', tablename || '.' || policyname FROM pg_policies
     WHERE schemaname = 'public' AND policyname LIKE '%\_tenant\_%'
       AND tablename IN ('stock_movements', 'categories', 'warehouses')
  ) x;
  PERFORM tenant_test.check('T1', 'no unexpected schema change', d IS NULL, d);

  SELECT count(*) INTO n FROM tenant_test.fingerprint_diff('T0', 'T1') WHERE kind = 'policy';
  PERFORM tenant_test.check('T1', 'policy diff = 20 dropped + 12 created + 28 wrapped', n = 60, n || ' policy diffs');

  -- Wrapped policies, independent of the migration's own check: the T1
  -- fingerprint (permissive | command | roles | USING | WITH CHECK) equals the
  -- T0 one with only app_tenant_id() replaced by its sub-select form
  SELECT count(*) INTO n
  FROM tenant_test.fingerprint a
  JOIN tenant_test.fingerprint b ON b.stage = 'T1' AND b.kind = 'policy' AND b.obj = a.obj
  WHERE a.stage = 'T0' AND a.kind = 'policy'
    AND split_part(a.obj, '.', 1) IN ('current_accounts', 'current_account_movements', 'invoices', 'invoice_items',
                                      'products', 'transactions', 'collection_invoice_matches')
    AND b.val = replace(a.val, '(tenant_id = app_tenant_id())', '(tenant_id = ( SELECT app_tenant_id() AS app_tenant_id))')
    AND b.val <> a.val;
  PERFORM tenant_test.check('T1', '28 policies: only app_tenant_id() wrapped, permissive/command/roles/USING/WITH CHECK shape unchanged',
    n = 28, n || ' of 28');
  PERFORM tenant_test.check('T1', 'backup _wrapped_policies 28', (SELECT count(*) FROM backup.tenant_migration_20261118_wrapped_policies) = 28);

  -- app_tenant_id(): only the body changed; owner, SECURITY DEFINER, settings,
  -- volatility, language, return type, arguments and ACL identical to T0
  PERFORM tenant_test.check('T1', 'app_tenant_id(): every attribute except the body identical to T0',
    (SELECT regexp_replace(val, '^src=[0-9a-f]+ \| ', '') FROM tenant_test.fingerprint
      WHERE stage = 'T0' AND kind = 'func' AND obj = 'app_tenant_id()')
    = (SELECT regexp_replace(val, '^src=[0-9a-f]+ \| ', '') FROM tenant_test.fingerprint
        WHERE stage = 'T1' AND kind = 'func' AND obj = 'app_tenant_id()'),
    (SELECT val FROM tenant_test.fingerprint WHERE stage = 'T1' AND kind = 'func' AND obj = 'app_tenant_id()'));
  PERFORM tenant_test.check('T1', 'app_tenant_id(): no EXECUTE for PUBLIC',
    NOT EXISTS (SELECT 1 FROM pg_proc p, aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
                WHERE p.oid = 'public.app_tenant_id()'::regprocedure AND a.grantee = 0));
  PERFORM tenant_test.check('T1', 'stock functions/triggers unchanged',
    NOT EXISTS (SELECT 1 FROM tenant_test.fingerprint_diff('T0', 'T1')
                WHERE obj ~ '(apply_stock_movement|update_product_stock|process_stock_movement|trg_update_product_stock)'));
  PERFORM tenant_test.check('T1', 'only current_accounts_tenant_check changed among constraints',
    (SELECT string_agg(obj, ',') FROM tenant_test.fingerprint_diff('T0', 'T1') WHERE kind = 'constraint')
    = 'current_accounts.current_accounts_tenant_check');
  PERFORM tenant_test.check('T1', 'current_accounts_tenant_check = CHECK ((tenant_id = app_tenant_id())), validated',
    EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'current_accounts_tenant_check'
             AND conrelid = 'public.current_accounts'::regclass AND convalidated AND NOT connoinherit
             AND pg_get_constraintdef(oid) = 'CHECK ((tenant_id = app_tenant_id()))'));
  PERFORM tenant_test.check('T1', 'get_jwt_tenant() itself unchanged',
    NOT EXISTS (SELECT 1 FROM tenant_test.fingerprint_diff('T0', 'T1') WHERE obj = 'get_jwt_tenant()'));

  -- 7. New objects have the intended attributes
  PERFORM tenant_test.check('T1', 'app_tenant_id(): SECURITY DEFINER, search_path=pg_catalog, STABLE, owner postgres',
    EXISTS (SELECT 1 FROM pg_proc WHERE oid = 'public.app_tenant_id()'::regprocedure
             AND prosecdef AND proconfig = ARRAY['search_path=pg_catalog'] AND provolatile = 's'
             AND proowner = 'postgres'::regrole));
  PERFORM tenant_test.check('T1', 'app_tenant_id() reads neither JWT tenant claims nor user_metadata',
    EXISTS (SELECT 1 FROM pg_proc WHERE oid = 'public.app_tenant_id()'::regprocedure
             AND prosrc !~* 'jwt' AND prosrc !~* 'user_meta' AND prosrc ~ 'raw_app_meta_data'));
  PERFORM tenant_test.check('T1', 'normalize_tenant_id(): SECURITY INVOKER',
    EXISTS (SELECT 1 FROM pg_proc WHERE oid = 'public.normalize_tenant_id()'::regprocedure AND NOT prosecdef));
  PERFORM tenant_test.check('T1', '12 new policies TO authenticated using app_tenant_id()',
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
       AND tablename IN ('stock_movements', 'categories', 'warehouses')
       AND roles = ARRAY['authenticated']::name[]
       AND (qual IS NULL OR qual LIKE '%app_tenant_id()%')
       AND (with_check IS NULL OR with_check LIKE '%app_tenant_id()%')) = 12
    AND (SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
           AND tablename IN ('stock_movements', 'categories', 'warehouses')) = 12);
  PERFORM tenant_test.check('T1', 'update policies have USING and WITH CHECK',
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND cmd = 'UPDATE'
       AND tablename IN ('stock_movements', 'categories', 'warehouses')
       AND qual IS NOT NULL AND with_check IS NOT NULL) = 3);
END $$;

-- 8. EXECUTE matrix for the API roles
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('public.app_tenant_id()',                     false, true),
    ('public.handle_new_user()',                   false, false),
    ('public.set_tenant_id_from_user()',           false, false),
    ('public.normalize_tenant_id()',               false, false),
    ('public.record_current_account_movement(uuid, text, numeric, integer, text, text, date, text, uuid, jsonb)', NULL, true),
    ('public.delete_current_account_movement(uuid)', NULL, true),
    ('public.record_current_account_movement(uuid, uuid, text, numeric, integer, date, text, text, uuid, jsonb)', false, false),
    ('public.delete_current_account_movement(uuid, uuid)', false, false),
    ('public.apply_stock_movement(uuid, integer, text, text, uuid, numeric)', false, true)
  ) v(sig, anon_expected, auth_expected) LOOP
    IF r.anon_expected IS NOT NULL THEN
      PERFORM tenant_test.check('T1', 'EXECUTE anon ' || r.sig,
        has_function_privilege('anon', r.sig, 'EXECUTE') = r.anon_expected,
        'expected ' || r.anon_expected);
    END IF;
    PERFORM tenant_test.check('T1', 'EXECUTE authenticated ' || r.sig,
      has_function_privilege('authenticated', r.sig, 'EXECUTE') = r.auth_expected,
      'expected ' || r.auth_expected);
  END LOOP;
END $$;

-- 9. RLS: new model. Fresh tokens and tokens minted before the migration
--    (their app_metadata has no tenant_id, or a stale one for case A users)
--    must both resolve the company from the database.
SELECT tenant_test.rls_check('T1', 'current', 'company');
SELECT tenant_test.rls_check('T1', 'old', 'company');

SELECT tenant_test.finish_stage('T1');
