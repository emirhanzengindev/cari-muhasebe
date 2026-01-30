# PowerShell script to verify database RLS fixes
# Run this in PowerShell to check if the fixes are applied

# First, let's check if we can access the database
Write-Host "Checking database connection..." -ForegroundColor Yellow

# Test 1: Check if user metadata has tenant_id
Write-Host "`n1. Checking user metadata..." -ForegroundColor Cyan
$checkMetadataQuery = @"
SELECT 
    id,
    email,
    raw_app_meta_data->>'tenant_id' as tenant_id
FROM auth.users 
WHERE email = 'emiir1230@gmail.com'
LIMIT 1;
"@

Write-Host "Query to run in Supabase SQL Editor:" -ForegroundColor Green
Write-Host $checkMetadataQuery -ForegroundColor White

# Test 2: Check RLS policies
Write-Host "`n2. Checking RLS policies..." -ForegroundColor Cyan
$checkPoliciesQuery = @"
SELECT pol.polname AS policy_name,
       pol.polcmd AS command,
       pg_get_policydef(pol.oid) as policy_def
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'current_accounts';
"@

Write-Host "Query to run in Supabase SQL Editor:" -ForegroundColor Green
Write-Host $checkPoliciesQuery -ForegroundColor White

# Test 3: Check function get_jwt_tenant
Write-Host "`n3. Checking get_jwt_tenant function..." -ForegroundColor Cyan
$checkFunctionQuery = @"
SELECT 
    n.nspname as schema, 
    p.proname as function_name, 
    pg_get_functiondef(p.oid) as definition, 
    r.rolname as owner,
    p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_roles r ON p.proowner = r.oid
WHERE n.nspname = 'public' AND p.proname = 'get_jwt_tenant';
"@

Write-Host "Query to run in Supabase SQL Editor:" -ForegroundColor Green
Write-Host $checkFunctionQuery -ForegroundColor White

Write-Host "`n📋 Instructions:" -ForegroundColor Yellow
Write-Host "1. Go to https://app.supabase.com/project/kpviipaqqzujirvbuhiw/sql" -ForegroundColor White
Write-Host "2. Run each of the above queries" -ForegroundColor White
Write-Host "3. Share the results with me" -ForegroundColor White

Write-Host "`nExpected Results:" -ForegroundColor Yellow
Write-Host "✅ User should have tenant_id in metadata matching their user ID" -ForegroundColor Green
Write-Host "✅ RLS policies should reference get_jwt_tenant() function" -ForegroundColor Green
Write-Host "✅ get_jwt_tenant() should be SECURITY DEFINER with postgres owner" -ForegroundColor Green