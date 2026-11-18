-- LOCAL TEST DATABASE ONLY. T2 part 1, after the forward migration.
-- Run as supabase_admin: it switches to supabase_auth_admin, the role GoTrue
-- uses, so sign-up runs the real on_auth_user_created -> handle_new_user path
-- with live-equivalent privileges.
--   u17: signs up after the migration           -> rollback case C (app tenant removed)
--   u18: signs up, then edits user_metadata     -> rollback case C conflict (app tenant kept)
--   u12: existing user edits user_metadata.tenant_id to company 13 (tamper attempt)
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('tenant_test.local_marker') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: tenant_test.local_marker not found (this is not the local test database)';
  END IF;
  IF to_regprocedure('public.normalize_tenant_id()') IS NULL
     OR NOT EXISTS (SELECT 1 FROM tenant_test.fingerprint WHERE stage = 'T1') THEN
    RAISE EXCEPTION 'Run after the forward migration and 12_assert_t1.sql';
  END IF;
  IF EXISTS (SELECT 1 FROM tenant_test.test_users WHERE n > 16) THEN
    RAISE EXCEPTION 'T2 already ran on this database';
  END IF;
END $$;

-- Values computed before switching role (supabase_auth_admin cannot read tenant_test)
SELECT tenant_test.uid(17) AS u17, tenant_test.uid(18) AS u18, tenant_test.uid(12) AS u12,
       tenant_test.cid(13) AS c13, tenant_test.rid('tampered', 18) AS t18,
       extensions.crypt('Test-Password-17!', extensions.gen_salt('bf')) AS pw17,
       extensions.crypt('Test-Password-18!', extensions.gen_salt('bf')) AS pw18
\gset

INSERT INTO tenant_test.test_users (n, user_id, company_id, has_tenant_row, email, scenario) VALUES
  (17, :'u17', NULL, true, 'tenant-test-17@example.test', 'signup_after_migration'),
  (18, :'u18', NULL, true, 'tenant-test-18@example.test', 'signup_after_migration_then_meta_edit');

BEGIN;
SET LOCAL ROLE supabase_auth_admin;
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'u17', 'authenticated', 'authenticated',
   'tenant-test-17@example.test', :'pw17', now(),
   '{"provider": "email", "providers": ["email"]}', '{"name": "Test Kullanici 17", "email_verified": true}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', :'u18', 'authenticated', 'authenticated',
   'tenant-test-18@example.test', :'pw18', now(),
   '{"provider": "email", "providers": ["email"]}', '{"name": "Test Kullanici 18", "email_verified": true}',
   now(), now(), '', '', '', '');
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), :'u17', :'u17', jsonb_build_object('sub', :'u17', 'email', 'tenant-test-17@example.test'), 'email', now(), now(), now()),
  (gen_random_uuid(), :'u18', :'u18', jsonb_build_object('sub', :'u18', 'email', 'tenant-test-18@example.test'), 'email', now(), now(), now());
COMMIT;

UPDATE tenant_test.test_users tu
SET company_id = t.id
FROM public.tenants t
WHERE t.owner_user_id = tu.user_id AND tu.n IN (17, 18);

INSERT INTO tenant_test.activity (step, actor, table_name, row_id, kind, expected, outcome, message)
SELECT 's01 sign-up after migration', tu.n, 'auth.users', tu.user_id, 'signup', 'ok',
       CASE WHEN tu.company_id IS NOT NULL
             AND u.raw_app_meta_data ->> 'tenant_id' = tu.company_id::text
             AND u.raw_user_meta_data ->> 'tenant_id' = tu.company_id::text
             AND u.raw_app_meta_data ->> 'provider' = 'email'
            THEN 'ok' ELSE 'error' END,
       format('company=%s app=%s user=%s', tu.company_id, u.raw_app_meta_data ->> 'tenant_id', u.raw_user_meta_data ->> 'tenant_id')
FROM tenant_test.test_users tu JOIN auth.users u ON u.id = tu.user_id
WHERE tu.n IN (17, 18);

-- user_metadata edits as GoTrue performs them for supabase.auth.updateUser()
BEGIN;
SET LOCAL ROLE supabase_auth_admin;
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('tenant_id', :'c13')
WHERE id = :'u12';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('tenant_id', :'t18')
WHERE id = :'u18';
COMMIT;

INSERT INTO tenant_test.activity (step, actor, table_name, row_id, kind, expected, outcome, message) VALUES
  ('m01 u12 sets user_metadata.tenant_id to company 13', 12, 'auth.users', :'u12', 'meta_change', 'ok', 'ok', NULL),
  ('m02 u18 sets user_metadata.tenant_id to an unknown id', 18, 'auth.users', :'u18', 'meta_change', 'ok', 'ok', NULL);

SELECT step, actor, outcome, message FROM tenant_test.activity ORDER BY id;
