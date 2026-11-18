-- LOCAL TEST DATABASE ONLY. T4: right after the rollback
-- (supabase/rollbacks/20261118130000_tenant_model_app_metadata.down.sql).
-- Run as postgres. Independent of the rollback's own R9 checks: compares the
-- result against the T0 and T2 captures taken by this harness.
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: tenant_test.local_marker not found (this is not the local test database)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tenant_test.fingerprint WHERE stage = 'T2') THEN
    RAISE EXCEPTION 'T2 capture missing: run 20/21 before the rollback';
  END IF;
END $$;

SELECT tenant_test.begin_stage('T4');
SELECT tenant_test.capture('T4');

DO $$
DECLARE
  n bigint;
  d text;
  n_deleted bigint := (SELECT count(*) FROM tenant_test.activity WHERE kind = 'deleted_moved' AND outcome = 'ok');
  n_changed bigint := (SELECT count(*) FROM tenant_test.activity WHERE kind = 'changed_moved' AND outcome = 'ok');
  n_moved bigint := (SELECT sum(moved) FROM tenant_test.expected_counts);
BEGIN
  -- 1. Schema exactly back to T0 (functions incl. ACL, policies, triggers,
  --    constraints, defaults, relation ACLs; stock objects included)
  SELECT string_agg(kind || ':' || obj, ', ') INTO d FROM tenant_test.fingerprint_diff('T0', 'T4');
  PERFORM tenant_test.check('T4', 'schema fingerprint identical to T0', d IS NULL, d);
  PERFORM tenant_test.check('T4', 'current_accounts_tenant_check back to CHECK ((tenant_id = get_jwt_tenant())), validated',
    (SELECT count(*) FROM pg_constraint WHERE conname = 'current_accounts_tenant_check'
      AND conrelid = 'public.current_accounts'::regclass AND convalidated AND NOT connoinherit
      AND pg_get_constraintdef(oid) = 'CHECK ((tenant_id = get_jwt_tenant()))') = 1
    AND (SELECT val FROM tenant_test.fingerprint WHERE stage = 'T4' AND kind = 'constraint'
          AND obj = 'current_accounts.current_accounts_tenant_check')
      = (SELECT val FROM tenant_test.fingerprint WHERE stage = 'T0' AND kind = 'constraint'
          AND obj = 'current_accounts.current_accounts_tenant_check'));

  -- 2. No row lost or added by the rollback
  FOR d IN SELECT tenant_test.tables() LOOP
    PERFORM tenant_test.check('T4', 'count T4 = T2 ' || d,
      (SELECT count(*) FROM tenant_test.row_tenants WHERE stage = 'T4' AND table_name = d)
      = (SELECT count(*) FROM tenant_test.row_tenants WHERE stage = 'T2' AND table_name = d));
  END LOOP;
  SELECT count(*) INTO n FROM (
    (SELECT table_name, row_id FROM tenant_test.row_tenants WHERE stage = 'T2'
     EXCEPT SELECT table_name, row_id FROM tenant_test.row_tenants WHERE stage = 'T4')
    UNION ALL
    (SELECT table_name, row_id FROM tenant_test.row_tenants WHERE stage = 'T4'
     EXCEPT SELECT table_name, row_id FROM tenant_test.row_tenants WHERE stage = 'T2')) x;
  PERFORM tenant_test.check('T4', 'same row ids as T2', n = 0, n || ' rows differ');

  -- 3. Rollback report for the moved rows
  PERFORM tenant_test.check('T4', 'R2 moved_row_missing_deleted = rows deleted in T2',
    (SELECT count(*) FROM backup.tenant_rollback_20261118_rows WHERE action = 'moved_row_missing_deleted') = n_deleted,
    format('%s (expected %s)', (SELECT count(*) FROM backup.tenant_rollback_20261118_rows WHERE action = 'moved_row_missing_deleted'), n_deleted));
  PERFORM tenant_test.check('T4', 'R2 moved_row_skipped_changed = rows changed in T2',
    (SELECT count(*) FROM backup.tenant_rollback_20261118_rows WHERE action = 'moved_row_skipped_changed') = n_changed,
    format('%s (expected %s)', (SELECT count(*) FROM backup.tenant_rollback_20261118_rows WHERE action = 'moved_row_skipped_changed'), n_changed));
  PERFORM tenant_test.check('T4', 'R2 moved_row_reverted = moved - deleted - changed',
    (SELECT count(*) FROM backup.tenant_rollback_20261118_rows WHERE action = 'moved_row_reverted') = n_moved - n_deleted - n_changed,
    format('%s (expected %s)', (SELECT count(*) FROM backup.tenant_rollback_20261118_rows WHERE action = 'moved_row_reverted'), n_moved - n_deleted - n_changed));

  -- 4. Rows that existed at T0: back to their T0 tenant, except rows an admin
  --    re-assigned in T2 (kept as they are and reported)
  SELECT count(*) INTO n
  FROM tenant_test.row_tenants a
  JOIN tenant_test.row_tenants b ON b.stage = 'T4' AND b.table_name = a.table_name AND b.row_id = a.row_id
  JOIN tenant_test.row_tenants c ON c.stage = 'T2' AND c.table_name = a.table_name AND c.row_id = a.row_id
  WHERE a.stage = 'T0'
    AND b.tenant_id IS DISTINCT FROM CASE
          WHEN EXISTS (SELECT 1 FROM tenant_test.activity x WHERE x.kind = 'changed_moved' AND x.row_id = a.row_id)
          THEN c.tenant_id ELSE a.tenant_id END;
  PERFORM tenant_test.check('T4', 'pre-existing rows at their T0 tenant', n = 0, n || ' rows wrong');

  -- 5. Rows created after the migration: user_id-rule tables back at the
  --    creator's user id, company_id-rule tables keep the company id
  SELECT count(*) INTO n
  FROM tenant_test.row_tenants c
  JOIN tenant_test.row_tenants b ON b.stage = 'T4' AND b.table_name = c.table_name AND b.row_id = c.row_id
  LEFT JOIN tenant_test.test_users tu ON tu.company_id = c.tenant_id
  WHERE c.stage = 'T2'
    AND NOT EXISTS (SELECT 1 FROM tenant_test.row_tenants a WHERE a.stage = 'T0' AND a.table_name = c.table_name AND a.row_id = c.row_id)
    AND b.tenant_id IS DISTINCT FROM CASE
          WHEN c.table_name IN ('invoices', 'invoice_items', 'products', 'stock_movements') THEN c.tenant_id
          ELSE COALESCE(tu.user_id, c.tenant_id) END;
  PERFORM tenant_test.check('T4', 'post-migration rows at the expected tenant', n = 0, n || ' rows wrong');

  SELECT count(*) INTO n
  FROM tenant_test.row_tenants c
  WHERE c.stage = 'T2'
    AND NOT EXISTS (SELECT 1 FROM tenant_test.row_tenants a WHERE a.stage = 'T0' AND a.table_name = c.table_name AND a.row_id = c.row_id)
    AND (SELECT count(*) FROM backup.tenant_rollback_20261118_rows l
          WHERE l.table_name = c.table_name AND l.row_id = c.row_id AND l.action LIKE 'post_migration_%') <> 1;
  PERFORM tenant_test.check('T4', 'every post-migration row reported exactly once', n = 0, n || ' rows');

  SELECT count(*) INTO n
  FROM tenant_test.activity x
  WHERE x.kind = 'insert_post_migration' AND x.outcome = 'ok' AND x.row_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM tenant_test.row_tenants b WHERE b.stage = 'T4' AND b.table_name = x.table_name AND b.row_id = x.row_id);
  PERFORM tenant_test.check('T4', 'no row created in T2 was lost', n = 0, n || ' missing');

  -- 6. Users
  SELECT count(*) INTO n
  FROM tenant_test.user_meta a
  JOIN auth.users u ON u.id = a.user_id
  WHERE a.stage = 'T0'
    AND (u.raw_app_meta_data IS DISTINCT FROM a.raw_app_meta_data
         OR u.raw_user_meta_data IS DISTINCT FROM a.raw_user_meta_data);
  PERFORM tenant_test.check('T4', 'pre-existing users: app and user metadata exactly as T0', n = 0, n || ' users differ');

  SELECT string_agg(action || '=' || c, ', ' ORDER BY action) INTO d
  FROM (SELECT action, count(*) AS c FROM backup.tenant_rollback_20261118_users GROUP BY 1) x;
  PERFORM tenant_test.check('T4', 'rollback user report covers every user',
    (SELECT count(*) FROM backup.tenant_rollback_20261118_users) = (SELECT count(*) FROM auth.users), d);

  -- Only when 20_signup_and_meta.sql ran (SQL runs; the app run skips it)
  IF EXISTS (SELECT 1 FROM tenant_test.activity WHERE kind = 'signup') THEN
    PERFORM tenant_test.check('T4', 'u17 (case C): app_metadata.tenant_id removed, user_metadata kept',
      EXISTS (SELECT 1 FROM auth.users WHERE id = tenant_test.uid(17)
               AND NOT (raw_app_meta_data ? 'tenant_id')
               AND raw_user_meta_data ->> 'tenant_id' = tenant_test.company_of(17)::text));
    PERFORM tenant_test.check('T4', 'u18 (case C conflict): app_metadata.tenant_id kept',
      EXISTS (SELECT 1 FROM auth.users WHERE id = tenant_test.uid(18)
               AND raw_app_meta_data ->> 'tenant_id' = tenant_test.company_of(18)::text
               AND raw_user_meta_data ->> 'tenant_id' = tenant_test.rid('tampered', 18)::text));
    PERFORM tenant_test.check('T4', 'u12 report: user_meta restored',
      (SELECT action FROM backup.tenant_rollback_20261118_users WHERE user_id = tenant_test.uid(12)) LIKE '%+user_meta_tenant_restored', d);
    PERFORM tenant_test.check('T4', 'u17 report: C_new_user_app_tenant_removed',
      (SELECT action FROM backup.tenant_rollback_20261118_users WHERE user_id = tenant_test.uid(17)) = 'C_new_user_app_tenant_removed', d);
    PERFORM tenant_test.check('T4', 'u18 report: C_new_user_conflict_app_tenant_kept',
      (SELECT action FROM backup.tenant_rollback_20261118_users WHERE user_id = tenant_test.uid(18)) = 'C_new_user_conflict_app_tenant_kept', d);
  END IF;
  PERFORM tenant_test.check('T4', 'case A users restored to their pre-existing value',
    NOT EXISTS (SELECT 1 FROM tenant_test.test_users tu
                JOIN backup.tenant_rollback_20261118_users r ON r.user_id = tu.user_id
                WHERE tu.scenario = 'case_A_preexisting_app_tenant'
                  AND r.action NOT LIKE 'A_app_tenant_restored_to_preexisting%'), d);

  -- 7. Backups and reports are kept
  PERFORM tenant_test.check('T4', 'migration backups kept (8 tables)',
    (SELECT count(*) FROM pg_tables WHERE schemaname = 'backup' AND tablename LIKE 'tenant_migration_20261118_%') = 8);
  PERFORM tenant_test.check('T4', '28 wrapped policies back to (tenant_id = app_tenant_id()), identical to T0',
    (SELECT count(*) FROM tenant_test.fingerprint a
       JOIN tenant_test.fingerprint b ON b.stage = 'T4' AND b.kind = 'policy' AND b.obj = a.obj AND b.val = a.val
      WHERE a.stage = 'T0' AND a.kind = 'policy'
        AND split_part(a.obj, '.', 1) IN ('current_accounts', 'current_account_movements', 'invoices', 'invoice_items',
                                          'products', 'transactions', 'collection_invoice_matches')) = 28);
  PERFORM tenant_test.check('T4', 'rollback reports written (3 tables, summary not empty)',
    (SELECT count(*) FROM pg_tables WHERE schemaname = 'backup' AND tablename LIKE 'tenant_rollback_20261118_%') = 3
    AND EXISTS (SELECT 1 FROM backup.tenant_rollback_20261118_summary));
END $$;

-- 8. RLS: pre-migration model again
SELECT tenant_test.rls_check('T4', 'current', 'user_id');

SELECT scope, action, row_count FROM backup.tenant_rollback_20261118_summary ORDER BY scope, action;
SELECT tenant_test.finish_stage('T4');
