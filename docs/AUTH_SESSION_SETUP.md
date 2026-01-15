# Authentication Session Setup Guide

This document explains how to properly set up authentication session handling between frontend and backend in the multi-tenant application.

## Problem Statement

Despite having a valid authenticated session on the frontend, API routes return 401 errors with "Tenant ID missing from JWT" because the backend cannot extract the JWT claims from cookies.

## Root Cause

The issue occurs when the Supabase SSR client cannot properly read the authentication session from cookies sent by the frontend. This creates a disconnect between frontend authentication and backend authorization.

## Solution

### 1. Frontend-Backend Session Synchronization

The frontend and backend must share the authentication session through cookies:

**Frontend Configuration:**
```typescript
// Frontend requests must include credentials
const response = await fetch('/api/products', {
  credentials: 'include',  // Critical: enables cookie sharing
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Backend Configuration:**
```typescript
// lib/supabaseServer.ts - Proper cookie handling
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
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
}
```

### 2. JWT Claim Extraction

The backend must extract tenant ID from JWT claims in the session:

```typescript
export async function getTenantIdFromJWT() {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.error('SUPABASE AUTH ERROR:', error)
    return null
  }

  // Extract tenant_id from user metadata
  let tenantId = user.user_metadata?.tenant_id
  
  // Clean tenant ID if it has unwanted suffix
  if (tenantId && typeof tenantId === 'string') {
    if (tenantId.endsWith('ENANT_ID')) {
      tenantId = tenantId.replace(/ENANT_ID$/, '')
    }
  }

  if (!tenantId) {
    console.error('TENANT ID MISSING IN USER METADATA')
    return null
  }
  
  return tenantId
}
```

### 3. Database RLS Configuration

**CRITICAL**: The database must have RLS policies configured to read tenant_id from JWT claims:

```sql
-- Enable RLS on all tenant-aware tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Create policies that read tenant_id from JWT claims
CREATE POLICY "Tenant can select own products"
ON products
FOR SELECT
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Tenant can insert own products" 
ON products
FOR INSERT
WITH CHECK (tenant_id::text = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Tenant can update own products"
ON products
FOR UPDATE
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Tenant can delete own products"
ON products
FOR DELETE
USING (tenant_id::text = auth.jwt() ->> 'tenant_id');
```

### 4. Verification Steps

To verify the setup is working:

1. **Check cookie presence**: Ensure frontend has valid Supabase auth cookies
2. **Test JWT extraction**: Verify that `getTenantIdFromJWT()` returns the correct tenant ID
3. **Validate RLS**: Confirm RLS policies are properly configured in the database
4. **Monitor logs**: Check for session-related errors in both frontend and backend

## Common Issues

### Issue: "AuthSessionMissingError" in API routes
**Cause**: SSR client not properly configured to read cookies
**Solution**: Ensure cookie handlers are properly implemented in `createServerSupabaseClient()`

### Issue: "Tenant ID missing from JWT"
**Cause**: JWT token doesn't contain tenant_id claim or RLS policies not configured
**Solution**: Verify tenant_id is stored in user.user_metadata during signup and RLS policies read from JWT claims

### Issue: Frontend has tenant ID but backend doesn't
**Cause**: Session not properly shared between frontend and backend
**Solution**: Ensure all frontend requests include `credentials: 'include'`