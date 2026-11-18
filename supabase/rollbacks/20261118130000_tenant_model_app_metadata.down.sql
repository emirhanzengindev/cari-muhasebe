-- ROLLBACK for supabase/migrations/20261118130000_tenant_model_app_metadata.sql
--
-- This is NOT a migration. It lives outside supabase/migrations on purpose so
-- `supabase db push` can never run it by accident. Run it by hand, once, in the
-- SQL Editor, right after the previous production build is live again.
--
-- Guarantees (each one is checked in R9; any failure aborts everything):
--   * no row is deleted: per-table row counts are identical before and after
--   * every row the migration moved is either reverted or reported
--     (changed or deleted since the migration), never skipped silently
--   * every row created after the migration is accounted for exactly once and
--     stays readable by the previous build (see the per-table rules in R3)
--   * the 20 replaced policies, the 28 wrapped policies (USING / WITH CHECK
--     text, roles, command, permissive), the 7 functions (body, security mode, settings,
--     volatility, strictness, leakproof, parallel, language, return type,
--     arguments, owner and ACL), the 2 column defaults and the
--     current_accounts_tenant_check constraint (definition, validated,
--     no-inherit) are back exactly
--   * app_metadata.tenant_id and user_metadata.tenant_id are back to their
--     pre-migration values for every user that existed before the migration
--
-- Results are kept in backup.tenant_rollback_20261118_rows, _users and
-- _summary (the SQL Editor may not display NOTICE output).

BEGIN;

-- Pre-flight, before any setting, lock or change: run as postgres with no API
-- identity. With SQL Editor role impersonation (or any JWT claims set) the
-- restored CHECK validation and the tenant functions would see a user's
-- tenant instead of the database. Abort instead.
--   session_user: the role that logged in (psql / SQL Editor connect as
--                 postgres; a pooler user postgres.<project ref> is postgres)
--   current_user: the effective role (SET ROLE or impersonation changes it)
DO $$
BEGIN
  IF session_user <> 'postgres' OR current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Abort: run as postgres (session_user is %, current_user is %)', session_user, current_user;
  END IF;
  IF auth.uid() IS NOT NULL OR auth.jwt() IS NOT NULL THEN
    RAISE EXCEPTION 'Abort: JWT claims are set in this session (role impersonation?). Run as postgres without impersonation.';
  END IF;
  -- Second run: stop before taking any lock. Checked before R0 too, because
  -- after a completed rollback the constraint and policies are already
  -- restored and R0 would abort with a misleading reason.
  IF to_regclass('backup.tenant_rollback_20261118_rows') IS NOT NULL THEN
    RAISE EXCEPTION 'Abort: rollback already ran (backup.tenant_rollback_20261118_rows exists)';
  END IF;
END $$;

-- Same search_path as the migration, so restored text deparses identically.
SET LOCAL search_path = public, pg_catalog;
SET LOCAL lock_timeout = '5s';

-- Strongest needed level up front (no mid-transaction lock upgrade).
-- ACCESS EXCLUSIVE: tables that get trigger, policy, default or constraint DDL below.
LOCK TABLE
  public.stock_movements, public.categories, public.warehouses,
  public.current_accounts, public.banks, public.cheques,
  public.invoices, public.current_account_movements,
  public.collection_invoice_matches, public.transactions, public.products,
  public.invoice_items
IN ACCESS EXCLUSIVE MODE;
-- SHARE ROW EXCLUSIVE: safes only gets rows updated.
LOCK TABLE public.safes IN SHARE ROW EXCLUSIVE MODE;

-- ---------------------------------------------------------------------------
-- R0) Preconditions
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'backup.tenant_migration_20261118_users',
    'backup.tenant_migration_20261118_functions',
    'backup.tenant_migration_20261118_policies',
    'backup.tenant_migration_20261118_wrapped_policies',
    'backup.tenant_migration_20261118_defaults',
    'backup.tenant_migration_20261118_constraints',
    'backup.tenant_migration_20261118_snapshot',
    'backup.tenant_migration_20261118_rows'
  ] LOOP
    IF to_regclass(t) IS NULL THEN
      RAISE EXCEPTION 'Abort: backup table % is missing', t;
    END IF;
  END LOOP;

  IF (SELECT count(*) FROM backup.tenant_migration_20261118_functions) <> 7
     OR (SELECT count(*) FROM backup.tenant_migration_20261118_functions WHERE replaced) <> 5
     OR (SELECT count(*) FROM backup.tenant_migration_20261118_policies) <> 20
     OR (SELECT count(*) FROM backup.tenant_migration_20261118_wrapped_policies) <> 28
     OR (SELECT count(*) FROM backup.tenant_migration_20261118_defaults) <> 2
     OR (SELECT count(*) FROM backup.tenant_migration_20261118_constraints) <> 1 THEN
    RAISE EXCEPTION 'Abort: backup tables are incomplete';
  END IF;

  -- The constraint must still be the one the migration created; anything
  -- else means it was changed by hand and needs a manual decision.
  IF (SELECT count(*) FROM pg_constraint
      WHERE conrelid = 'public.current_accounts'::regclass
        AND conname = 'current_accounts_tenant_check'
        AND pg_get_constraintdef(oid) = 'CHECK ((tenant_id = app_tenant_id()))') <> 1 THEN
    RAISE EXCEPTION 'Abort: current_accounts_tenant_check is not the version the migration created';
  END IF;

  -- The 28 wrapped policies must still be exactly what the migration made
  -- (same check as the migration's step 8); a hand-edited policy needs a
  -- manual decision, not an overwrite.
  IF (SELECT count(*)
        FROM backup.tenant_migration_20261118_wrapped_policies b
        JOIN pg_policies p ON p.schemaname = b.schemaname AND p.tablename = b.tablename AND p.policyname = b.policyname
       WHERE p.permissive = b.permissive AND p.roles = b.roles AND p.cmd = b.cmd
         AND p.qual IS NOT DISTINCT FROM CASE WHEN b.qual IS NOT NULL THEN '(tenant_id = ( SELECT app_tenant_id() AS app_tenant_id))' END
         AND p.with_check IS NOT DISTINCT FROM CASE WHEN b.with_check IS NOT NULL THEN '(tenant_id = ( SELECT app_tenant_id() AS app_tenant_id))' END) <> 28
     OR (SELECT count(*) FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename IN ('current_accounts', 'current_account_movements', 'invoices', 'invoice_items',
                              'products', 'transactions', 'collection_invoice_matches')) <> 28 THEN
    RAISE EXCEPTION 'Abort: the 28 wrapped policies are not the version the migration created';
  END IF;

  IF to_regprocedure('public.normalize_tenant_id()') IS NULL THEN
    RAISE EXCEPTION 'Abort: the migration does not look applied (normalize_tenant_id() missing)';
  END IF;
END $$;

-- Row counts at the start (R9 proves nothing disappeared).
CREATE TEMP TABLE rb_counts_before ON COMMIT DROP AS
          SELECT 'categories'::text AS table_name, count(*) AS n FROM public.categories
UNION ALL SELECT 'invoices', count(*) FROM public.invoices
UNION ALL SELECT 'warehouses', count(*) FROM public.warehouses
UNION ALL SELECT 'stock_movements', count(*) FROM public.stock_movements
UNION ALL SELECT 'current_accounts', count(*) FROM public.current_accounts
UNION ALL SELECT 'current_account_movements', count(*) FROM public.current_account_movements
UNION ALL SELECT 'collection_invoice_matches', count(*) FROM public.collection_invoice_matches
UNION ALL SELECT 'transactions', count(*) FROM public.transactions
UNION ALL SELECT 'products', count(*) FROM public.products
UNION ALL SELECT 'invoice_items', count(*) FROM public.invoice_items
UNION ALL SELECT 'safes', count(*) FROM public.safes
UNION ALL SELECT 'banks', count(*) FROM public.banks
UNION ALL SELECT 'cheques', count(*) FROM public.cheques;

-- Report tables (kept after COMMIT).
CREATE TABLE backup.tenant_rollback_20261118_rows (
  table_name text NOT NULL,
  row_id uuid NOT NULL,
  tenant_before_rollback uuid,   -- NULL when the row no longer exists
  tenant_after_rollback uuid,
  action text NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE backup.tenant_rollback_20261118_users (
  user_id uuid NOT NULL,
  action text NOT NULL,
  app_tenant_before_rollback text,
  app_tenant_after_rollback text,
  user_meta_tenant_before_rollback text,
  user_meta_tenant_after_rollback text,
  logged_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE backup.tenant_rollback_20261118_summary (
  scope text NOT NULL,
  action text NOT NULL,
  row_count bigint NOT NULL
);

-- ---------------------------------------------------------------------------
-- Per-table rule for rows created AFTER the migration (all 13 tables).
--
-- 'user_id'    -> the previous build reads the table only through RLS, and the
--                 previous app_tenant_id() is auth.uid(): such rows move to the
--                 creator's user id, otherwise they would become invisible.
-- 'company_id' -> the previous build reads the table with the company id
--                 (service-role fallback that only runs when the RLS read
--                 returns nothing): such rows keep the company id. Moving them
--                 to the user id would make the RLS read non-empty and hide
--                 every pre-existing company-id row.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE rb_table_rules (
  table_name text PRIMARY KEY,
  new_row_target text NOT NULL CHECK (new_row_target IN ('user_id', 'company_id'))
) ON COMMIT DROP;
INSERT INTO rb_table_rules VALUES
  ('current_accounts',           'user_id'),
  ('current_account_movements',  'user_id'),
  ('collection_invoice_matches', 'user_id'),
  ('safes',                      'user_id'),
  ('banks',                      'user_id'),
  ('cheques',                    'user_id'),
  ('transactions',               'user_id'),
  ('categories',                 'user_id'),
  ('warehouses',                 'user_id'),
  ('invoices',                   'company_id'),
  ('invoice_items',              'company_id'),
  ('products',                   'company_id'),
  ('stock_movements',            'company_id');

DO $$
BEGIN
  IF (SELECT count(*) FROM rb_table_rules) <> (SELECT count(*) FROM rb_counts_before)
     OR EXISTS (SELECT table_name FROM rb_counts_before EXCEPT SELECT table_name FROM rb_table_rules) THEN
    RAISE EXCEPTION 'Abort: table rules do not cover exactly the 13 tables';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- R1) Live company -> user map from trusted app_metadata (before R8 edits it).
--     Includes users who signed up after the migration.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE rb_map ON COMMIT DROP AS
SELECT id AS user_id, (raw_app_meta_data ->> 'tenant_id')::uuid AS tenant_id
FROM auth.users
WHERE raw_app_meta_data ->> 'tenant_id'
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

DO $$
BEGIN
  -- The previous model has one user per company.
  IF (SELECT count(*) FROM rb_map) <> (SELECT count(DISTINCT tenant_id) FROM rb_map) THEN
    RAISE EXCEPTION 'Abort: a company id is shared by several users; resolve manually first';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- R2) Rows the migration moved. Each one ends in exactly one of:
--     moved_row_reverted, moved_row_skipped_changed, moved_row_missing_deleted
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT DISTINCT table_name FROM backup.tenant_migration_20261118_rows LOOP
    -- deleted after the migration: nothing to revert, report it
    EXECUTE format(
      'INSERT INTO backup.tenant_rollback_20261118_rows (table_name, row_id, tenant_before_rollback, tenant_after_rollback, action)
       SELECT %L, b.row_id, NULL::uuid, NULL::uuid, %L
       FROM backup.tenant_migration_20261118_rows b
       WHERE b.table_name = %L
         AND NOT EXISTS (SELECT 1 FROM public.%I r WHERE r.id = b.row_id)',
      t, 'moved_row_missing_deleted', t, t);

    -- tenant changed after the migration: never overwrite, report it
    EXECUTE format(
      'INSERT INTO backup.tenant_rollback_20261118_rows (table_name, row_id, tenant_before_rollback, tenant_after_rollback, action)
       SELECT %L, r.id, r.tenant_id, r.tenant_id, %L
       FROM public.%I r
       JOIN backup.tenant_migration_20261118_rows b ON b.table_name = %L AND b.row_id = r.id
       WHERE r.tenant_id IS DISTINCT FROM b.new_tenant_id',
      t, 'moved_row_skipped_changed', t, t);

    -- untouched since the migration: revert to the user id
    EXECUTE format(
      'WITH reverted AS (
         UPDATE public.%I r
         SET tenant_id = b.old_tenant_id
         FROM backup.tenant_migration_20261118_rows b
         WHERE b.table_name = %L AND r.id = b.row_id AND r.tenant_id = b.new_tenant_id
         RETURNING r.id, b.new_tenant_id AS before_id, b.old_tenant_id AS after_id
       )
       INSERT INTO backup.tenant_rollback_20261118_rows (table_name, row_id, tenant_before_rollback, tenant_after_rollback, action)
       SELECT %L, id, before_id, after_id, %L FROM reverted',
      t, t, t, 'moved_row_reverted');
  END LOOP;

  RAISE NOTICE 'R2: % reverted, % skipped (tenant changed after migration), % missing (deleted after migration)',
    (SELECT count(*) FROM backup.tenant_rollback_20261118_rows WHERE action = 'moved_row_reverted'),
    (SELECT count(*) FROM backup.tenant_rollback_20261118_rows WHERE action = 'moved_row_skipped_changed'),
    (SELECT count(*) FROM backup.tenant_rollback_20261118_rows WHERE action = 'moved_row_missing_deleted');
END $$;

-- ---------------------------------------------------------------------------
-- R3) Rows created after the migration (absent from the snapshot), all 13
--     tables. Each one ends in exactly one of:
--       post_migration_rehomed_to_user_id  (rule user_id, tenant = a company)
--       post_migration_kept_company_id     (rule company_id, tenant = a company)
--       post_migration_kept_user_id        (tenant already a user id)
--       post_migration_kept_unmapped       (tenant matches no user/company)
--     Rows that existed before the migration but were not moved by it and
--     whose tenant changed later are reported as preexisting_changed_kept.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rule record;
BEGIN
  FOR rule IN SELECT * FROM rb_table_rules LOOP
    IF rule.new_row_target = 'user_id' THEN
      EXECUTE format(
        'WITH rehomed AS (
           UPDATE public.%I r
           SET tenant_id = m.user_id
           FROM rb_map m
           WHERE r.tenant_id = m.tenant_id
             AND NOT EXISTS (SELECT 1 FROM backup.tenant_migration_20261118_snapshot s
                             WHERE s.table_name = %L AND s.row_id = r.id)
           RETURNING r.id, m.tenant_id AS before_id, m.user_id AS after_id
         )
         INSERT INTO backup.tenant_rollback_20261118_rows (table_name, row_id, tenant_before_rollback, tenant_after_rollback, action)
         SELECT %L, id, before_id, after_id, %L FROM rehomed',
        rule.table_name, rule.table_name, rule.table_name, 'post_migration_rehomed_to_user_id');
    ELSE
      EXECUTE format(
        'INSERT INTO backup.tenant_rollback_20261118_rows (table_name, row_id, tenant_before_rollback, tenant_after_rollback, action)
         SELECT %L, r.id, r.tenant_id, r.tenant_id, %L
         FROM public.%I r
         JOIN rb_map m ON m.tenant_id = r.tenant_id
         WHERE NOT EXISTS (SELECT 1 FROM backup.tenant_migration_20261118_snapshot s
                           WHERE s.table_name = %L AND s.row_id = r.id)',
        rule.table_name, 'post_migration_kept_company_id', rule.table_name, rule.table_name);
    END IF;

    -- every other post-migration row in this table
    EXECUTE format(
      'INSERT INTO backup.tenant_rollback_20261118_rows (table_name, row_id, tenant_before_rollback, tenant_after_rollback, action)
       SELECT %L, r.id, r.tenant_id, r.tenant_id,
              CASE WHEN EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.tenant_id)
                   THEN %L ELSE %L END
       FROM public.%I r
       WHERE NOT EXISTS (SELECT 1 FROM backup.tenant_migration_20261118_snapshot s
                         WHERE s.table_name = %L AND s.row_id = r.id)
         AND NOT EXISTS (SELECT 1 FROM backup.tenant_rollback_20261118_rows l
                         WHERE l.table_name = %L AND l.row_id = r.id)',
      rule.table_name, 'post_migration_kept_user_id', 'post_migration_kept_unmapped',
      rule.table_name, rule.table_name, rule.table_name);

    -- pre-existing rows not moved by the migration but changed since (info)
    EXECUTE format(
      'INSERT INTO backup.tenant_rollback_20261118_rows (table_name, row_id, tenant_before_rollback, tenant_after_rollback, action)
       SELECT %L, r.id, r.tenant_id, r.tenant_id, %L
       FROM public.%I r
       JOIN backup.tenant_migration_20261118_snapshot s ON s.table_name = %L AND s.row_id = r.id
       WHERE r.tenant_id IS DISTINCT FROM s.tenant_id
         AND NOT EXISTS (SELECT 1 FROM backup.tenant_migration_20261118_rows b
                         WHERE b.table_name = %L AND b.row_id = r.id)',
      rule.table_name, 'preexisting_changed_kept', rule.table_name, rule.table_name, rule.table_name);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- R4) Remove what the migration added
-- ---------------------------------------------------------------------------
DROP TRIGGER trg_normalize_tenant_id ON public.current_accounts;
DROP TRIGGER trg_normalize_tenant_id ON public.banks;
DROP TRIGGER trg_normalize_tenant_id ON public.cheques;
DROP TRIGGER trg_normalize_tenant_id ON public.warehouses;
DROP FUNCTION public.normalize_tenant_id();

DROP POLICY IF EXISTS stock_movements_tenant_select ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_tenant_insert ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_tenant_update ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_tenant_delete ON public.stock_movements;
DROP POLICY IF EXISTS categories_tenant_select ON public.categories;
DROP POLICY IF EXISTS categories_tenant_insert ON public.categories;
DROP POLICY IF EXISTS categories_tenant_update ON public.categories;
DROP POLICY IF EXISTS categories_tenant_delete ON public.categories;
DROP POLICY IF EXISTS warehouses_tenant_select ON public.warehouses;
DROP POLICY IF EXISTS warehouses_tenant_insert ON public.warehouses;
DROP POLICY IF EXISTS warehouses_tenant_update ON public.warehouses;
DROP POLICY IF EXISTS warehouses_tenant_delete ON public.warehouses;

-- ---------------------------------------------------------------------------
-- R5) Recreate the 20 original policies from the backup
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  p record;
  role_list text;
BEGIN
  FOR p IN SELECT * FROM backup.tenant_migration_20261118_policies LOOP
    SELECT string_agg(CASE WHEN r::text = 'public' THEN 'PUBLIC' ELSE quote_ident(r::text) END, ', ')
    INTO role_list
    FROM unnest(p.roles) AS r;

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s',
      p.policyname, p.schemaname, p.tablename,
      p.permissive, p.cmd, role_list,
      CASE WHEN p.qual IS NOT NULL THEN ' USING (' || p.qual || ')' ELSE '' END,
      CASE WHEN p.with_check IS NOT NULL THEN ' WITH CHECK (' || p.with_check || ')' ELSE '' END
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- R5b) Put the backed-up USING / WITH CHECK text back on the 28 wrapped
--      policies. ALTER POLICY keeps name, command, roles and PERMISSIVE; only
--      the expressions that existed before are set (R9.5b compares all of it).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN SELECT * FROM backup.tenant_migration_20261118_wrapped_policies ORDER BY tablename, policyname LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I%s%s',
      p.policyname, p.schemaname, p.tablename,
      CASE WHEN p.qual IS NOT NULL THEN ' USING (' || p.qual || ')' ELSE '' END,
      CASE WHEN p.with_check IS NOT NULL THEN ' WITH CHECK (' || p.with_check || ')' ELSE '' END);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- R6) Restore the 5 rewritten function bodies, then the exact ACL of all 7.
--     CREATE OR REPLACE keeps the current owner and ACL, so the ACL is reset
--     afterwards: every current non-owner grant is revoked and the backed-up
--     grants are re-issued (grantee, privilege, grant option).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  f record;
  g record;
  fn regprocedure;
BEGIN
  FOR f IN SELECT * FROM backup.tenant_migration_20261118_functions WHERE replaced LOOP
    EXECUTE f.definition;  -- pg_get_functiondef output: a full CREATE OR REPLACE
  END LOOP;

  FOR f IN SELECT * FROM backup.tenant_migration_20261118_functions LOOP
    fn := to_regprocedure(f.signature);
    IF fn IS NULL THEN
      RAISE EXCEPTION 'Abort: function % not found', f.signature;
    END IF;

    FOR g IN
      SELECT DISTINCT a.grantee
      FROM pg_proc p, aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
      WHERE p.oid = fn AND a.grantee <> p.proowner
    LOOP
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %s', fn,
        CASE WHEN g.grantee = 0 THEN 'PUBLIC' ELSE g.grantee::regrole::text END);
    END LOOP;

    FOR g IN
      SELECT a.grantee, a.is_grantable
      FROM aclexplode(COALESCE(f.acl, acldefault('f', f.owner_oid))) a
      WHERE a.grantee <> f.owner_oid AND a.privilege_type = 'EXECUTE'
    LOOP
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO %s%s', fn,
        CASE WHEN g.grantee = 0 THEN 'PUBLIC' ELSE g.grantee::regrole::text END,
        CASE WHEN g.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END);
    END LOOP;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- R7) Restore the 2 column defaults
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  d record;
BEGIN
  FOR d IN SELECT * FROM backup.tenant_migration_20261118_defaults LOOP
    IF d.default_expr IS NULL THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', d.table_name, d.column_name);
    ELSE
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT %s',
                     d.table_name, d.column_name, d.default_expr);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- R7b) Restore current_accounts_tenant_check from the backup.
--      Runs after R2/R3 so the rows are back at the user id; validation runs
--      here without a JWT (get_jwt_tenant() is NULL), as it did when the
--      constraint was first created. The backed-up definition already holds
--      NO INHERIT / NOT VALID when they applied.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN SELECT * FROM backup.tenant_migration_20261118_constraints LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', c.table_name, c.constraint_name);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', c.table_name, c.constraint_name, c.definition);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- R8) User metadata. Only the tenant_id key is touched; every other key
--     (provider, providers, name, ...) keeps its current value.
--
--   A. user existed before the migration and app_metadata.tenant_id existed
--      then  -> app_metadata.tenant_id := the backed-up value
--   B. user existed before the migration, no app_metadata.tenant_id then
--      -> app_metadata.tenant_id removed
--   A+B: user_metadata.tenant_id := the backed-up value (removed if it had
--      none), because the previous build trusts it
--   C. user created after the migration -> app_metadata.tenant_id removed
--      when it equals user_metadata.tenant_id (that is what the previous
--      handle_new_user produced); otherwise kept and reported as a conflict,
--      because app_metadata is the trusted copy
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE rb_user_plan ON COMMIT DROP AS
SELECT u.id AS user_id,
       (b.user_id IS NOT NULL) AS existed_before,
       COALESCE(b.raw_app_meta_data ? 'tenant_id', false) AS had_app_tenant_before,
       b.raw_app_meta_data ->> 'tenant_id' AS app_tenant_backup,
       b.user_meta_tenant_id AS user_meta_tenant_backup,
       u.raw_app_meta_data ->> 'tenant_id' AS app_tenant_now,
       u.raw_user_meta_data ->> 'tenant_id' AS user_meta_tenant_now
FROM auth.users u
LEFT JOIN backup.tenant_migration_20261118_users b ON b.user_id = u.id;

-- A
UPDATE auth.users u
SET raw_app_meta_data = jsonb_set(COALESCE(u.raw_app_meta_data, '{}'::jsonb),
                                  '{tenant_id}', to_jsonb(p.app_tenant_backup))
FROM rb_user_plan p
WHERE u.id = p.user_id AND p.existed_before AND p.had_app_tenant_before;

-- B
UPDATE auth.users u
SET raw_app_meta_data = u.raw_app_meta_data - 'tenant_id'
FROM rb_user_plan p
WHERE u.id = p.user_id AND p.existed_before AND NOT p.had_app_tenant_before;

-- A+B: user_metadata.tenant_id back to its backed-up value
UPDATE auth.users u
SET raw_user_meta_data = CASE
      WHEN p.user_meta_tenant_backup IS NULL THEN COALESCE(u.raw_user_meta_data, '{}'::jsonb) - 'tenant_id'
      ELSE jsonb_set(COALESCE(u.raw_user_meta_data, '{}'::jsonb), '{tenant_id}', to_jsonb(p.user_meta_tenant_backup))
    END
FROM rb_user_plan p
WHERE u.id = p.user_id AND p.existed_before
  AND p.user_meta_tenant_now IS DISTINCT FROM p.user_meta_tenant_backup;

-- C
UPDATE auth.users u
SET raw_app_meta_data = u.raw_app_meta_data - 'tenant_id'
FROM rb_user_plan p
WHERE u.id = p.user_id AND NOT p.existed_before
  AND p.app_tenant_now IS NOT NULL
  AND p.app_tenant_now = p.user_meta_tenant_now;

INSERT INTO backup.tenant_rollback_20261118_users
  (user_id, action, app_tenant_before_rollback, app_tenant_after_rollback,
   user_meta_tenant_before_rollback, user_meta_tenant_after_rollback)
SELECT p.user_id,
       CASE
         WHEN p.existed_before AND p.had_app_tenant_before THEN 'A_app_tenant_restored_to_preexisting'
         WHEN p.existed_before THEN 'B_app_tenant_removed'
         WHEN p.app_tenant_now IS NULL THEN 'C_new_user_no_app_tenant'
         WHEN p.app_tenant_now = p.user_meta_tenant_now THEN 'C_new_user_app_tenant_removed'
         ELSE 'C_new_user_conflict_app_tenant_kept'
       END
       || CASE WHEN p.existed_before AND p.user_meta_tenant_now IS DISTINCT FROM p.user_meta_tenant_backup
               THEN '+user_meta_tenant_restored' ELSE '' END,
       p.app_tenant_now,
       u.raw_app_meta_data ->> 'tenant_id',
       p.user_meta_tenant_now,
       u.raw_user_meta_data ->> 'tenant_id'
FROM rb_user_plan p
JOIN auth.users u ON u.id = p.user_id;

-- ---------------------------------------------------------------------------
-- R9) Self-checks: abort everything if any guarantee does not hold
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  n_now bigint;
  n_post bigint;
  n_logged bigint;
  diff bigint;
  f record;
BEGIN
  -- 1. No row lost
  FOR t IN SELECT table_name FROM rb_counts_before LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n_now;
    IF n_now <> (SELECT n FROM rb_counts_before WHERE table_name = t) THEN
      RAISE EXCEPTION 'Check failed: row count of % changed during rollback', t;
    END IF;
  END LOOP;

  -- 2. Every moved row has exactly one R2 outcome, and none is left at its
  --    migration value
  IF EXISTS (
    SELECT 1 FROM backup.tenant_migration_20261118_rows b
    WHERE (SELECT count(*) FROM backup.tenant_rollback_20261118_rows l
           WHERE l.table_name = b.table_name AND l.row_id = b.row_id
             AND l.action LIKE 'moved_row_%') <> 1
  ) THEN
    RAISE EXCEPTION 'Check failed: a moved row does not have exactly one R2 outcome';
  END IF;
  FOR t IN SELECT DISTINCT table_name FROM backup.tenant_migration_20261118_rows LOOP
    EXECUTE format(
      'SELECT count(*) FROM public.%I r JOIN backup.tenant_migration_20261118_rows b
         ON b.table_name = %L AND b.row_id = r.id AND r.tenant_id = b.new_tenant_id', t, t)
    INTO n_now;
    IF n_now > 0 THEN
      RAISE EXCEPTION 'Check failed: % still has % moved rows at the migration tenant id', t, n_now;
    END IF;
  END LOOP;

  -- 3. Every post-migration row is accounted for exactly once, and none in a
  --    user_id-rule table is left at a company id
  FOR t IN SELECT table_name FROM rb_table_rules LOOP
    EXECUTE format(
      'SELECT count(*) FROM public.%I r
       WHERE NOT EXISTS (SELECT 1 FROM backup.tenant_migration_20261118_snapshot s
                         WHERE s.table_name = %L AND s.row_id = r.id)', t, t)
    INTO n_post;
    SELECT count(*), count(*) - count(DISTINCT row_id) INTO n_logged, diff
    FROM backup.tenant_rollback_20261118_rows
    WHERE table_name = t AND action LIKE 'post_migration_%';
    IF n_post <> n_logged OR diff <> 0 THEN
      RAISE EXCEPTION 'Check failed: % has % post-migration rows but % report entries', t, n_post, n_logged;
    END IF;
  END LOOP;
  FOR t IN SELECT table_name FROM rb_table_rules WHERE new_row_target = 'user_id' LOOP
    EXECUTE format(
      'SELECT count(*) FROM public.%I r JOIN rb_map m ON m.tenant_id = r.tenant_id
       WHERE NOT EXISTS (SELECT 1 FROM backup.tenant_migration_20261118_snapshot s
                         WHERE s.table_name = %L AND s.row_id = r.id)', t, t)
    INTO n_now;
    IF n_now > 0 THEN
      RAISE EXCEPTION 'Check failed: % post-migration rows in % left at a company id', n_now, t;
    END IF;
  END LOOP;

  -- 4. Functions: every catalog attribute and the effective ACL match
  FOR f IN SELECT * FROM backup.tenant_migration_20261118_functions LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang
      WHERE p.oid = to_regprocedure(f.signature)
        AND p.prosrc = f.body
        AND p.proowner = f.owner_oid
        AND p.prosecdef = f.security_definer
        AND p.proconfig IS NOT DISTINCT FROM f.config
        AND p.provolatile::text = f.volatility
        AND p.proisstrict = f.is_strict
        AND p.proleakproof = f.is_leakproof
        AND p.proparallel::text = f.parallel
        AND l.lanname = f.language
        AND p.prorettype::regtype::text = f.return_type
        AND pg_get_function_arguments(p.oid) = f.arguments
    ) THEN
      RAISE EXCEPTION 'Check failed: function % attributes differ from the backup', f.signature;
    END IF;

    SELECT count(*) INTO diff FROM (
      (SELECT a.grantee, a.privilege_type, a.is_grantable
         FROM pg_proc p, aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
        WHERE p.oid = to_regprocedure(f.signature) AND a.grantee <> p.proowner
       EXCEPT
       SELECT a.grantee, a.privilege_type, a.is_grantable
         FROM aclexplode(COALESCE(f.acl, acldefault('f', f.owner_oid))) a
        WHERE a.grantee <> f.owner_oid)
      UNION ALL
      (SELECT a.grantee, a.privilege_type, a.is_grantable
         FROM aclexplode(COALESCE(f.acl, acldefault('f', f.owner_oid))) a
        WHERE a.grantee <> f.owner_oid
       EXCEPT
       SELECT a.grantee, a.privilege_type, a.is_grantable
         FROM pg_proc p, aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
        WHERE p.oid = to_regprocedure(f.signature) AND a.grantee <> p.proowner)
    ) x;
    IF diff > 0 THEN
      RAISE EXCEPTION 'Check failed: ACL of % differs from the backup', f.signature;
    END IF;

    IF pg_get_functiondef(to_regprocedure(f.signature)) IS DISTINCT FROM f.definition THEN
      -- Catalog attributes above are authoritative; this only flags a
      -- cosmetic difference in the generated text.
      RAISE NOTICE 'Note: generated definition text of % differs cosmetically', f.signature;
    END IF;
  END LOOP;

  -- 5. Policies: the set on the 3 tables equals the backup exactly
  --    (name, permissive, roles, command, USING, WITH CHECK)
  SELECT count(*) INTO diff FROM (
    (SELECT tablename, policyname, permissive,
            (SELECT array_agg(r::text ORDER BY r::text) FROM unnest(roles) r) AS roles,
            cmd, qual, with_check
       FROM pg_policies
      WHERE schemaname = 'public' AND tablename IN ('stock_movements', 'categories', 'warehouses')
     EXCEPT
     SELECT tablename, policyname, permissive,
            (SELECT array_agg(r::text ORDER BY r::text) FROM unnest(roles) r),
            cmd, qual, with_check
       FROM backup.tenant_migration_20261118_policies)
    UNION ALL
    (SELECT tablename, policyname, permissive,
            (SELECT array_agg(r::text ORDER BY r::text) FROM unnest(roles) r),
            cmd, qual, with_check
       FROM backup.tenant_migration_20261118_policies
     EXCEPT
     SELECT tablename, policyname, permissive,
            (SELECT array_agg(r::text ORDER BY r::text) FROM unnest(roles) r),
            cmd, qual, with_check
       FROM pg_policies
      WHERE schemaname = 'public' AND tablename IN ('stock_movements', 'categories', 'warehouses'))
  ) x;
  IF diff > 0 THEN
    RAISE EXCEPTION 'Check failed: % policy differences against the backup', diff;
  END IF;

  -- 5b. The 7 tables with wrapped policies: the whole policy set equals the
  --     backup exactly (name, permissive, roles, command, USING, WITH CHECK)
  SELECT count(*) INTO diff FROM (
    (SELECT tablename, policyname, permissive,
            (SELECT array_agg(r::text ORDER BY r::text) FROM unnest(roles) r) AS roles,
            cmd, qual, with_check
       FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('current_accounts', 'current_account_movements', 'invoices', 'invoice_items',
                          'products', 'transactions', 'collection_invoice_matches')
     EXCEPT
     SELECT tablename, policyname, permissive,
            (SELECT array_agg(r::text ORDER BY r::text) FROM unnest(roles) r),
            cmd, qual, with_check
       FROM backup.tenant_migration_20261118_wrapped_policies)
    UNION ALL
    (SELECT tablename, policyname, permissive,
            (SELECT array_agg(r::text ORDER BY r::text) FROM unnest(roles) r),
            cmd, qual, with_check
       FROM backup.tenant_migration_20261118_wrapped_policies
     EXCEPT
     SELECT tablename, policyname, permissive,
            (SELECT array_agg(r::text ORDER BY r::text) FROM unnest(roles) r),
            cmd, qual, with_check
       FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('current_accounts', 'current_account_movements', 'invoices', 'invoice_items',
                          'products', 'transactions', 'collection_invoice_matches'))
  ) x;
  IF diff > 0 THEN
    RAISE EXCEPTION 'Check failed: % differences on the 28 wrapped policies against the backup', diff;
  END IF;

  -- 6. Defaults
  IF EXISTS (
    SELECT 1
    FROM backup.tenant_migration_20261118_defaults d
    JOIN pg_class c ON c.relname = d.table_name AND c.relnamespace = 'public'::regnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = d.column_name
    LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
    WHERE pg_get_expr(ad.adbin, ad.adrelid) IS DISTINCT FROM d.default_expr
  ) THEN
    RAISE EXCEPTION 'Check failed: a column default differs from the backup';
  END IF;

  -- 6b. Constraint: definition, validated and no-inherit exactly as backed up
  IF EXISTS (
    SELECT 1
    FROM backup.tenant_migration_20261118_constraints b
    WHERE (SELECT count(*)
             FROM pg_constraint con
             JOIN pg_class cl ON cl.oid = con.conrelid AND cl.relnamespace = 'public'::regnamespace
            WHERE cl.relname = b.table_name AND con.conname = b.constraint_name
              AND pg_get_constraintdef(con.oid) = b.definition
              AND con.convalidated = b.validated
              AND con.connoinherit = b.no_inherit) <> 1
  ) THEN
    RAISE EXCEPTION 'Check failed: current_accounts_tenant_check differs from the backup';
  END IF;

  -- 7. What the migration added is gone
  IF to_regprocedure('public.normalize_tenant_id()') IS NOT NULL
     OR EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_normalize_tenant_id') THEN
    RAISE EXCEPTION 'Check failed: normalize trigger or function still present';
  END IF;

  -- 8. Users that existed before the migration have their pre-migration
  --    tenant_id values back
  IF EXISTS (
    SELECT 1
    FROM backup.tenant_migration_20261118_users b
    JOIN auth.users u ON u.id = b.user_id
    WHERE (COALESCE(b.raw_app_meta_data, '{}'::jsonb) ? 'tenant_id')
            IS DISTINCT FROM (COALESCE(u.raw_app_meta_data, '{}'::jsonb) ? 'tenant_id')
       OR (b.raw_app_meta_data ->> 'tenant_id') IS DISTINCT FROM (u.raw_app_meta_data ->> 'tenant_id')
       OR b.user_meta_tenant_id IS DISTINCT FROM (u.raw_user_meta_data ->> 'tenant_id')
  ) THEN
    RAISE EXCEPTION 'Check failed: a pre-existing user does not have the pre-migration tenant_id values';
  END IF;

  -- Summary (also stored in backup.tenant_rollback_20261118_summary)
  INSERT INTO backup.tenant_rollback_20261118_summary (scope, action, row_count)
  SELECT table_name, action, count(*) FROM backup.tenant_rollback_20261118_rows GROUP BY 1, 2
  UNION ALL
  SELECT 'auth.users', action, count(*) FROM backup.tenant_rollback_20261118_users GROUP BY 1, 2;

  FOR f IN SELECT * FROM backup.tenant_rollback_20261118_summary ORDER BY scope, action LOOP
    RAISE NOTICE '% / %: %', f.scope, f.action, f.row_count;
  END LOOP;
END $$;

COMMIT;
