-- READ-ONLY pre-flight for 20261118130000_tenant_model_app_metadata.sql.
-- Returns counts only (no row content, no query text of other sessions).
-- Runs inside a READ ONLY transaction and ends with ROLLBACK.
-- Run as postgres (session pooler), see the runbook. Every value is explained
-- in 20261118130000_tenant_model_app_metadata.md, Adım 0.4.
\set ON_ERROR_STOP on
\pset footer off
BEGIN READ ONLY;

\echo '== session (expect postgres / postgres / true)'
SELECT session_user, current_user, auth.uid() IS NULL AND auth.jwt() IS NULL AS no_jwt;

\echo '== migration state (expect true / CHECK ((tenant_id = get_jwt_tenant())))'
SELECT to_regclass('backup.tenant_migration_20261118_users') IS NULL AS not_yet_run,
       (SELECT pg_get_constraintdef(oid) FROM pg_constraint
         WHERE conrelid = 'public.current_accounts'::regclass AND conname = 'current_accounts_tenant_check') AS check_def;

-- pf_map = the mapping the migration builds (user id -> user_metadata.tenant_id)
\echo '== users (meta_other_owner, shared_tenant, tenant_is_other_user must be 0)'
WITH pf_map AS (
  SELECT id AS user_id, (raw_user_meta_data ->> 'tenant_id')::uuid AS tenant_id
  FROM auth.users
  WHERE raw_user_meta_data ->> 'tenant_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
SELECT (SELECT count(*) FROM auth.users) AS users_total,
       (SELECT count(*) FROM pf_map) AS users_mapped,
       (SELECT count(*) FROM pf_map m WHERE EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = m.tenant_id AND t.owner_user_id = m.user_id)) AS meta_own_tenant_row,
       (SELECT count(*) FROM pf_map m WHERE NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = m.tenant_id)) AS meta_without_tenant_row,
       (SELECT count(*) FROM pf_map m WHERE EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = m.tenant_id AND t.owner_user_id <> m.user_id)) AS meta_other_owner,
       (SELECT count(*) - count(DISTINCT tenant_id) FROM pf_map) AS shared_tenant,
       (SELECT count(*) FROM pf_map m JOIN auth.users u ON u.id = m.tenant_id AND u.id <> m.user_id) AS tenant_is_other_user,
       (SELECT count(*) FROM auth.users WHERE raw_app_meta_data ? 'tenant_id') AS users_with_app_tenant_already;

\echo '== rows the migration will move (tenant_id = a mapped user id)'
WITH pf_map AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE raw_user_meta_data ->> 'tenant_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
per_table AS (
            SELECT 'categories' AS table_name, (SELECT count(*) FROM public.categories r WHERE r.tenant_id IN (SELECT user_id FROM pf_map)) AS rows_to_move
  UNION ALL SELECT 'invoices', (SELECT count(*) FROM public.invoices r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'warehouses', (SELECT count(*) FROM public.warehouses r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'stock_movements', (SELECT count(*) FROM public.stock_movements r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'current_accounts', (SELECT count(*) FROM public.current_accounts r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'current_account_movements', (SELECT count(*) FROM public.current_account_movements r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'collection_invoice_matches', (SELECT count(*) FROM public.collection_invoice_matches r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'transactions', (SELECT count(*) FROM public.transactions r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'products', (SELECT count(*) FROM public.products r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'invoice_items', (SELECT count(*) FROM public.invoice_items r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'safes', (SELECT count(*) FROM public.safes r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'banks', (SELECT count(*) FROM public.banks r WHERE r.tenant_id IN (SELECT user_id FROM pf_map))
  UNION ALL SELECT 'cheques', (SELECT count(*) FROM public.cheques r WHERE r.tenant_id IN (SELECT user_id FROM pf_map)))
SELECT table_name, rows_to_move FROM per_table
UNION ALL SELECT '= TOTAL', sum(rows_to_move) FROM per_table
ORDER BY 1;

\echo '== transactions open longer than 30 s (expect 0 rows; no query text is read)'
SELECT pid, usename, application_name, state, round(extract(epoch FROM now() - xact_start)) AS open_seconds
FROM pg_stat_activity
WHERE datname = current_database() AND pid <> pg_backend_pid()
  AND xact_start < now() - interval '30 seconds';

ROLLBACK;
