-- READ-ONLY. Run the same text on live (approved read) and on the local test
-- database, then diff the two outputs (see compare_roles.ps1).
-- Role OIDs differ between environments, so everything is compared by name.
-- ACL arrays are sorted so the grant order does not create false differences.
WITH roles(rolname) AS (VALUES
  ('postgres'), ('anon'), ('authenticated'), ('service_role'), ('authenticator'),
  ('supabase_admin'), ('supabase_auth_admin'), ('dashboard_user'), ('pgbouncer'),
  ('supabase_storage_admin'), ('supabase_read_only_user')),
rels(relname) AS (VALUES
  ('categories'), ('invoices'), ('warehouses'), ('stock_movements'), ('current_accounts'),
  ('current_account_movements'), ('collection_invoice_matches'), ('transactions'),
  ('products'), ('invoice_items'), ('safes'), ('banks'), ('cheques'), ('tenants'), ('app_users')),
fns(sig) AS (VALUES
  ('public.app_tenant_id()'),
  ('public.handle_new_user()'),
  ('public.set_tenant_id_from_user()'),
  ('public.record_current_account_movement(uuid, text, numeric, integer, text, text, date, text, uuid, jsonb)'),
  ('public.delete_current_account_movement(uuid)'),
  ('public.record_current_account_movement(uuid, uuid, text, numeric, integer, date, text, text, uuid, jsonb)'),
  ('public.delete_current_account_movement(uuid, uuid)'),
  ('public.apply_stock_movement(uuid, integer, text, text, uuid, numeric)'),
  ('public.get_jwt_tenant()'))
SELECT section, obj, val FROM (
  SELECT '1 session' AS section, 'current_user' AS obj,
         current_user::text || ' super=' || (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS val
  UNION ALL
  SELECT '1 session', 'server_version_major', split_part(current_setting('server_version'), '.', 1)
  UNION ALL
  SELECT '2 role', r.rolname,
         CASE WHEN a.oid IS NULL THEN 'MISSING'
              ELSE format('super=%s inherit=%s createrole=%s createdb=%s login=%s repl=%s bypassrls=%s',
                          a.rolsuper, a.rolinherit, a.rolcreaterole, a.rolcreatedb,
                          a.rolcanlogin, a.rolreplication, a.rolbypassrls) END
  FROM roles r LEFT JOIN pg_roles a USING (rolname)
  UNION ALL
  SELECT '3 member_of', r.rolname,
         COALESCE((SELECT string_agg(g.rolname || CASE WHEN m.admin_option THEN '(admin)' ELSE '' END, ',' ORDER BY g.rolname)
                     FROM pg_roles a
                     JOIN pg_auth_members m ON m.member = a.oid
                     JOIN pg_roles g ON g.oid = m.roleid
                    WHERE a.rolname = r.rolname), '-')
  FROM roles r
  UNION ALL
  SELECT '4 priv', 'postgres',
         format('db_create=%s public_create=%s auth_usage=%s auth.users_select=%s auth.users_update=%s auth.users_trigger=%s',
                has_database_privilege('postgres', current_database(), 'CREATE'),
                has_schema_privilege('postgres', 'public', 'CREATE'),
                has_schema_privilege('postgres', 'auth', 'USAGE'),
                has_table_privilege('postgres', 'auth.users', 'SELECT'),
                has_table_privilege('postgres', 'auth.users', 'UPDATE'),
                has_table_privilege('postgres', 'auth.users', 'TRIGGER'))
  UNION ALL
  SELECT '4 priv', 'owners',
         format('schema public=%s schema auth=%s auth.users=%s',
                (SELECT nspowner::regrole FROM pg_namespace WHERE nspname = 'public'),
                (SELECT nspowner::regrole FROM pg_namespace WHERE nspname = 'auth'),
                (SELECT relowner::regrole FROM pg_class WHERE oid = 'auth.users'::regclass))
  UNION ALL
  SELECT '5 rel', x.relname,
         CASE WHEN c.oid IS NULL THEN 'MISSING'
              ELSE format('kind=%s owner=%s rls=%s force=%s acl=%s',
                          c.relkind, c.relowner::regrole, c.relrowsecurity, c.relforcerowsecurity,
                          COALESCE((SELECT string_agg(e, ' ' ORDER BY e) FROM unnest(c.relacl::text[]) e), 'default')) END
  FROM rels x
  LEFT JOIN pg_class c ON c.relname = x.relname AND c.relnamespace = 'public'::regnamespace
  UNION ALL
  SELECT '6 func', f.sig,
         CASE WHEN to_regprocedure(f.sig) IS NULL THEN 'MISSING'
              ELSE (SELECT format('owner=%s secdef=%s config=%s acl=%s',
                                  p.proowner::regrole, p.prosecdef, COALESCE(p.proconfig::text, '-'),
                                  COALESCE((SELECT string_agg(e, ' ' ORDER BY e) FROM unnest(p.proacl::text[]) e), 'default'))
                      FROM pg_proc p WHERE p.oid = to_regprocedure(f.sig)) END
  FROM fns f
  UNION ALL
  SELECT '7 default_acl', format('%s/%s/%s', d.defaclrole::regrole, COALESCE(n.nspname, '*'), d.defaclobjtype),
         (SELECT string_agg(e, ' ' ORDER BY e) FROM unnest(d.defaclacl::text[]) e)
  FROM pg_default_acl d
  LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
  WHERE n.nspname IS NULL OR n.nspname = 'public'
) q
ORDER BY section, obj;
