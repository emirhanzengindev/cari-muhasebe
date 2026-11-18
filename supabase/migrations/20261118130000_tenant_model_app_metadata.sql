-- Tenant model fix (2026-11-18)
--
-- Problem: handle_new_user() creates a company row in public.tenants and writes
-- its id to raw_user_meta_data.tenant_id. user_metadata is editable by the user
-- (supabase.auth.updateUser), so the API trusted a value the user controls.
-- RLS meanwhile resolved the tenant as auth.uid(), so invoices, invoice items,
-- products and stock movements (stored under the company id) were invisible to
-- RLS and the API read them with the service role.
--
-- Fix: the company id becomes the single tenant id and lives in
-- raw_app_meta_data (server-controlled). Rows stored under the user id move to
-- the company id. app_tenant_id() resolves the company id, and the policies,
-- defaults, triggers, the current_accounts CHECK constraint and the
-- account-movement RPCs use it.
--
-- Out of scope on purpose: stock logic. apply_stock_movement(),
-- update_product_stock() and trg_update_product_stock are not touched.
--
-- Safety: before any change this script copies to the non-exposed "backup"
-- schema: user metadata, a snapshot of every row's tenant id, the 7 affected
-- functions (full catalog attributes and ACL), the 20 replaced policies, the
-- 28 policies whose app_tenant_id() call is wrapped, the 2 column defaults and
-- the current_accounts_tenant_check constraint. Row
-- counts are compared at the end and any failed check
-- aborts the whole transaction. Rollback script:
-- supabase/rollbacks/20261118130000_tenant_model_app_metadata.down.sql

BEGIN;

-- Pre-flight, before any setting, lock or change: run as postgres with no API
-- identity. With SQL Editor role impersonation (or any JWT claims set) the
-- tenant functions would resolve a user's tenant, the new CHECK validation
-- would fail for every other tenant's rows and the backups would describe a
-- user's view instead of the database. Abort instead.
--   session_user: the role that logged in (psql / supabase db push / SQL
--                 Editor connect as postgres; a pooler user
--                 postgres.<project ref> is postgres in the database)
--   current_user: the effective role (SET ROLE or impersonation changes it)
DO $$
BEGIN
  IF session_user <> 'postgres' OR current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Abort: run as postgres (session_user is %, current_user is %)', session_user, current_user;
  END IF;
  IF auth.uid() IS NOT NULL OR auth.jwt() IS NOT NULL THEN
    RAISE EXCEPTION 'Abort: JWT claims are set in this session (role impersonation?). Run as postgres without impersonation.';
  END IF;
  -- Second run: stop before taking any lock (the backups below would collide).
  IF to_regclass('backup.tenant_migration_20261118_users') IS NOT NULL THEN
    RAISE EXCEPTION 'Abort: migration already ran (backup.tenant_migration_20261118_users exists)';
  END IF;
END $$;

-- Fixed search_path: regprocedure text, pg_get_expr() and pg_policies output
-- are deparsed against it, and the rollback uses the same value, so the
-- backed-up text and the restored text are produced the same way.
SET LOCAL search_path = public, pg_catalog;
-- Give up instead of waiting if another session holds a conflicting lock.
SET LOCAL lock_timeout = '5s';

-- Locks are taken up front, at the strongest level each table needs, so the
-- transaction never has to upgrade a lock mid-way (an upgrade can deadlock
-- with a concurrent reader).
-- ACCESS EXCLUSIVE: tables that get policy, default, constraint or trigger
-- DDL below (CREATE/DROP/ALTER POLICY, ALTER COLUMN ... SET DEFAULT and
-- DROP/ADD CONSTRAINT need it). Reads wait too, for the length of this
-- transaction.
LOCK TABLE
  public.stock_movements, public.categories, public.warehouses,
  public.current_accounts, public.banks, public.cheques,
  public.invoices, public.current_account_movements,
  public.collection_invoice_matches, public.transactions, public.products,
  public.invoice_items
IN ACCESS EXCLUSIVE MODE;
-- SHARE ROW EXCLUSIVE: safes only gets rows moved. Reads stay allowed;
-- writes wait until COMMIT, so no row can be inserted under the old tenant id
-- while rows are being moved.
LOCK TABLE public.safes IN SHARE ROW EXCLUSIVE MODE;

-- Row counts before any change (compared in step 8: nothing may disappear).
CREATE TEMP TABLE row_counts_before ON COMMIT DROP AS
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

-- ---------------------------------------------------------------------------
-- 0) Backups (schema "backup" is not exposed through the Data API)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS backup;
REVOKE ALL ON SCHEMA backup FROM PUBLIC, anon, authenticated;

-- 0a) Users: full raw_app_meta_data and the user_metadata tenant id.
CREATE TABLE backup.tenant_migration_20261118_users AS
SELECT id AS user_id,
       raw_app_meta_data,
       raw_user_meta_data ->> 'tenant_id' AS user_meta_tenant_id,
       now() AS backed_up_at
FROM auth.users;

-- 0b) Functions this migration replaces (5) or only re-grants (2).
--     Every catalog attribute the rollback must restore, plus the raw ACL.
CREATE TABLE backup.tenant_migration_20261118_functions AS
SELECT p.oid::regprocedure::text AS signature,
       pg_get_functiondef(p.oid) AS definition,
       p.prosrc AS body,
       p.proowner AS owner_oid,
       p.proowner::regrole::text AS owner_name,
       p.prosecdef AS security_definer,
       p.proconfig AS config,
       p.provolatile::text AS volatility,
       p.proisstrict AS is_strict,
       p.proleakproof AS is_leakproof,
       p.proparallel::text AS parallel,
       l.lanname AS language,
       p.prorettype::regtype::text AS return_type,
       pg_get_function_arguments(p.oid) AS arguments,
       p.proacl AS acl,
       true AS replaced
FROM pg_proc p
JOIN pg_language l ON l.oid = p.prolang
WHERE p.oid IN (
  'public.app_tenant_id()'::regprocedure,
  'public.handle_new_user()'::regprocedure,
  'public.set_tenant_id_from_user()'::regprocedure,
  'public.record_current_account_movement(uuid, text, numeric, integer, text, text, date, text, uuid, jsonb)'::regprocedure,
  'public.delete_current_account_movement(uuid)'::regprocedure,
  'public.record_current_account_movement(uuid, uuid, text, numeric, integer, date, text, text, uuid, jsonb)'::regprocedure,
  'public.delete_current_account_movement(uuid, uuid)'::regprocedure
);
-- These two overloads are not rewritten; only their EXECUTE is revoked.
UPDATE backup.tenant_migration_20261118_functions
SET replaced = false
WHERE signature IN (
  'public.record_current_account_movement(uuid, uuid, text, numeric, integer, date, text, text, uuid, jsonb)'::regprocedure::text,
  'public.delete_current_account_movement(uuid, uuid)'::regprocedure::text
);

-- 0c) The 20 policies dropped in step 6, selected by name.
CREATE TABLE backup.tenant_migration_20261118_policies AS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename, policyname) IN (
    ('stock_movements', 'stock_movements_select'), ('stock_movements', 'stock_movements_insert'),
    ('stock_movements', 'stock_movements_update'), ('stock_movements', 'stock_movements_delete'),
    ('categories', 'categories_select'), ('categories', 'categories_select_own'),
    ('categories', 'categories_insert'), ('categories', 'categories_insert_own'),
    ('categories', 'categories_update'), ('categories', 'categories_update_own'),
    ('categories', 'categories_delete'), ('categories', 'categories_delete_own'),
    ('warehouses', 'warehouses_select'), ('warehouses', 'warehouses_select_own'),
    ('warehouses', 'warehouses_insert'), ('warehouses', 'warehouses_insert_own'),
    ('warehouses', 'warehouses_update'), ('warehouses', 'warehouses_update_own'),
    ('warehouses', 'warehouses_delete'), ('warehouses', 'warehouses_delete_own')
  );

-- 0c2) The 28 policies whose app_tenant_id() call step 6b wraps in a sub-select
--      (same predicate, evaluated once per statement instead of once per row).
--      Selected by name; the exact old text is what the rollback re-applies.
CREATE TABLE backup.tenant_migration_20261118_wrapped_policies AS
SELECT p.schemaname, p.tablename, p.policyname, p.permissive, p.roles, p.cmd, p.qual, p.with_check
FROM pg_policies p
CROSS JOIN unnest(ARRAY['select', 'insert', 'update', 'delete']) AS c(op)
WHERE p.schemaname = 'public'
  AND p.tablename IN ('current_accounts', 'current_account_movements', 'invoices', 'invoice_items',
                      'products', 'transactions', 'collection_invoice_matches')
  AND p.policyname = p.tablename || '_tenant_' || c.op;

-- 0d) Column defaults changed in step 5.
CREATE TABLE backup.tenant_migration_20261118_defaults AS
SELECT c.relname AS table_name,
       a.attname AS column_name,
       pg_get_expr(d.adbin, d.adrelid) AS default_expr
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE c.relname IN ('categories', 'current_accounts') AND a.attname = 'tenant_id';

-- 0d2) CHECK constraint replaced in step 5c. pg_get_constraintdef() already
--      carries NO INHERIT / NOT VALID when they apply, so "definition" alone
--      recreates the constraint exactly; the flags are kept for verification.
CREATE TABLE backup.tenant_migration_20261118_constraints AS
SELECT cl.relname::text AS table_name,
       con.conname::text AS constraint_name,
       pg_get_constraintdef(con.oid) AS definition,
       con.convalidated AS validated,
       con.connoinherit AS no_inherit
FROM pg_constraint con
JOIN pg_class cl ON cl.oid = con.conrelid
WHERE con.conrelid = 'public.current_accounts'::regclass
  AND con.conname = 'current_accounts_tenant_check';

-- 0e) Tenant id of every existing row. Lets the rollback tell rows that existed
--     before the migration from rows created after it.
CREATE TABLE backup.tenant_migration_20261118_snapshot AS
          SELECT 'categories'::text AS table_name, id AS row_id, tenant_id FROM public.categories
UNION ALL SELECT 'invoices', id, tenant_id FROM public.invoices
UNION ALL SELECT 'warehouses', id, tenant_id FROM public.warehouses
UNION ALL SELECT 'stock_movements', id, tenant_id FROM public.stock_movements
UNION ALL SELECT 'current_accounts', id, tenant_id FROM public.current_accounts
UNION ALL SELECT 'current_account_movements', id, tenant_id FROM public.current_account_movements
UNION ALL SELECT 'collection_invoice_matches', id, tenant_id FROM public.collection_invoice_matches
UNION ALL SELECT 'transactions', id, tenant_id FROM public.transactions
UNION ALL SELECT 'products', id, tenant_id FROM public.products
UNION ALL SELECT 'invoice_items', id, tenant_id FROM public.invoice_items
UNION ALL SELECT 'safes', id, tenant_id FROM public.safes
UNION ALL SELECT 'banks', id, tenant_id FROM public.banks
UNION ALL SELECT 'cheques', id, tenant_id FROM public.cheques;

-- 0f) Rows moved in step 2 (filled there).
CREATE TABLE backup.tenant_migration_20261118_rows (
  table_name text NOT NULL,
  row_id uuid NOT NULL,
  old_tenant_id uuid NOT NULL,
  new_tenant_id uuid NOT NULL
);

DO $$
BEGIN
  IF (SELECT count(*) FROM backup.tenant_migration_20261118_functions) <> 7
     OR (SELECT count(*) FROM backup.tenant_migration_20261118_functions WHERE replaced) <> 5 THEN
    RAISE EXCEPTION 'Abort: expected 7 functions (5 replaced) in backup';
  END IF;
  IF (SELECT count(*) FROM backup.tenant_migration_20261118_policies) <> 20 THEN
    RAISE EXCEPTION 'Abort: expected the 20 named policies, found %',
      (SELECT count(*) FROM backup.tenant_migration_20261118_policies);
  END IF;
  -- No other policy may exist on these tables, otherwise the rollback's exact
  -- policy comparison would not describe the whole pre-migration state.
  IF (SELECT count(*) FROM pg_policies
      WHERE schemaname = 'public' AND tablename IN ('stock_movements', 'categories', 'warehouses')) <> 20 THEN
    RAISE EXCEPTION 'Abort: unexpected extra policies on stock_movements/categories/warehouses';
  END IF;
  -- Wrapping is only applied to exactly the predicate analysed for it:
  -- 28 policies, no others on the 7 tables, every USING / WITH CHECK either
  -- absent or exactly (tenant_id = app_tenant_id()), in the shape of its
  -- command (SELECT/DELETE: USING only, INSERT: WITH CHECK only, UPDATE: both).
  IF (SELECT count(*) FROM backup.tenant_migration_20261118_wrapped_policies) <> 28
     OR (SELECT count(*) FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename IN ('current_accounts', 'current_account_movements', 'invoices', 'invoice_items',
                              'products', 'transactions', 'collection_invoice_matches')) <> 28 THEN
    RAISE EXCEPTION 'Abort: expected exactly the 28 *_tenant_* policies on the 7 tables';
  END IF;
  IF EXISTS (
    SELECT 1 FROM backup.tenant_migration_20261118_wrapped_policies
    WHERE permissive <> 'PERMISSIVE'
       OR roles <> ARRAY['authenticated']::name[]
       OR qual IS DISTINCT FROM CASE WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') THEN '(tenant_id = app_tenant_id())' END
       OR with_check IS DISTINCT FROM CASE WHEN cmd IN ('INSERT', 'UPDATE') THEN '(tenant_id = app_tenant_id())' END
  ) THEN
    RAISE EXCEPTION 'Abort: a *_tenant_* policy on the 7 tables differs from (tenant_id = app_tenant_id())';
  END IF;
  IF (SELECT count(*) FROM backup.tenant_migration_20261118_defaults) <> 2 THEN
    RAISE EXCEPTION 'Abort: expected 2 tenant_id columns in the defaults backup';
  END IF;
  -- Only the exact constraint analysed for this change is replaced.
  IF (SELECT count(*) FROM backup.tenant_migration_20261118_constraints) <> 1
     OR (SELECT definition FROM backup.tenant_migration_20261118_constraints)
        IS DISTINCT FROM 'CHECK ((tenant_id = get_jwt_tenant()))' THEN
    RAISE EXCEPTION 'Abort: current_accounts_tenant_check is missing or differs from CHECK ((tenant_id = get_jwt_tenant()))';
  END IF;
  IF (SELECT count(*) FROM backup.tenant_migration_20261118_snapshot)
     <> (SELECT sum(n) FROM row_counts_before) THEN
    RAISE EXCEPTION 'Abort: snapshot row count does not match the tables';
  END IF;
END $$;

-- user id -> company tenant id
CREATE TEMP TABLE tenant_map ON COMMIT DROP AS
SELECT id AS user_id,
       (raw_user_meta_data ->> 'tenant_id')::uuid AS tenant_id
FROM auth.users
WHERE raw_user_meta_data ->> 'tenant_id'
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

DO $$
BEGIN
  -- Two users pointing at the same company would mean a tampered value.
  IF (SELECT count(*) FROM tenant_map) <> (SELECT count(DISTINCT tenant_id) FROM tenant_map) THEN
    RAISE EXCEPTION 'Abort: several users share one tenant id';
  END IF;
  -- A tenant id equal to another user's id would merge two customers.
  IF EXISTS (SELECT 1 FROM tenant_map m JOIN auth.users u ON u.id = m.tenant_id AND u.id <> m.user_id) THEN
    RAISE EXCEPTION 'Abort: a tenant id equals another user id';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1) Company id into server-controlled app_metadata
-- ---------------------------------------------------------------------------
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb)
                        || jsonb_build_object('tenant_id', m.tenant_id::text)
FROM tenant_map m
WHERE u.id = m.user_id;

-- ---------------------------------------------------------------------------
-- 2) Move rows stored under the user id to the company id (with backup)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'categories', 'invoices', 'warehouses', 'stock_movements', 'current_accounts',
    'current_account_movements', 'collection_invoice_matches', 'transactions',
    'products', 'invoice_items', 'safes', 'banks', 'cheques'
  ] LOOP
    EXECUTE format(
      'WITH moved AS (
         UPDATE public.%I r
         SET tenant_id = m.tenant_id
         FROM tenant_map m
         WHERE r.tenant_id = m.user_id
         RETURNING r.id, m.user_id AS old_tenant_id, m.tenant_id AS new_tenant_id
       )
       INSERT INTO backup.tenant_migration_20261118_rows (table_name, row_id, old_tenant_id, new_tenant_id)
       SELECT %L, id, old_tenant_id, new_tenant_id FROM moved',
      t, t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Single tenant resolver. The database is the only source of the tenant:
--      1. no signed-in user (service_role, anon, postgres, migrations) -> NULL
--      2. app_metadata.tenant_id of the user's CURRENT auth.users row
--         (server-controlled; a change applies to the next request, not only
--         after the token refreshes)
--      3. the user id (user without a company id, or row no longer present)
--    The JWT is used only for the user id (sub, signed by Supabase Auth).
--    Not used, on purpose:
--      * top-level "tenant_id" claim: nothing issues it (no access token
--        hook); a hook or third-party auth provider added later could put
--        caller-influenced data there
--      * app_metadata inside the JWT: a snapshot, up to one token lifetime old
--      * user_metadata (JWT or table): editable by the user
--    SECURITY DEFINER because authenticated cannot read auth.users; it reads
--    one field of the caller's own row only. search_path = pg_catalog and
--    every object schema-qualified: nothing can be shadowed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    ELSE COALESCE(
      (SELECT NULLIF(u.raw_app_meta_data ->> 'tenant_id', '')::uuid
         FROM auth.users u
        WHERE u.id = auth.uid()),
      auth.uid())
  END;
$$;

-- ---------------------------------------------------------------------------
-- 4) New users: write the company id to app_metadata as well.
--    user_metadata keeps a copy only for clients still on the old build; no
--    authorization reads it any more.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  INSERT INTO public.tenants (name, owner_user_id)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), NEW.id)
  RETURNING id INTO new_tenant_id;

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                          || jsonb_build_object('tenant_id', new_tenant_id::text),
      raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb),
                                     '{tenant_id}', to_jsonb(new_tenant_id::text))
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- categories BEFORE INSERT trigger: stop reading user_metadata.
CREATE OR REPLACE FUNCTION public.set_tenant_id_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.tenant_id := public.app_tenant_id();
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id could not be resolved';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_tenant_id_from_user() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) Column defaults
-- ---------------------------------------------------------------------------
ALTER TABLE public.categories ALTER COLUMN tenant_id SET DEFAULT public.app_tenant_id();
ALTER TABLE public.current_accounts ALTER COLUMN tenant_id SET DEFAULT public.app_tenant_id();

-- 5c) current_accounts_tenant_check was CHECK (tenant_id = get_jwt_tenant()),
--     i.e. tenant_id = auth.uid() for API users. Left as is, every INSERT and
--     every UPDATE of a current account at the company id would fail with
--     23514 for authenticated callers (new accounts, the account-movement RPCs,
--     the balance update of the delete trigger, invoice creation).
--     Same name, same meaning in the new model: the row must belong to the
--     caller's tenant. It keeps guarding writes made by SECURITY DEFINER code
--     (which bypasses RLS) on behalf of an API user. For callers without a
--     user (service_role, postgres, this migration) app_tenant_id() is NULL
--     and the check passes, exactly as get_jwt_tenant() did before.
--     Validation of the existing rows runs here without a JWT, so it passes.
ALTER TABLE public.current_accounts DROP CONSTRAINT current_accounts_tenant_check;
ALTER TABLE public.current_accounts ADD CONSTRAINT current_accounts_tenant_check
  CHECK (tenant_id = public.app_tenant_id());

-- 5b) Compatibility for builds that still send tenant_id = user id on insert
--     (the production build before this change does, for these four tables).
--     Only the caller's own user id is mapped, and only to the caller's own
--     company id, so it cannot write into another tenant. RLS WITH CHECK still
--     runs after this trigger. Service-role inserts (auth.uid() IS NULL) are
--     left untouched. Trigger functions need no EXECUTE grant to fire.
CREATE FUNCTION public.normalize_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND (NEW.tenant_id IS NULL OR NEW.tenant_id = auth.uid()) THEN
    NEW.tenant_id := public.app_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.normalize_tenant_id() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_normalize_tenant_id BEFORE INSERT ON public.current_accounts
  FOR EACH ROW EXECUTE FUNCTION public.normalize_tenant_id();
CREATE TRIGGER trg_normalize_tenant_id BEFORE INSERT ON public.banks
  FOR EACH ROW EXECUTE FUNCTION public.normalize_tenant_id();
CREATE TRIGGER trg_normalize_tenant_id BEFORE INSERT ON public.cheques
  FOR EACH ROW EXECUTE FUNCTION public.normalize_tenant_id();
CREATE TRIGGER trg_normalize_tenant_id BEFORE INSERT ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.normalize_tenant_id();

-- ---------------------------------------------------------------------------
-- 6) Policies that did not use app_tenant_id()
-- ---------------------------------------------------------------------------
-- stock_movements
DROP POLICY stock_movements_select ON public.stock_movements;
DROP POLICY stock_movements_insert ON public.stock_movements;
DROP POLICY stock_movements_update ON public.stock_movements;
DROP POLICY stock_movements_delete ON public.stock_movements;
CREATE POLICY stock_movements_tenant_select ON public.stock_movements FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.app_tenant_id()));
CREATE POLICY stock_movements_tenant_insert ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.app_tenant_id()));
CREATE POLICY stock_movements_tenant_update ON public.stock_movements FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.app_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.app_tenant_id()));
CREATE POLICY stock_movements_tenant_delete ON public.stock_movements FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.app_tenant_id()));

-- categories (old set mixed JWT claim, auth.uid() and user_metadata)
DROP POLICY categories_select ON public.categories;
DROP POLICY categories_select_own ON public.categories;
DROP POLICY categories_insert ON public.categories;
DROP POLICY categories_insert_own ON public.categories;
DROP POLICY categories_update ON public.categories;
DROP POLICY categories_update_own ON public.categories;
DROP POLICY categories_delete ON public.categories;
DROP POLICY categories_delete_own ON public.categories;
CREATE POLICY categories_tenant_select ON public.categories FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.app_tenant_id()));
CREATE POLICY categories_tenant_insert ON public.categories FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.app_tenant_id()));
CREATE POLICY categories_tenant_update ON public.categories FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.app_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.app_tenant_id()));
CREATE POLICY categories_tenant_delete ON public.categories FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.app_tenant_id()));

-- warehouses (old set was TO public with JWT claim or auth.uid())
DROP POLICY warehouses_select ON public.warehouses;
DROP POLICY warehouses_select_own ON public.warehouses;
DROP POLICY warehouses_insert ON public.warehouses;
DROP POLICY warehouses_insert_own ON public.warehouses;
DROP POLICY warehouses_update ON public.warehouses;
DROP POLICY warehouses_update_own ON public.warehouses;
DROP POLICY warehouses_delete ON public.warehouses;
DROP POLICY warehouses_delete_own ON public.warehouses;
CREATE POLICY warehouses_tenant_select ON public.warehouses FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.app_tenant_id()));
CREATE POLICY warehouses_tenant_insert ON public.warehouses FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.app_tenant_id()));
CREATE POLICY warehouses_tenant_update ON public.warehouses FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.app_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.app_tenant_id()));
CREATE POLICY warehouses_tenant_delete ON public.warehouses FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.app_tenant_id()));

-- 6b) The 28 *_tenant_* policies of current_accounts, current_account_movements,
--     invoices, invoice_items, products, transactions, collection_invoice_matches:
--     same predicate, tenant_id = app_tenant_id(), with the call wrapped in a
--     sub-select so it runs once per statement (an InitPlan) instead of once
--     per row. ALTER POLICY changes only the expressions given: name, command,
--     roles and PERMISSIVE stay as they are. USING is set only where the policy
--     has one, WITH CHECK only where it has one (checked in step 0 and step 8).
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN SELECT * FROM backup.tenant_migration_20261118_wrapped_policies ORDER BY tablename, policyname LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I%s%s',
      p.policyname, p.tablename,
      CASE WHEN p.qual IS NOT NULL THEN ' USING (tenant_id = (SELECT public.app_tenant_id()))' ELSE '' END,
      CASE WHEN p.with_check IS NOT NULL THEN ' WITH CHECK (tenant_id = (SELECT public.app_tenant_id()))' ELSE '' END);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 7) Account-movement RPCs used by the app: resolve the tenant with
--    app_tenant_id(). Bodies are the live versions; only the tenant lines
--    changed (tenant resolution and the ownership WHERE clauses).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_current_account_movement(
  p_current_account_id uuid,
  p_movement_type text,
  p_amount numeric,
  p_direction integer DEFAULT NULL::integer,
  p_currency text DEFAULT 'TRY'::text,
  p_document_no text DEFAULT NULL::text,
  p_document_date date DEFAULT CURRENT_DATE,
  p_description text DEFAULT NULL::text,
  p_invoice_id uuid DEFAULT NULL::uuid,
  p_matches jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tenant_id uuid;
  v_direction integer;
  v_signed_amount numeric(14,2);
  v_balance_after numeric(14,2);
  v_movement_id uuid;
  v_account public.current_accounts%ROWTYPE;
  v_match_item jsonb;
  v_match_invoice_id uuid;
  v_match_amount numeric(14,2);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Auth session missing';
  END IF;

  v_tenant_id := public.app_tenant_id();

  SELECT *
  INTO v_account
  FROM public.current_accounts
  WHERE id = p_current_account_id
    AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current account not found or unauthorized';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  v_direction := COALESCE(
    p_direction,
    CASE UPPER(COALESCE(p_movement_type, ''))
      WHEN 'INVOICE' THEN 1
      WHEN 'PAYMENT' THEN 1
      WHEN 'COLLECTION' THEN -1
      ELSE NULL
    END
  );

  IF v_direction NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Direction must be -1 or 1';
  END IF;

  v_signed_amount := ROUND(p_amount::numeric, 2) * v_direction;
  v_balance_after := ROUND(COALESCE(v_account.balance, 0)::numeric + v_signed_amount, 2);

  UPDATE public.current_accounts
  SET balance = v_balance_after,
      updated_at = now()
  WHERE id = v_account.id;

  INSERT INTO public.current_account_movements (
    current_account_id, invoice_id, movement_type, amount, direction, signed_amount,
    balance_after, currency, document_no, document_date, description, tenant_id, user_id
  )
  VALUES (
    v_account.id,
    p_invoice_id,
    UPPER(p_movement_type),
    ROUND(p_amount::numeric, 2),
    v_direction,
    v_signed_amount,
    v_balance_after,
    COALESCE(NULLIF(p_currency, ''), 'TRY'),
    NULLIF(p_document_no, ''),
    COALESCE(p_document_date, CURRENT_DATE),
    p_description,
    v_account.tenant_id,
    v_uid
  )
  RETURNING id INTO v_movement_id;

  IF p_matches IS NOT NULL AND jsonb_typeof(p_matches) = 'array' THEN
    FOR v_match_item IN SELECT * FROM jsonb_array_elements(p_matches)
    LOOP
      v_match_invoice_id := NULLIF((v_match_item ->> 'invoice_id'), '')::uuid;
      v_match_amount := COALESCE(NULLIF((v_match_item ->> 'amount'), '')::numeric, 0);

      IF v_match_invoice_id IS NULL OR v_match_amount <= 0 THEN
        CONTINUE;
      END IF;

      INSERT INTO public.collection_invoice_matches (
        collection_movement_id, invoice_id, applied_amount, tenant_id, user_id
      )
      VALUES (
        v_movement_id, v_match_invoice_id, ROUND(v_match_amount, 2), v_account.tenant_id, v_uid
      )
      ON CONFLICT (collection_movement_id, invoice_id)
      DO UPDATE SET applied_amount = EXCLUDED.applied_amount;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'movement_id', v_movement_id,
    'current_account_id', v_account.id,
    'balance', v_balance_after,
    'signed_amount', v_signed_amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_current_account_movement(p_movement_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tenant_id uuid;
  v_movement public.current_account_movements%ROWTYPE;
  v_account public.current_accounts%ROWTYPE;
  v_updated_balance numeric(14,2);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Auth session missing';
  END IF;

  v_tenant_id := public.app_tenant_id();

  SELECT *
  INTO v_movement
  FROM public.current_account_movements
  WHERE id = p_movement_id
    AND movement_type IN ('COLLECTION', 'PAYMENT', 'ADJUSTMENT')
    AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current account movement not found or unauthorized';
  END IF;

  SELECT *
  INTO v_account
  FROM public.current_accounts
  WHERE id = v_movement.current_account_id
    AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current account not found or unauthorized';
  END IF;

  v_updated_balance := ROUND(COALESCE(v_account.balance, 0)::numeric - v_movement.signed_amount, 2);

  UPDATE public.current_accounts
  SET balance = v_updated_balance, updated_at = now()
  WHERE id = v_account.id;

  DELETE FROM public.collection_invoice_matches
  WHERE collection_movement_id = v_movement.id;

  DELETE FROM public.current_account_movements
  WHERE id = v_movement.id;

  UPDATE public.current_account_movements
  SET balance_after = ROUND(balance_after - v_movement.signed_amount, 2),
      updated_at = now()
  WHERE current_account_id = v_account.id
    AND (
      document_date > v_movement.document_date
      OR (
        document_date = v_movement.document_date
        AND (
          created_at > v_movement.created_at
          OR (created_at = v_movement.created_at AND id > v_movement.id)
        )
      )
    );

  RETURN jsonb_build_object(
    'movement_id', v_movement.id,
    'current_account_id', v_account.id,
    'balance', v_updated_balance,
    'signed_amount', v_movement.signed_amount,
    'invoice_id', v_movement.invoice_id
  );
END;
$$;

-- Unused SECURITY DEFINER overloads that take a caller-supplied tenant id.
REVOKE EXECUTE ON FUNCTION public.record_current_account_movement(uuid, uuid, text, numeric, integer, date, text, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_current_account_movement(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8) Self-checks: abort everything if the result is not consistent
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  leftover bigint;
  now_n bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM tenant_map m JOIN auth.users u ON u.id = m.user_id
             WHERE (u.raw_app_meta_data ->> 'tenant_id') IS DISTINCT FROM m.tenant_id::text) THEN
    RAISE EXCEPTION 'Check failed: app_metadata.tenant_id not set for every mapped user';
  END IF;

  FOR t IN SELECT table_name FROM row_counts_before LOOP
    EXECUTE format('SELECT count(*) FROM public.%I r JOIN tenant_map m ON r.tenant_id = m.user_id', t)
    INTO leftover;
    IF leftover > 0 THEN
      RAISE EXCEPTION 'Check failed: % still has % rows under a user id', t, leftover;
    END IF;

    EXECUTE format('SELECT count(*) FROM public.%I', t) INTO now_n;
    IF now_n <> (SELECT n FROM row_counts_before WHERE table_name = t) THEN
      RAISE EXCEPTION 'Check failed: row count of % changed', t;
    END IF;
  END LOOP;

  IF (SELECT count(*) FROM backup.tenant_migration_20261118_rows)
     <> (SELECT count(*) FROM backup.tenant_migration_20261118_snapshot s
         JOIN tenant_map m ON s.tenant_id = m.user_id) THEN
    RAISE EXCEPTION 'Check failed: moved-row backup does not match the snapshot';
  END IF;

  IF (SELECT count(*) FROM pg_constraint
      WHERE conrelid = 'public.current_accounts'::regclass
        AND conname = 'current_accounts_tenant_check'
        AND convalidated
        AND pg_get_constraintdef(oid) = 'CHECK ((tenant_id = app_tenant_id()))') <> 1 THEN
    RAISE EXCEPTION 'Check failed: current_accounts_tenant_check was not replaced as expected';
  END IF;

  -- 28 wrapped policies: name, command, roles and PERMISSIVE as before; each
  -- expression present exactly where it was, now the wrapped form; nothing else
  -- on the 7 tables
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
    RAISE EXCEPTION 'Check failed: the 28 wrapped policies are not exactly as intended';
  END IF;

  -- app_tenant_id(): definer, owner, settings and EXECUTE rights as intended
  -- (CREATE OR REPLACE keeps owner and ACL; this proves it)
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE oid = 'public.app_tenant_id()'::regprocedure
      AND prosecdef
      AND proowner = 'postgres'::regrole
      AND proconfig = ARRAY['search_path=pg_catalog']
      AND provolatile = 's'
      AND prosrc !~* 'jwt' AND prosrc !~* 'user_meta')
     OR has_function_privilege('anon', 'public.app_tenant_id()', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.app_tenant_id()', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.app_tenant_id()', 'EXECUTE')
     OR EXISTS (SELECT 1 FROM pg_proc p, aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
                WHERE p.oid = 'public.app_tenant_id()'::regprocedure AND a.grantee = 0) THEN
    RAISE EXCEPTION 'Check failed: app_tenant_id() security attributes or EXECUTE rights differ from the intended state';
  END IF;

  RAISE NOTICE 'Migration OK: % rows moved, % users updated',
    (SELECT count(*) FROM backup.tenant_migration_20261118_rows),
    (SELECT count(*) FROM tenant_map);
END $$;

COMMIT;
