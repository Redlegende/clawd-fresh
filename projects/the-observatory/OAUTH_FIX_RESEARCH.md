# Google Calendar OAuth Fix - Diagnostic Plan

## Executive Summary

Based on deep research, the `?error=db_error` issue in the Observatory app's Google Calendar OAuth callback has **multiple root causes** related to schema configuration, RLS bypass issues, and potential unique constraint violations.

---

## 🔍 Root Cause Analysis

### 1. **SCHEMA MISMATCH (CRITICAL)**
**Problem:** The database schema uses the `orchestrator` schema, but the OAuth callback is using a Supabase client that defaults to `public` schema.

**Evidence:**
- Schema file shows all tables in `orchestrator` schema: `orchestrator.calendars`, `orchestrator.events`
- Callback route creates client without specifying schema: `createClient(url, key)` defaults to `public`
- This means the upsert is trying to write to `public.calendars` which likely doesn't exist

### 2. **RLS Bypass Not Working Properly**
**Problem:** The service_role key should bypass RLS, but there are common pitfalls:

From Supabase docs: "A Supabase client with the Authorization header set to the service role API key will ALWAYS bypass RLS. By default the Authorization header is the apikey used in createClient."

**Common issues:**
- Using `@supabase/ssr` client for service role (shares session cookies)
- Not explicitly setting the Authorization header
- User session leaking into the service client

### 3. **Unique Constraint Violation**
**Problem:** The `calendars` table has a unique constraint:
```sql
UNIQUE(user_id, provider, external_id)
```

The callback uses:
```typescript
onConflict: 'user_id,provider,external_id'
```

If any of these columns are NULL or the constraint doesn't exist exactly as named, the upsert will fail.

### 4. **Hardcoded User ID**
**Problem:** The callback uses a hardcoded user ID:
```typescript
user_id: 'b4004bf7-9b69-47e5-8032-c0f39c654a61'
```

If this user doesn't exist in the `orchestrator.users` table (foreign key constraint), the insert will fail.

### 5. **Missing Columns in Upsert**
The callback references columns that may not exist:
- `provider_account_id` - added in migration ✓
- `sync_enabled` - added in migration ✓
- `is_primary` - may not exist (schema shows `is_primary` was in earlier definition but full_schema.sql shows different structure)

---

## 📋 Diagnostic Checklist

### Step 1: Verify Schema Setup
```bash
# Connect to Supabase and verify:
1. What schema are the calendars/events tables in?
2. Does the unique constraint exist on calendars?
3. Does the hardcoded user_id exist in orchestrator.users?
```

### Step 2: Add Detailed Logging
The current error logging is insufficient. We need to capture:
- The exact error message from Supabase
- The data being sent
- Schema validation errors

### Step 3: Verify Environment Variables
```bash
# Check these are set correctly:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
```

---

## 🛠️ Required Code Changes

### 1. Fix Schema Configuration
The Supabase client MUST specify the `orchestrator` schema:

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: {
      schema: 'orchestrator'  // CRITICAL: Use orchestrator schema
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false  // Prevent session persistence for service role
    }
  }
);
```

### 2. Add Comprehensive Error Logging
See the updated callback route in `route.ts.fixed` for detailed error capture.

### 3. Fix Service Role Client Initialization
Service role clients should NEVER share sessions with user clients:

```typescript
// WRONG: Using SSR client for service role
const supabase = createServerClient(url, serviceKey, {...})

// CORRECT: Using base supabase-js client
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
```

### 4. Validate User Exists
Before upserting, verify the user exists:

```typescript
const { data: userExists } = await supabase
  .from('users')
  .select('id')
  .eq('id', userId)
  .single();

if (!userExists) {
  throw new Error(`User ${userId} does not exist in database`);
}
```

### 5. Fix Column Names
Ensure all columns in the upsert match the actual schema:
- Remove `is_primary` if it doesn't exist
- Verify all column names match exactly

---

## 🧪 Step-by-Step Testing Procedure

### Phase 1: Pre-Flight Checks

1. **Verify Database Schema:**
```sql
-- Run in Supabase SQL Editor
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name IN ('calendars', 'events', 'users');

-- Should show orchestrator.calendars, orchestrator.events, orchestrator.users
```

2. **Verify Unique Constraint:**
```sql
-- Check the unique constraint exists
SELECT conname, conkey 
FROM pg_constraint 
WHERE conrelid = 'orchestrator.calendars'::regclass 
AND contype = 'u';
```

3. **Verify User Exists:**
```sql
-- Check the hardcoded user exists
SELECT id, email FROM orchestrator.users 
WHERE id = 'b4004bf7-9b69-47e5-8032-c0f39c654a61';
```

4. **Test Service Role Access:**
```sql
-- Temporarily add this to verify service role works
-- The service role should be able to bypass RLS
```

### Phase 2: Deploy Updated Code

1. Deploy the updated callback route with detailed logging
2. Set environment variable: `DEBUG_OAUTH=true`

### Phase 3: Test OAuth Flow

1. Navigate to `/settings` and click "Connect Google Calendar"
2. Complete Google OAuth consent
3. Monitor logs for detailed error messages
4. Check for specific error in URL parameters

### Phase 4: Analyze Results

If error persists, check:
1. **Vercel logs** for detailed error messages
2. **Supabase Dashboard > Logs** for database errors
3. **Browser Network tab** for the callback response

---

## 🔐 Security Best Practices for OAuth Tokens

### Current Issues:
1. **Tokens stored in plain text** - Major security risk
2. **No encryption at rest** - Anyone with DB access can read tokens
3. **No token rotation tracking** - Can't detect token theft

### Recommended Approach:

1. **Encrypt tokens before storage:**
```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ENCRYPTION_KEY = scryptSync(
  process.env.TOKEN_ENCRYPTION_SECRET!,
  'salt',
  32
);

function encryptToken(token: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedToken: string): string {
  const [ivHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

2. **Use separate columns for encrypted storage:**
```sql
-- Add encrypted token columns
ALTER TABLE orchestrator.calendars 
ADD COLUMN access_token_encrypted TEXT,
ADD COLUMN refresh_token_encrypted TEXT;

-- Optionally remove plain text columns after migration
-- ALTER TABLE orchestrator.calendars DROP COLUMN access_token;
```

3. **Token rotation monitoring:**
```sql
-- Add columns for security tracking
ALTER TABLE orchestrator.calendars 
ADD COLUMN token_hash TEXT,  -- Store hash for comparison
ADD COLUMN token_created_at TIMESTAMPTZ,
ADD COLUMN token_last_rotated_at TIMESTAMPTZ;
```

---

## 📄 Files Provided

1. **`route.ts.fixed`** - Updated callback route with:
   - Schema configuration (`orchestrator`)
   - Detailed error logging
   - User validation
   - Better error messages

2. **`route.ts.debug`** - Ultra-detailed debug version for troubleshooting

3. **`test-oauth.sql`** - SQL queries for verifying database setup

4. **`encrypt-tokens.ts`** - Helper functions for token encryption

---

## 🚨 Immediate Action Items

1. [ ] Verify which schema the calendars table is in (orchestrator vs public)
2. [ ] Update the Supabase client to use the correct schema
3. [ ] Deploy the updated callback route with detailed logging
4. [ ] Run OAuth flow and capture detailed error
5. [ ] Fix any remaining schema/column mismatches
6. [ ] Implement token encryption for security

---

## References

- [Supabase Service Role Key RLS Bypass](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z)
- [Google OAuth Invalid Grant Error](https://nango.dev/blog/google-oauth-invalid-grant-token-has-been-expired-or-revoked)
- [Supabase Next.js OAuth Guide](https://engineering.teknasyon.com/next-js-with-supabase-google-login-step-by-step-guide-088ef06e0501)
- [Supabase SSR Best Practices](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
