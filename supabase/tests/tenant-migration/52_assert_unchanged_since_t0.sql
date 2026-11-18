-- LOCAL TEST DATABASE ONLY. Used by 50_lock_timeout.ps1 after a run that must
-- have aborted on lock_timeout: the aborted transaction must leave no trace.
-- Run as postgres.
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: tenant_test.local_marker not found (this is not the local test database)';
  END IF;
END $$;

SELECT tenant_test.begin_stage('LOCKCHK');
SELECT tenant_test.capture('LOCKCHK');

DO $$
DECLARE
  n bigint;
  d text;
BEGIN
  SELECT string_agg(kind || ':' || obj, ', ') INTO d FROM tenant_test.fingerprint_diff('T0', 'LOCKCHK');
  PERFORM tenant_test.check('LOCKCHK', 'schema identical to T0', d IS NULL, d);
  PERFORM tenant_test.check('LOCKCHK', 'no backup schema created', to_regnamespace('backup') IS NULL);
  SELECT count(*) INTO n FROM (
    (SELECT table_name, row_id, tenant_id FROM tenant_test.row_tenants WHERE stage = 'T0'
     EXCEPT SELECT table_name, row_id, tenant_id FROM tenant_test.row_tenants WHERE stage = 'LOCKCHK')
    UNION ALL
    (SELECT table_name, row_id, tenant_id FROM tenant_test.row_tenants WHERE stage = 'LOCKCHK'
     EXCEPT SELECT table_name, row_id, tenant_id FROM tenant_test.row_tenants WHERE stage = 'T0')) x;
  PERFORM tenant_test.check('LOCKCHK', 'rows and tenants identical to T0', n = 0, n || ' differences');
  SELECT count(*) INTO n FROM tenant_test.user_meta a
  JOIN auth.users u ON u.id = a.user_id
  WHERE a.stage = 'T0' AND (u.raw_app_meta_data IS DISTINCT FROM a.raw_app_meta_data
                            OR u.raw_user_meta_data IS DISTINCT FROM a.raw_user_meta_data);
  PERFORM tenant_test.check('LOCKCHK', 'user metadata identical to T0', n = 0, n || ' users');
END $$;

SELECT tenant_test.finish_stage('LOCKCHK');
