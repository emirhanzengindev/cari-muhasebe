-- LOCAL TEST DATABASE ONLY. Performance of three app_tenant_id() variants.
-- Run as supabase_admin. Everything is created inside one transaction and
-- ROLLED BACK at the end: no table, function or user remains.
--   live_old  : COALESCE(jwt.tenant_id, auth.uid())                (live today)
--   jwt_first : jwt.tenant_id, jwt.app_metadata.tenant_id, auth.users, uid   (previous draft)
--   db_first  : auth.users app_metadata, uid; NULL without user     (migration now)
-- Synthetic: 1000 users in auth.users, 10 000 rows per table, 100 tenants.
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL
     AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public') THEN
    RAISE EXCEPTION 'Refusing to run: not an empty local database and no tenant_test.local_marker';
  END IF;
END $$;

BEGIN;
SET LOCAL statement_timeout = '900s';
CREATE SCHEMA bench;
GRANT USAGE ON SCHEMA bench TO authenticated;

INSERT INTO auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
SELECT '00000000-0000-0000-0000-000000000000', md5('bench-user-' || i)::uuid, 'authenticated', 'authenticated',
       'bench-' || i || '@example.test',
       jsonb_build_object('provider', 'email', 'tenant_id', md5('bench-co-' || (i % 100 + 1))::text), '{}', now(), now()
FROM generate_series(1, 1000) i;

CREATE FUNCTION bench.live_old() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid());
$$;
CREATE FUNCTION bench.jwt_first() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid,
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid,
    (SELECT NULLIF(u.raw_app_meta_data ->> 'tenant_id', '')::uuid FROM auth.users u WHERE u.id = auth.uid()),
    auth.uid());
$$;
CREATE FUNCTION bench.db_first() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    ELSE COALESCE(
      (SELECT NULLIF(u.raw_app_meta_data ->> 'tenant_id', '')::uuid FROM auth.users u WHERE u.id = auth.uid()),
      auth.uid())
  END;
$$;
ALTER FUNCTION bench.live_old() OWNER TO postgres;
ALTER FUNCTION bench.jwt_first() OWNER TO postgres;
ALTER FUNCTION bench.db_first() OWNER TO postgres;

-- RLS tables: <function>_<direct|wrapped>; same data in each
DO $$
DECLARE
  f text;
  form text;
  t text;
BEGIN
  FOREACH f IN ARRAY ARRAY['live_old', 'jwt_first', 'db_first'] LOOP
    FOREACH form IN ARRAY ARRAY['direct', 'wrapped'] LOOP
      t := f || '_' || form;
      EXECUTE format('CREATE TABLE bench.%I (id bigint PRIMARY KEY, tenant_id uuid NOT NULL, payload text)', t);
      EXECUTE format($q$INSERT INTO bench.%I SELECT g, md5('bench-co-' || (g %% 100 + 1))::uuid, repeat('x', 40) FROM generate_series(1, 10000) g$q$, t);
      EXECUTE format('CREATE INDEX ON bench.%I (tenant_id)', t);
      EXECUTE format('ALTER TABLE bench.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('CREATE POLICY p ON bench.%I FOR SELECT TO authenticated USING (tenant_id = %s)', t,
                     CASE form WHEN 'direct' THEN format('bench.%I()', f) ELSE format('(SELECT bench.%I())', f) END);
      EXECUTE format('GRANT SELECT ON bench.%I TO authenticated', t);
      EXECUTE format('ANALYZE bench.%I', t);
      -- same table without the tenant_id index: the planner has to scan it
      -- sequentially, while auth.users keeps its primary key (no enable_* GUCs)
      EXECUTE format('CREATE TABLE bench.%I (LIKE bench.%I INCLUDING DEFAULTS)', t || '_noidx', t);
      EXECUTE format('INSERT INTO bench.%I SELECT * FROM bench.%I', t || '_noidx', t);
      EXECUTE format('ALTER TABLE bench.%I ENABLE ROW LEVEL SECURITY', t || '_noidx');
      EXECUTE format('CREATE POLICY p ON bench.%I FOR SELECT TO authenticated USING (tenant_id = %s)', t || '_noidx',
                     CASE form WHEN 'direct' THEN format('bench.%I()', f) ELSE format('(SELECT bench.%I())', f) END);
      EXECUTE format('GRANT SELECT ON bench.%I TO authenticated', t || '_noidx');
      EXECUTE format('ANALYZE bench.%I', t || '_noidx');
    END LOOP;
    -- CHECK tables (no RLS): pure constraint cost on INSERT
    EXECUTE format('CREATE TABLE bench.%I (id bigserial PRIMARY KEY, tenant_id uuid NOT NULL CHECK (tenant_id = bench.%I()), payload text)', 'chk_' || f, f);
    EXECUTE format('GRANT INSERT ON bench.%I TO authenticated', 'chk_' || f);
    EXECUTE format('GRANT USAGE ON SEQUENCE bench.%I TO authenticated', 'chk_' || f || '_id_seq');
  END LOOP;
  CREATE TABLE bench.chk_none (id bigserial PRIMARY KEY, tenant_id uuid NOT NULL, payload text);
  GRANT INSERT ON bench.chk_none TO authenticated;
  GRANT USAGE ON SEQUENCE bench.chk_none_id_seq TO authenticated;
END $$;

-- median of 3 runs after one warm-up; each result is printed at once
CREATE FUNCTION bench.run(p_label text, p_sql text, p_reps int DEFAULT 3)
RETURNS TABLE (label text, median_ms numeric, min_ms numeric, result text)
LANGUAGE plpgsql AS $$
DECLARE
  t0 timestamptz;
  ms numeric[] := '{}';
  r text;
BEGIN
  EXECUTE p_sql INTO r;
  FOR i IN 1..p_reps LOOP
    t0 := clock_timestamp();
    EXECUTE p_sql INTO r;
    ms := ms || (extract(epoch FROM clock_timestamp() - t0) * 1000)::numeric;
  END LOOP;
  RAISE NOTICE 'BENCH % | median % ms | min % ms | %', p_label,
    round((SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY x) FROM unnest(ms) x)::numeric, 3), round((SELECT min(x) FROM unnest(ms) x), 3), r;
  RETURN QUERY SELECT p_label,
    round((SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY x) FROM unnest(ms) x)::numeric, 3),
    round((SELECT min(x) FROM unnest(ms) x), 3), r;
END $$;
GRANT EXECUTE ON FUNCTION bench.run(text, text, int) TO authenticated;
CREATE TEMP TABLE bench_results (label text, median_ms numeric, min_ms numeric, result text);
GRANT INSERT, SELECT ON bench_results TO authenticated;

-- Act as user 1 with a fresh token (app_metadata carries tenant_id), as PostgREST does
SELECT set_config('request.jwt.claims', jsonb_build_object(
  'sub', md5('bench-user-1')::text, 'role', 'authenticated', 'aud', 'authenticated',
  'app_metadata', jsonb_build_object('provider', 'email', 'tenant_id', md5('bench-co-2')::text),
  'user_metadata', '{}'::jsonb)::text, true);
SET LOCAL ROLE authenticated;

-- 1. (removed) A per-call loop over generate_series is folded by the planner
--    into a one-time filter, so it does not measure per-call cost. Per-row
--    cost is read from section 3 (direct policy, sequential scan) and
--    section 4 (CHECK on every inserted row).

-- 2. RLS, planner's choice (index on tenant_id)
INSERT INTO bench_results SELECT * FROM bench.run('2 rls index   live_old  direct ', 'SELECT count(*)::text FROM bench.live_old_direct');
INSERT INTO bench_results SELECT * FROM bench.run('2 rls index   jwt_first direct ', 'SELECT count(*)::text FROM bench.jwt_first_direct');
INSERT INTO bench_results SELECT * FROM bench.run('2 rls index   db_first  direct ', 'SELECT count(*)::text FROM bench.db_first_direct');
INSERT INTO bench_results SELECT * FROM bench.run('2 rls index   db_first  wrapped', 'SELECT count(*)::text FROM bench.db_first_wrapped');

-- 3. RLS on a sequential scan (tables without a tenant_id index; small tables
--    and non-selective queries get this plan too)
INSERT INTO bench_results SELECT * FROM bench.run('3 rls seq10k  live_old  direct ', 'SELECT count(*)::text FROM bench.live_old_direct_noidx');
INSERT INTO bench_results SELECT * FROM bench.run('3 rls seq10k  live_old  wrapped', 'SELECT count(*)::text FROM bench.live_old_wrapped_noidx');
INSERT INTO bench_results SELECT * FROM bench.run('3 rls seq10k  jwt_first direct ', 'SELECT count(*)::text FROM bench.jwt_first_direct_noidx');
INSERT INTO bench_results SELECT * FROM bench.run('3 rls seq10k  jwt_first wrapped', 'SELECT count(*)::text FROM bench.jwt_first_wrapped_noidx');
INSERT INTO bench_results SELECT * FROM bench.run('3 rls seq10k  db_first  direct ', 'SELECT count(*)::text FROM bench.db_first_direct_noidx');
INSERT INTO bench_results SELECT * FROM bench.run('3 rls seq10k  db_first  wrapped', 'SELECT count(*)::text FROM bench.db_first_wrapped_noidx');

-- 4. CHECK constraint on a 2000-row INSERT (the import route's maximum)
INSERT INTO bench_results SELECT * FROM bench.run('4 check 2000 rows  none     ',
  $q$WITH x AS (INSERT INTO bench.chk_none (tenant_id, payload) SELECT md5('bench-co-2')::uuid, 'x' FROM generate_series(1, 2000) RETURNING 1) SELECT count(*)::text FROM x$q$);
INSERT INTO bench_results SELECT * FROM bench.run('4 check 2000 rows  jwt_first',
  $q$WITH x AS (INSERT INTO bench.chk_jwt_first (tenant_id, payload) SELECT md5('bench-co-2')::uuid, 'x' FROM generate_series(1, 2000) RETURNING 1) SELECT count(*)::text FROM x$q$);
INSERT INTO bench_results SELECT * FROM bench.run('4 check 2000 rows  db_first ',
  $q$WITH x AS (INSERT INTO bench.chk_db_first (tenant_id, payload) SELECT md5('bench-co-2')::uuid, 'x' FROM generate_series(1, 2000) RETURNING 1) SELECT count(*)::text FROM x$q$);

RESET ROLE;
\pset format aligned
SELECT label, median_ms, min_ms, result FROM bench_results ORDER BY label;

-- plan shapes for the record
SET LOCAL ROLE authenticated;
EXPLAIN (COSTS OFF) SELECT count(*) FROM bench.db_first_direct_noidx;
EXPLAIN (COSTS OFF) SELECT count(*) FROM bench.db_first_wrapped_noidx;
RESET ROLE;

ROLLBACK;
SELECT 'bench schema after rollback: ' || COALESCE(to_regnamespace('bench')::text, 'absent')
    || ', bench users left: ' || (SELECT count(*) FROM auth.users WHERE email LIKE 'bench-%@example.test') AS cleanup;
