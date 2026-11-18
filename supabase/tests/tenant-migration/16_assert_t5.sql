-- LOCAL TEST DATABASE ONLY. T5: after trying to run the forward migration and
-- the rollback a second time (run_stage.ps1 -Stage T5 expects both to abort).
-- Run as postgres. Nothing may have changed since T4.
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: tenant_test.local_marker not found (this is not the local test database)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tenant_test.fingerprint WHERE stage = 'T4') THEN
    RAISE EXCEPTION 'T4 capture missing';
  END IF;
END $$;

SELECT tenant_test.begin_stage('T5');
SELECT tenant_test.capture('T5');

DO $$
DECLARE
  n bigint;
  d text;
BEGIN
  SELECT string_agg(kind || ':' || obj, ', ') INTO d FROM (
    SELECT kind, obj FROM tenant_test.fingerprint_diff('T4', 'T5')
    UNION ALL
    -- backup schema too: a second run must not create or drop anything there
    SELECT 'backup_table', obj FROM (
      (SELECT obj FROM tenant_test.fingerprint WHERE stage = 'T4' AND kind = 'backup_table'
       EXCEPT SELECT obj FROM tenant_test.fingerprint WHERE stage = 'T5' AND kind = 'backup_table')
      UNION ALL
      (SELECT obj FROM tenant_test.fingerprint WHERE stage = 'T5' AND kind = 'backup_table'
       EXCEPT SELECT obj FROM tenant_test.fingerprint WHERE stage = 'T4' AND kind = 'backup_table')) y
  ) x;
  PERFORM tenant_test.check('T5', 'schema and backup schema unchanged since T4', d IS NULL, d);

  SELECT count(*) INTO n FROM (
    (SELECT table_name, row_id, tenant_id FROM tenant_test.row_tenants WHERE stage = 'T4'
     EXCEPT SELECT table_name, row_id, tenant_id FROM tenant_test.row_tenants WHERE stage = 'T5')
    UNION ALL
    (SELECT table_name, row_id, tenant_id FROM tenant_test.row_tenants WHERE stage = 'T5'
     EXCEPT SELECT table_name, row_id, tenant_id FROM tenant_test.row_tenants WHERE stage = 'T4')) x;
  PERFORM tenant_test.check('T5', 'rows and tenants unchanged since T4', n = 0, n || ' differences');

  SELECT count(*) INTO n FROM tenant_test.user_meta a
  JOIN tenant_test.user_meta b ON b.stage = 'T5' AND b.user_id = a.user_id
  WHERE a.stage = 'T4'
    AND (a.raw_app_meta_data IS DISTINCT FROM b.raw_app_meta_data
         OR a.raw_user_meta_data IS DISTINCT FROM b.raw_user_meta_data);
  PERFORM tenant_test.check('T5', 'user metadata unchanged since T4', n = 0, n || ' users');
END $$;

SELECT tenant_test.finish_stage('T5');
