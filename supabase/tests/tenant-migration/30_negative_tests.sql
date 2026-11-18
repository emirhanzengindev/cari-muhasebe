-- LOCAL TEST DATABASE ONLY. T3: cross-tenant and privilege attacks after the
-- forward migration (run after 21, before the rollback). Run as postgres.
-- Every attempt runs with p_rollback = true: whatever it does is undone, so
-- this file leaves no trace in the data that T4 checks.
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: tenant_test.local_marker not found (this is not the local test database)';
  END IF;
  IF to_regprocedure('public.normalize_tenant_id()') IS NULL THEN
    RAISE EXCEPTION 'Run after the forward migration';
  END IF;
END $$;

SELECT tenant_test.begin_stage('T3');

-- For n28-n30: SECURITY DEFINER code owned by postgres bypasses RLS. This
-- session-local helper (pg_temp, gone when the session ends, not in public)
-- writes a current account the way such code would; the replaced
-- current_accounts_tenant_check must still stop it for another tenant's row.
CREATE FUNCTION pg_temp.tt_definer_touch_account(p_id uuid) RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH x AS (UPDATE public.current_accounts SET updated_at = updated_at WHERE id = p_id RETURNING 1)
  SELECT count(*)::text FROM x
$$;

DO $$
DECLARE
  r record;
  u1 uuid := tenant_test.uid(1);
  c1 text := tenant_test.cid(1)::text;
  c2 text := tenant_test.cid(2)::text;
  u2 text := tenant_test.uid(2)::text;
BEGIN
  -- n01 user_metadata.tenant_id points at company 13 (and is in the token): ignored
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', tenant_test.uid(12), 'current', 'SELECT public.app_tenant_id()::text', true);
  PERFORM tenant_test.check('T3', 'n01 tampered user_metadata ignored by app_tenant_id()',
    r.ok AND r.result = tenant_test.cid(12)::text, concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', tenant_test.uid(12), 'current',
    format('SELECT count(*)::text FROM public.invoices WHERE tenant_id = %L', tenant_test.cid(13)), true);
  PERFORM tenant_test.check('T3', 'n02 tampered user sees no invoice of company 13', r.ok AND r.result = '0', concat_ws(' ', r.result, r.state, r.msg));

  -- n03..n05 writing into another company
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$INSERT INTO public.current_accounts (name, tenant_id, user_id) VALUES ('x', %L, %L) RETURNING id::text$q$, c2, u1), true);
  PERFORM tenant_test.check('T3', 'n03 insert current_accounts into company 2 rejected',
    NOT r.ok AND r.state IN ('42501', '23514'), concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$INSERT INTO public.banks (name, tenant_id) VALUES ('x', %L) RETURNING id::text$q$, u2), true);
  PERFORM tenant_test.check('T3', 'n04 insert banks with another user id rejected (trigger maps only own id)',
    NOT r.ok AND r.state = '42501', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$INSERT INTO public.banks (name, tenant_id) VALUES ('x', %L) RETURNING id::text$q$, c2), true);
  PERFORM tenant_test.check('T3', 'n05 insert banks into company 2 rejected', NOT r.ok AND r.state = '42501', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$INSERT INTO public.warehouses (name, tenant_id) VALUES ('x', %L) RETURNING id::text$q$, u2), true);
  PERFORM tenant_test.check('T3', 'n06 insert warehouses with another user id rejected', NOT r.ok AND r.state = '42501', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$INSERT INTO public.stock_movements (product_id, movement_type, quantity, tenant_id) VALUES (%L, 'in', 1, %L) RETURNING id::text$q$,
           tenant_test.rid('prod', 2), c2), true);
  PERFORM tenant_test.check('T3', 'n07 insert stock_movements into company 2 rejected', NOT r.ok, concat_ws(' ', r.result, r.state, r.msg));

  -- n08 moving own row to another company (UPDATE ... WITH CHECK)
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$WITH x AS (UPDATE public.invoices SET tenant_id = %L WHERE tenant_id = %L RETURNING 1) SELECT count(*)::text FROM x$q$, c2, c1), true);
  PERFORM tenant_test.check('T3', 'n08 move own invoices to company 2 rejected', NOT r.ok AND r.state = '42501', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$WITH x AS (UPDATE public.categories SET tenant_id = %L RETURNING 1) SELECT count(*)::text FROM x$q$, c2), true);
  PERFORM tenant_test.check('T3', 'n09 move own categories to company 2 rejected', NOT r.ok AND r.state = '42501', concat_ws(' ', r.result, r.state, r.msg));

  -- n10, n11 touching another company's rows: silently filtered by RLS
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$WITH x AS (UPDATE public.invoices SET description = 'x' WHERE tenant_id = %L RETURNING 1) SELECT count(*)::text FROM x$q$, c2), true);
  PERFORM tenant_test.check('T3', 'n10 update company 2 invoices affects 0 rows', r.ok AND r.result = '0', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$WITH x AS (DELETE FROM public.current_account_movements WHERE tenant_id = %L RETURNING 1) SELECT count(*)::text FROM x$q$, c2), true);
  PERFORM tenant_test.check('T3', 'n11 delete company 2 movements affects 0 rows', r.ok AND r.result = '0', concat_ws(' ', r.result, r.state, r.msg));

  -- n12, n13 RPCs on another company's account / movement
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$SELECT public.record_current_account_movement(%L::uuid, 'COLLECTION', 1::numeric)::text$q$, tenant_test.rid('ca-user', 2)), true);
  PERFORM tenant_test.check('T3', 'n12 record movement on company 2 account rejected',
    NOT r.ok AND r.msg LIKE '%not found or unauthorized%', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$SELECT public.delete_current_account_movement(%L::uuid)::text$q$, tenant_test.rid('cam-2', 9)), true);
  PERFORM tenant_test.check('T3', 'n13 delete movement of company 2 rejected',
    NOT r.ok AND r.msg LIKE '%not found or unauthorized%', concat_ws(' ', r.result, r.state, r.msg));

  -- n14, n15 SECURITY DEFINER overloads that take a caller-supplied tenant id: no EXECUTE
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$SELECT public.record_current_account_movement(%L::uuid, %L::uuid, 'COLLECTION', 1::numeric, -1, CURRENT_DATE, NULL::text, NULL::text, NULL::uuid, '[]'::jsonb)::text$q$,
           c2, tenant_test.rid('ca-user', 2)), true);
  PERFORM tenant_test.check('T3', 'n14 definer record overload not executable', NOT r.ok AND r.state = '42501', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$SELECT public.delete_current_account_movement(%L::uuid, %L::uuid)::text$q$, c2, tenant_test.rid('cam-2', 9)), true);
  PERFORM tenant_test.check('T3', 'n15 definer delete overload not executable', NOT r.ok AND r.state = '42501', concat_ws(' ', r.result, r.state, r.msg));

  -- n16..n18 anon
  SELECT * INTO r FROM tenant_test.try_sql('anon', NULL, NULL, 'SELECT public.app_tenant_id()::text', true);
  PERFORM tenant_test.check('T3', 'n16 anon cannot execute app_tenant_id()', NOT r.ok AND r.state = '42501', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('anon', NULL, NULL, 'SELECT count(*)::text FROM public.invoices', true);
  PERFORM tenant_test.check('T3', 'n17 anon sees 0 invoices', r.ok AND r.result = '0', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('anon', NULL, NULL,
    format($q$SELECT public.record_current_account_movement(%L::uuid, 'COLLECTION', 1::numeric)::text$q$, tenant_test.rid('ca-user', 1)), true);
  PERFORM tenant_test.check('T3', 'n18 anon RPC rejected (no session)', NOT r.ok, concat_ws(' ', r.result, r.state, r.msg));

  -- n19, n20 internal functions and the backup schema
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current', 'SELECT public.normalize_tenant_id()::text', true);
  PERFORM tenant_test.check('T3', 'n19 normalize_tenant_id() not callable', NOT r.ok, concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current', 'SELECT count(*)::text FROM backup.tenant_migration_20261118_users', true);
  PERFORM tenant_test.check('T3', 'n20 backup schema not readable', NOT r.ok AND r.state = '42501', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('service_role', NULL, NULL, 'SELECT count(*)::text FROM backup.tenant_migration_20261118_users', true);
  PERFORM tenant_test.check('T3', 'n21 backup schema not readable by service_role', NOT r.ok AND r.state = '42501', concat_ws(' ', r.result, r.state, r.msg));

  -- n22..n26 positive controls (rolled back)
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$INSERT INTO public.categories (name, tenant_id) VALUES ('x', %L) RETURNING tenant_id::text$q$, c2), true);
  PERFORM tenant_test.check('T3', 'n22 categories trigger forces own company', r.ok AND r.result = c1, concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$INSERT INTO public.warehouses (name, tenant_id) VALUES ('x', %L) RETURNING tenant_id::text$q$, u1), true);
  PERFORM tenant_test.check('T3', 'n23 normalize maps own user id to own company', r.ok AND r.result = c1, concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'old', 'SELECT public.app_tenant_id()::text', true);
  PERFORM tenant_test.check('T3', 'n24 old token resolves own company (auth.users lookup)', r.ok AND r.result = c1, concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', tenant_test.uid(17), 'current', 'SELECT public.app_tenant_id()::text', true);
  PERFORM tenant_test.check('T3', 'n25 new user resolves own company', r.ok AND r.result = tenant_test.company_of(17)::text, concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('service_role', NULL, NULL,
    format($q$INSERT INTO public.banks (name, tenant_id) VALUES ('x', %L) RETURNING tenant_id::text$q$, tenant_test.cid(3)), true);
  PERFORM tenant_test.check('T3', 'n26 service_role insert keeps the given tenant', r.ok AND r.result = tenant_test.cid(3)::text, concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current', 'SELECT count(*)::text FROM public.tenants', true);
  PERFORM tenant_test.check('T3', 'n27 user sees only own tenants row', r.ok AND r.result = '1', concat_ws(' ', r.result, r.state, r.msg));

  -- n28-n30 current_accounts_tenant_check behind RLS-bypassing code
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$SELECT pg_temp.tt_definer_touch_account(%L::uuid)$q$, tenant_test.rid('ca-user', 2)), true);
  PERFORM tenant_test.check('T3', 'n28 definer write to company 2 account on behalf of u1 blocked by CHECK (23514)',
    NOT r.ok AND r.state = '23514', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'current',
    format($q$SELECT pg_temp.tt_definer_touch_account(%L::uuid)$q$, tenant_test.rid('ca-user', 1)), true);
  PERFORM tenant_test.check('T3', 'n29 definer write to own account allowed', r.ok AND r.result = '1', concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('service_role', NULL, NULL,
    format($q$SELECT pg_temp.tt_definer_touch_account(%L::uuid)$q$, tenant_test.rid('ca-user', 2)), true);
  PERFORM tenant_test.check('T3', 'n30 no user (service_role): CHECK passes, as with get_jwt_tenant() before',
    r.ok AND r.result = '1', concat_ws(' ', r.result, r.state, r.msg));

  -- n31-n33 tenant comes from the database only, never from JWT tenant claims
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'forge_top:' || c2, 'SELECT public.app_tenant_id()::text', true);
  PERFORM tenant_test.check('T3', 'n31 top-level tenant_id claim (company 2) ignored', r.ok AND r.result = c1, concat_ws(' ', r.result, r.state, r.msg));
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'forge_app:' || c2,
    format($q$SELECT count(*)::text FROM public.invoices WHERE tenant_id = %L$q$, c2), true);
  PERFORM tenant_test.check('T3', 'n32 app_metadata.tenant_id in the token (company 2) ignored: no company 2 invoice visible',
    r.ok AND r.result = '0', concat_ws(' ', r.result, r.state, r.msg));
  -- n33: admin moves u1 to another company; a token still carrying company 1
  --      resolves the new company on the very next request
  BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('tenant_id', tenant_test.rid('moved-company', 1)::text)
    WHERE id = u1;
    SELECT * INTO r FROM tenant_test.try_sql('authenticated', u1, 'forge_app:' || c1, 'SELECT public.app_tenant_id()::text', true);
    RAISE EXCEPTION USING ERRCODE = 'TT002', MESSAGE = COALESCE(r.result, 'ERR ' || COALESCE(r.state, '') || ' ' || COALESCE(r.msg, ''));
  EXCEPTION WHEN SQLSTATE 'TT002' THEN   -- the UPDATE above is undone here
    PERFORM tenant_test.check('T3', 'n33 tenant change in auth.users applies immediately (stale token ignored)',
      SQLERRM = tenant_test.rid('moved-company', 1)::text, SQLERRM);
  END;
  PERFORM tenant_test.check('T3', 'n33 cleanup: u1 back at company 1',
    (SELECT raw_app_meta_data ->> 'tenant_id' FROM auth.users WHERE id = u1) = c1);

  -- n34, n35 no signed-in user -> NULL (never another tenant, never an error)
  SELECT * INTO r FROM tenant_test.try_sql('service_role', NULL, NULL, $q$SELECT COALESCE(public.app_tenant_id()::text, 'NULL')$q$, true);
  PERFORM tenant_test.check('T3', 'n34 service_role: app_tenant_id() is NULL', r.ok AND r.result = 'NULL', concat_ws(' ', r.result, r.state, r.msg));
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM tenant_test.check('T3', 'n35 postgres without JWT: app_tenant_id() is NULL',
    public.app_tenant_id() IS NULL, COALESCE(public.app_tenant_id()::text, 'NULL'));
END $$;

DROP FUNCTION pg_temp.tt_definer_touch_account(uuid);

SELECT tenant_test.finish_stage('T3');
