# RLS Troubleshooting Guide

This document provides troubleshooting steps for resolving "permission denied" errors related to RLS (Row Level Security) in the multi-tenant application.

## Common Issues and Solutions

### 1. RLS Not Enabled on Tables

**Problem**: Even though policies are created, you still get "permission denied" errors.

**Cause**: RLS must be explicitly enabled on each table using `ENABLE ROW LEVEL SECURITY`.

**Solution**: Ensure the following commands have been executed:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
```

### 2. Auth Session Missing

**Problem**: AuthSessionMissingError occurs when trying to access protected resources.

**Cause**: The Supabase authentication session is not properly passed from frontend to backend.

**Solution**: Verify that your server-side Supabase client is properly configured:

```javascript
// In lib/supabaseServer.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error)
          }
        },
      },
    }
  )

  return supabase
}
```

### 3. JWT Token Not Passed Correctly

**Problem**: Tenant ID cannot be extracted from JWT claims.

**Cause**: The JWT token containing tenant information is not properly included in requests.

**Solution**: Ensure that frontend requests include credentials:

```javascript
// When making API requests from frontend
const response = await fetch('/api/products', {
  credentials: 'include',  // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### 4. Policy Verification

**To verify that RLS policies are working correctly**, you can test directly in the Supabase SQL editor:

```sql
-- Test by setting a mock JWT claim
BEGIN;
SET LOCAL request.jwt.claims = '{"tenant_id": "58ffa03b-51ca-419d-a923-e99bef8fb99c"}';
SELECT * FROM products LIMIT 5;
COMMIT;
```

If this query returns results, your RLS policies are working correctly.

### 5. Checking Current RLS Status

To check if RLS is enabled on your tables, run this query in the Supabase SQL editor:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('products', 'stock_movements', 'categories', 'warehouses');
```

The `rowsecurity` column should show `true` for tables where RLS is enabled.

### 6. Verifying Active Policies

To see all active policies on your tables:

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('products', 'stock_movements', 'categories', 'warehouses');
```

## Debugging Steps

1. First, ensure RLS is enabled on all relevant tables
2. Verify that policies exist and are correctly configured
3. Check that your Supabase server client properly handles cookies
4. Confirm that frontend requests include credentials
5. Test policy functionality with mock JWT claims
6. Monitor application logs for auth-related errors
7. **Verify that user metadata contains tenant_id**: Check that when users sign up/log in, the tenant_id is properly stored in user.user_metadata.tenant_id in the Supabase Auth system