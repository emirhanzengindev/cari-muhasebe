-- READ-ONLY post-check after 20261118130000_tenant_model_app_metadata.sql.
-- Returns counts and catalog definitions only. READ ONLY transaction, ROLLBACK.
-- Expected values: runbook, Adım 3.1.
\set ON_ERROR_STOP on
\pset footer off
BEGIN READ ONLY;

\echo '== migration result (moved_rows = N, users_with_app_tenant = M from the pre-flight)'
SELECT (SELECT count(*) FROM backup.tenant_migration_20261118_rows) AS moved_rows,
       (SELECT count(*) FROM auth.users WHERE raw_app_meta_data ? 'tenant_id') AS users_with_app_tenant,
       (SELECT count(*) FROM pg_class WHERE relnamespace = 'backup'::regnamespace AND relkind = 'r'
          AND relname LIKE 'tenant_migration_20261118_%') AS backup_tables,
       (SELECT pg_get_constraintdef(oid) FROM pg_constraint
         WHERE conrelid = 'public.current_accounts'::regclass AND conname = 'current_accounts_tenant_check') AS check_def,
       (SELECT count(*) FROM pg_trigger WHERE tgname = 'trg_normalize_tenant_id' AND NOT tgisinternal) AS normalize_triggers;

\echo '== rows still at a mapped user id (expect 0)'
WITH mapped AS (
  SELECT id AS user_id FROM auth.users
  WHERE raw_app_meta_data ? 'tenant_id' AND raw_app_meta_data ->> 'tenant_id' <> id::text)
SELECT sum(n) AS rows_left_at_user_id FROM (
            SELECT count(*) n FROM public.categories r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.invoices r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.warehouses r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.stock_movements r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.current_accounts r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.current_account_movements r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.collection_invoice_matches r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.transactions r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.products r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.invoice_items r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.safes r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.banks r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
  UNION ALL SELECT count(*) FROM public.cheques r WHERE r.tenant_id IN (SELECT user_id FROM mapped)
) x;

\echo '== app_tenant_id() attributes (expect t / postgres / {search_path=pg_catalog} / s)'
SELECT prosecdef AS secdef, proowner::regrole AS owner, proconfig AS config, provolatile AS volatility
FROM pg_proc WHERE oid = 'public.app_tenant_id()'::regprocedure;

ROLLBACK;
