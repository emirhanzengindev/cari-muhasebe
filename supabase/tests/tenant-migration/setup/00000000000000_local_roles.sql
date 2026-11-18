-- LOCAL TEST DATABASE ONLY (copied into the separate test project by prepare_local.ps1).
-- Roles that exist on live but not in a fresh local Supabase. The schema dump
-- may GRANT to them, so they must exist before the dump is restored.
-- Live (read-only check, 2026-11-18): app_backend_role NOLOGIN, NOBYPASSRLS,
-- NOSUPERUSER; postgres is a member WITH ADMIN OPTION (it created the role).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_backend_role') THEN
    CREATE ROLE app_backend_role NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;

-- The restore must reproduce the live ACLs exactly. pg_dump writes GRANT /
-- REVOKE relative to Postgres's built-in defaults (owner, plus PUBLIC EXECUTE
-- on functions). A fresh local Supabase, however, has
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public granting
-- everything to anon, authenticated and service_role, which would be added on
-- top of every restored object (seen in the first restore: anon could execute
-- app_tenant_id(), anon had full rights on categories, ...). Remove them here;
-- the dump's own ALTER DEFAULT PRIVILEGES lines at its end put the live
-- defaults back once all objects exist.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
