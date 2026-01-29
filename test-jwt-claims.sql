-- Test SQL to check current JWT claims in database session
SELECT 
  current_setting('request.jwt.claim.tenant_id', true) AS tenant_id,
  current_setting('request.jwt.claim.sub', true) AS user_id,
  current_user,
  session_user;

-- Test current_accounts RLS policies
SELECT 
  polname,
  polcmd,
  pg_get_expr(polqual, polrelid) AS using_clause,
  pg_get_expr(polwithcheck, polrelid) AS with_check_clause
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'current_accounts';