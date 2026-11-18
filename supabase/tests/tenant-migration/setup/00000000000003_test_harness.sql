-- LOCAL TEST DATABASE ONLY (copied into the separate test project by prepare_local.ps1).
--
-- Test harness in its own schema "tenant_test". It is not exposed through the
-- Data API and holds only synthetic test bookkeeping. Its presence
-- (tenant_test.local_marker) is the guard every test file checks first, so a
-- test file run against any other database aborts before doing anything.
--
-- Nothing here touches public objects; the migration and rollback under test
-- never reference this schema.

CREATE SCHEMA tenant_test;
REVOKE ALL ON SCHEMA tenant_test FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE tenant_test.local_marker (
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO tenant_test.local_marker (note) VALUES ('cari1 tenant migration local test database');

-- Test users (1-16 baseline, 17-18 sign up after the migration in T2)
CREATE TABLE tenant_test.test_users (
  n int PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  company_id uuid,
  has_tenant_row boolean NOT NULL,
  email text NOT NULL,
  scenario text NOT NULL
);

-- Expected row counts after seeding (filled by 02 / 03)
CREATE TABLE tenant_test.expected_counts (
  table_name text PRIMARY KEY,
  n bigint NOT NULL,
  moved bigint NOT NULL          -- rows stored under a mapped user id (the migration moves these)
);

-- Schema fingerprint per stage
CREATE TABLE tenant_test.fingerprint (
  stage text NOT NULL,
  kind text NOT NULL,
  obj text NOT NULL,
  val text,
  PRIMARY KEY (stage, kind, obj)
);

-- tenant_id of every row of the 13 tables per stage
CREATE TABLE tenant_test.row_tenants (
  stage text NOT NULL,
  table_name text NOT NULL,
  row_id uuid NOT NULL,
  tenant_id uuid,
  PRIMARY KEY (stage, table_name, row_id)
);

-- auth.users metadata per stage
CREATE TABLE tenant_test.user_meta (
  stage text NOT NULL,
  user_id uuid NOT NULL,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  PRIMARY KEY (stage, user_id)
);

-- Everything T2 does, with the outcome
CREATE TABLE tenant_test.activity (
  id serial PRIMARY KEY,
  step text NOT NULL,
  actor int,
  table_name text,
  row_id uuid,
  kind text NOT NULL,      -- insert_post_migration | changed_moved | deleted_moved | updated_moved | signup | meta_change | read
  expected text NOT NULL,  -- ok | error
  outcome text NOT NULL,   -- ok | error
  sqlstate text,
  message text,
  result text,
  at timestamptz NOT NULL DEFAULT now()
);

-- Check results per stage
CREATE TABLE tenant_test.results (
  id serial PRIMARY KEY,
  stage text NOT NULL,
  check_name text NOT NULL,
  ok boolean NOT NULL,
  detail text,
  at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Deterministic synthetic ids
-- ---------------------------------------------------------------------------
CREATE FUNCTION tenant_test.rid(p_kind text, p_n int) RETURNS uuid
LANGUAGE sql IMMUTABLE AS $$ SELECT md5('cari-test-' || p_kind || '-' || p_n)::uuid $$;

CREATE FUNCTION tenant_test.uid(p_n int) RETURNS uuid
LANGUAGE sql IMMUTABLE AS $$ SELECT tenant_test.rid('user', p_n) $$;

CREATE FUNCTION tenant_test.cid(p_n int) RETURNS uuid
LANGUAGE sql IMMUTABLE AS $$ SELECT tenant_test.rid('company', p_n) $$;

CREATE FUNCTION tenant_test.company_of(p_n int) RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT company_id FROM tenant_test.test_users WHERE n = p_n $$;

CREATE FUNCTION tenant_test.tables() RETURNS SETOF text
LANGUAGE sql IMMUTABLE AS $$
  SELECT unnest(ARRAY[
    'categories', 'invoices', 'warehouses', 'stock_movements', 'current_accounts',
    'current_account_movements', 'collection_invoice_matches', 'transactions',
    'products', 'invoice_items', 'safes', 'banks', 'cheques'])
$$;

-- ---------------------------------------------------------------------------
-- Results
-- ---------------------------------------------------------------------------
CREATE FUNCTION tenant_test.begin_stage(p_stage text) RETURNS void
LANGUAGE sql AS $$ DELETE FROM tenant_test.results WHERE stage = p_stage $$;

CREATE FUNCTION tenant_test.check(p_stage text, p_name text, p_ok boolean, p_detail text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql AS $$
  INSERT INTO tenant_test.results (stage, check_name, ok, detail)
  VALUES (p_stage, p_name, COALESCE(p_ok, false), p_detail)
  RETURNING ok
$$;

CREATE FUNCTION tenant_test.finish_stage(p_stage text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  n_ok bigint;
  n_bad bigint;
BEGIN
  SELECT count(*) FILTER (WHERE ok), count(*) FILTER (WHERE NOT ok)
  INTO n_ok, n_bad FROM tenant_test.results WHERE stage = p_stage;
  IF n_bad > 0 THEN
    RAISE EXCEPTION 'STAGE % FAILED: % failed / % passed checks (SELECT * FROM tenant_test.results WHERE stage = %L AND NOT ok)',
      p_stage, n_bad, n_ok, p_stage;
  END IF;
  RAISE NOTICE 'STAGE % PASSED: % checks', p_stage, n_ok;
END $$;

-- ---------------------------------------------------------------------------
-- Snapshot of schema, row tenants and user metadata
-- ---------------------------------------------------------------------------
CREATE FUNCTION tenant_test.capture(p_stage text) RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  t text;
BEGIN
  DELETE FROM tenant_test.fingerprint WHERE stage = p_stage;
  DELETE FROM tenant_test.row_tenants WHERE stage = p_stage;
  DELETE FROM tenant_test.user_meta WHERE stage = p_stage;

  -- every function in public, all catalog attributes, sorted ACL
  INSERT INTO tenant_test.fingerprint
  SELECT p_stage, 'func', p.oid::regprocedure::text,
         concat_ws(' | ',
           'src=' || md5(p.prosrc), 'owner=' || p.proowner::regrole::text,
           'secdef=' || p.prosecdef::text, 'config=' || COALESCE(p.proconfig::text, '-'),
           'vol=' || p.provolatile::text, 'strict=' || p.proisstrict::text,
           'leak=' || p.proleakproof::text, 'par=' || p.proparallel::text,
           'lang=' || l.lanname::text, 'ret=' || p.prorettype::regtype::text,
           'args=' || pg_get_function_arguments(p.oid),
           'acl=' || COALESCE((SELECT string_agg(e, ' ' ORDER BY e) FROM unnest(p.proacl::text[]) e), 'default'))
  FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang
  WHERE p.pronamespace = 'public'::regnamespace;

  -- every policy in public
  INSERT INTO tenant_test.fingerprint
  SELECT p_stage, 'policy', tablename::text || '.' || policyname::text,
         concat_ws(' | ', permissive, cmd,
           (SELECT string_agg(r::text, ',' ORDER BY r::text) FROM unnest(roles) r),
           'using=' || COALESCE(qual, '-'), 'check=' || COALESCE(with_check, '-'))
  FROM pg_policies WHERE schemaname = 'public';

  -- triggers on public tables and on auth.users
  INSERT INTO tenant_test.fingerprint
  SELECT p_stage, 'trigger', tg.tgrelid::regclass::text || '.' || tg.tgname::text,
         tg.tgenabled::text || ' ' || pg_get_triggerdef(tg.oid)
  FROM pg_trigger tg JOIN pg_class c ON c.oid = tg.tgrelid
  WHERE NOT tg.tgisinternal
    AND (c.relnamespace = 'public'::regnamespace OR tg.tgrelid = 'auth.users'::regclass);

  -- constraints in public
  INSERT INTO tenant_test.fingerprint
  SELECT p_stage, 'constraint', con.conrelid::regclass::text || '.' || con.conname::text,
         con.contype::text || ' ' || pg_get_constraintdef(con.oid) || ' valid=' || con.convalidated::text
  FROM pg_constraint con WHERE con.connamespace = 'public'::regnamespace;

  -- column defaults in public
  INSERT INTO tenant_test.fingerprint
  SELECT p_stage, 'default', c.relname::text || '.' || a.attname::text, pg_get_expr(d.adbin, d.adrelid)
  FROM pg_attrdef d
  JOIN pg_class c ON c.oid = d.adrelid
  JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
  WHERE c.relnamespace = 'public'::regnamespace;

  -- relations: owner, RLS flags, ACL, options; view text
  INSERT INTO tenant_test.fingerprint
  SELECT p_stage, 'relation', c.relname::text,
         concat_ws(' | ', 'kind=' || c.relkind::text, 'owner=' || c.relowner::regrole::text,
           'rls=' || c.relrowsecurity::text, 'force=' || c.relforcerowsecurity::text,
           'acl=' || COALESCE((SELECT string_agg(e, ' ' ORDER BY e) FROM unnest(c.relacl::text[]) e), 'default'),
           'opts=' || COALESCE(c.reloptions::text, '-'),
           CASE WHEN c.relkind = 'v' THEN 'view=' || md5(pg_get_viewdef(c.oid)) END)
  FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'v', 'm', 'p', 'f');

  -- schema ACL of public
  INSERT INTO tenant_test.fingerprint
  SELECT p_stage, 'schema', n.nspname::text,
         'owner=' || n.nspowner::regrole::text || ' acl=' ||
         COALESCE((SELECT string_agg(e, ' ' ORDER BY e) FROM unnest(n.nspacl::text[]) e), 'default')
  FROM pg_namespace n WHERE n.nspname = 'public';

  -- backup schema contents (expected to differ between stages; excluded from diffs)
  INSERT INTO tenant_test.fingerprint
  SELECT p_stage, 'backup_table', '(schema)',
         'acl=' || COALESCE((SELECT string_agg(e, ' ' ORDER BY e) FROM unnest(n.nspacl::text[]) e), 'default')
  FROM pg_namespace n WHERE n.nspname = 'backup';
  INSERT INTO tenant_test.fingerprint
  SELECT p_stage, 'backup_table', c.relname::text, 'rows-not-counted'
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'backup' AND c.relkind = 'r';

  -- tenant_id of every row
  FOR t IN SELECT tenant_test.tables() LOOP
    EXECUTE format(
      'INSERT INTO tenant_test.row_tenants (stage, table_name, row_id, tenant_id)
       SELECT %L, %L, id, tenant_id FROM public.%I', p_stage, t, t);
  END LOOP;

  INSERT INTO tenant_test.user_meta
  SELECT p_stage, id, raw_app_meta_data, raw_user_meta_data FROM auth.users;
END $$;

-- Differences between two fingerprints (backup schema excluded)
CREATE FUNCTION tenant_test.fingerprint_diff(p_a text, p_b text)
RETURNS TABLE (kind text, obj text, val_a text, val_b text)
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(x.kind, y.kind), COALESCE(x.obj, y.obj), x.val, y.val
  FROM (SELECT * FROM tenant_test.fingerprint WHERE stage = p_a AND kind <> 'backup_table') x
  FULL JOIN (SELECT * FROM tenant_test.fingerprint WHERE stage = p_b AND kind <> 'backup_table') y
    ON x.kind = y.kind AND x.obj = y.obj
  WHERE x.val IS DISTINCT FROM y.val
  ORDER BY 1, 2
$$;

-- ---------------------------------------------------------------------------
-- Acting as an API user: the same role switch and JWT claims PostgREST uses
-- ---------------------------------------------------------------------------
-- p_style: 'current'          = token minted now (current app/user metadata)
--          'old'              = token minted before the migration (T0 app_metadata)
--          'forge_top:<uuid>' = current token plus a top-level "tenant_id" claim
--          'forge_app:<uuid>' = current token with app_metadata.tenant_id replaced
--                               (a stale or foreign value inside a signed token)
CREATE FUNCTION tenant_test.claims(p_user uuid, p_style text) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'sub', u.id::text,
    'role', 'authenticated',
    'aud', 'authenticated',
    'email', u.email,
    'is_anonymous', false,
    'app_metadata', CASE
      WHEN p_style = 'old' THEN COALESCE(
        (SELECT m.raw_app_meta_data FROM tenant_test.user_meta m WHERE m.stage = 'T0' AND m.user_id = u.id),
        COALESCE(u.raw_app_meta_data, '{}'::jsonb) - 'tenant_id')
      WHEN p_style LIKE 'forge_app:%' THEN
        COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('tenant_id', split_part(p_style, ':', 2))
      ELSE COALESCE(u.raw_app_meta_data, '{}'::jsonb) END,
    'user_metadata', COALESCE(u.raw_user_meta_data, '{}'::jsonb))
  || CASE WHEN p_style LIKE 'forge_top:%'
          THEN jsonb_build_object('tenant_id', split_part(p_style, ':', 2))
          ELSE '{}'::jsonb END
  FROM auth.users u WHERE u.id = p_user
$$;

-- Runs one statement as p_role (with the user's JWT claims). The statement must
-- return one value (use RETURNING or a SELECT). With p_rollback the statement's
-- effects are always undone (used by the negative tests).
-- Errors are returned, never raised.
CREATE FUNCTION tenant_test.try_sql(
  p_role text, p_user uuid, p_style text, p_sql text, p_rollback boolean DEFAULT false,
  OUT ok boolean, OUT state text, OUT msg text, OUT result text)
LANGUAGE plpgsql AS $$
DECLARE
  v_claims jsonb;
BEGIN
  IF p_role NOT IN ('authenticated', 'anon', 'service_role') THEN
    RAISE EXCEPTION 'try_sql: unsupported role %', p_role;
  END IF;
  v_claims := CASE WHEN p_user IS NULL THEN jsonb_build_object('role', p_role)
                   ELSE tenant_test.claims(p_user, p_style) || jsonb_build_object('role', p_role) END;
  BEGIN
    PERFORM set_config('request.jwt.claims', v_claims::text, true);
    EXECUTE format('SET LOCAL ROLE %I', p_role);
    EXECUTE p_sql INTO result;
    IF p_rollback THEN
      RAISE EXCEPTION USING ERRCODE = 'TT001', MESSAGE = COALESCE(result, '<null>');
    END IF;
    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claims', '', true);
  EXCEPTION
    WHEN SQLSTATE 'TT001' THEN   -- role and claims are reverted with the subtransaction
      ok := true; state := '00000'; msg := 'rolled back'; result := NULLIF(SQLERRM, '<null>');
      RETURN;
    WHEN OTHERS THEN
      ok := false; state := SQLSTATE; msg := SQLERRM; result := NULL;
      RETURN;
  END;
  ok := true; state := '00000'; msg := NULL;
END $$;

-- try_sql for test user p_actor, logged to tenant_test.activity
CREATE FUNCTION tenant_test.act(
  p_step text, p_actor int, p_style text, p_table text, p_kind text, p_expected text, p_sql text)
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  r record;
BEGIN
  SELECT * INTO r FROM tenant_test.try_sql('authenticated', tenant_test.uid(p_actor), p_style, p_sql);
  INSERT INTO tenant_test.activity (step, actor, table_name, row_id, kind, expected, outcome, sqlstate, message, result)
  VALUES (p_step, p_actor, p_table,
          CASE WHEN r.ok AND r.result ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN r.result::uuid END,
          p_kind, p_expected, CASE WHEN r.ok THEN 'ok' ELSE 'error' END, r.state, r.msg, r.result);
  RETURN CASE WHEN r.ok THEN 'ok ' || COALESCE(r.result, '') ELSE 'error ' || r.state || ' ' || r.msg END;
END $$;

-- ---------------------------------------------------------------------------
-- RLS visibility: what each user sees through RLS vs. what they should see
-- p_model: 'user_id' -> rows with tenant_id = user id (pre-migration model)
--          'company' -> rows with tenant_id = company id (post-migration model;
--                       expected for every token style, because
--                       app_tenant_id() reads the tenant from the database)
-- ---------------------------------------------------------------------------
CREATE FUNCTION tenant_test.rls_check(p_stage text, p_style text, p_model text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  u record;
  t text;
  v_expected_tenant uuid;
  v_expected bigint;
  r record;
BEGIN
  FOR u IN
    SELECT tu.n, tu.user_id FROM tenant_test.test_users tu
    JOIN auth.users au ON au.id = tu.user_id
    ORDER BY tu.n
  LOOP
    v_expected_tenant := CASE p_model
      WHEN 'user_id' THEN u.user_id
      WHEN 'company' THEN tenant_test.company_of(u.n)
    END;
    IF v_expected_tenant IS NULL THEN
      RAISE EXCEPTION 'rls_check: unknown model % or no company for u%', p_model, u.n;
    END IF;

    FOR t IN SELECT tenant_test.tables() LOOP
      EXECUTE format('SELECT count(*) FROM public.%I WHERE tenant_id = $1', t) INTO v_expected USING v_expected_tenant;
      SELECT * INTO r FROM tenant_test.try_sql('authenticated', u.user_id, p_style, format('SELECT count(*) FROM public.%I', t));
      PERFORM tenant_test.check(p_stage,
        format('rls[%s/%s] u%s %s', p_style, p_model, u.n, t),
        r.ok AND r.result::bigint = v_expected,
        format('visible=%s expected=%s %s', COALESCE(r.result, 'ERR'), v_expected, COALESCE(r.state || ' ' || r.msg, '')));
    END LOOP;

    -- tenants: only the user's own company row
    SELECT count(*) INTO v_expected FROM public.tenants WHERE owner_user_id = u.user_id;
    SELECT * INTO r FROM tenant_test.try_sql('authenticated', u.user_id, p_style, 'SELECT count(*) FROM public.tenants');
    PERFORM tenant_test.check(p_stage, format('rls[%s/%s] u%s tenants', p_style, p_model, u.n),
      r.ok AND r.result::bigint = v_expected,
      format('visible=%s expected=%s', COALESCE(r.result, 'ERR'), v_expected));
  END LOOP;
END $$;
