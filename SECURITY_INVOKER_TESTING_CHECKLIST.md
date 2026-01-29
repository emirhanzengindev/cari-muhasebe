# Security Invoker Fix - Testing Checklist

## Pre-deployment Verification
- [ ] Confirm migration file is correct
- [ ] Verify rollback migration exists
- [ ] Check that test script is ready

## Deployment Steps
- [ ] Push migration to Supabase (via GitHub Actions or manual deployment)
- [ ] Verify migration ran successfully in Supabase logs
- [ ] Check that view was recreated with security_invoker=on

## Post-deployment Testing
- [ ] Run the test SQL script to verify security settings
- [ ] Test normal user access to current_account_balances view
- [ ] Verify RLS policies are properly enforced
- [ ] Test service role access still works (should bypass RLS)
- [ ] Check application functionality (dashboard, reports, etc.)

## Verification Queries
Run these queries in Supabase SQL editor:

1. **Check view security settings:**
```sql
SELECT 
    c.relname,
    (SELECT reloptions FROM pg_class WHERE oid = c.oid) AS reloptions
FROM pg_class c 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE n.nspname = 'public' AND c.relname = 'current_account_balances';
```

2. **Check underlying function security:**
```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'fn_current_account_balances';
```

3. **Test RLS enforcement:**
```sql
-- Set test JWT claims
SET LOCAL "request.jwt.claim.tenant_id" = 'some-tenant-id';
SET LOCAL "request.jwt.claim.sub" = 'some-user-id';

-- Query should respect RLS
SELECT COUNT(*) FROM current_account_balances;

-- Clean up
RESET "request.jwt.claim.tenant_id";
RESET "request.jwt.claim.sub";
```

## Rollback Procedure
If issues are found:
1. Run the rollback migration
2. Verify original behavior is restored
3. Investigate root cause of issues

## Expected Outcomes
- ✅ View runs with caller's privileges (SECURITY INVOKER)
- ✅ RLS policies are properly enforced for authenticated users
- ✅ Service role can still bypass RLS when needed
- ✅ Application continues to function normally
- ✅ No data access issues for legitimate users