# OAuth Fix Implementation Checklist

## Quick Fix (Minimum to Get Working)

### Step 1: Verify Database Schema
- [ ] Run `sql/verify_oauth_setup.sql` in Supabase SQL Editor
- [ ] Confirm tables are in `orchestrator` schema (not `public`)
- [ ] Verify user `b4004bf7-9b69-47e5-8032-c0f39c654a61` exists
- [ ] Check OAuth migration has been applied (columns exist)

### Step 2: Update Environment Variables
Add to `.env.local`:
```bash
# Make sure this is the SERVICE ROLE key, not anon key
SUPABASE_SERVICE_KEY=eyJ...

# Debug mode for detailed logging
DEBUG_OAUTH=true
```

### Step 3: Deploy Fixed Callback Route
- [ ] Backup current `route.ts`
- [ ] Copy `route.ts.fixed` to `route.ts`
- [ ] Deploy to Vercel

### Step 4: Test OAuth Flow
- [ ] Navigate to `/settings`
- [ ] Click "Connect Google Calendar"
- [ ] Complete Google OAuth
- [ ] Check Vercel logs for any errors
- [ ] Verify success redirect

### Step 5: If Still Failing
- [ ] Replace `route.ts` with `route.ts.debug`
- [ ] Run OAuth flow again
- [ ] Check detailed logs in Vercel
- [ ] Fix specific issue identified
- [ ] Revert to `route.ts.fixed`

---

## Security Hardening (After It's Working)

### Step 6: Enable Token Encryption
- [ ] Generate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Add `TOKEN_ENCRYPTION_SECRET` to environment variables
- [ ] Run SQL to add encrypted columns
- [ ] Update callback to use encryption functions
- [ ] Migrate existing tokens to encrypted format
- [ ] Remove plain text columns (after verification)

### Step 7: Improve Error Handling
- [ ] Add error tracking (Sentry/DataDog)
- [ ] Set up alerts for OAuth failures
- [ ] Monitor token expiration rates

---

## Common Issues & Solutions

### Issue: "db_error" with no details
**Cause:** Insufficient error logging
**Fix:** Use `route.ts.debug` to capture detailed error

### Issue: "relation 'calendars' does not exist"
**Cause:** Schema mismatch - using `public` instead of `orchestrator`
**Fix:** Add `db: { schema: 'orchestrator' }` to Supabase client config

### Issue: "violates row-level security policy"
**Cause:** Service role key not working or session leaking
**Fix:** 
1. Verify `SUPABASE_SERVICE_KEY` is correct
2. Add `auth: { persistSession: false }` to client config
3. Don't use `@supabase/ssr` for service role operations

### Issue: "insert or update on table 'calendars' violates foreign key constraint"
**Cause:** Hardcoded user ID doesn't exist
**Fix:** Create the user or use the correct user ID from session

### Issue: "duplicate key value violates unique constraint"
**Cause:** `onConflict` clause doesn't match actual constraint
**Fix:** Verify unique constraint in database, update `onConflict` clause

---

## Files Reference

| File | Purpose |
|------|---------|
| `OAUTH_FIX_RESEARCH.md` | Full research and diagnostic plan |
| `route.ts.fixed` | Fixed callback route with proper schema and logging |
| `route.ts.debug` | Ultra-detailed debug version |
| `sql/verify_oauth_setup.sql` | SQL queries to verify database setup |
| `src/lib/encrypt-tokens.ts` | Token encryption utilities |
| `IMPLEMENTATION_CHECKLIST.md` | This file |

---

## Testing Commands

```bash
# Local testing
curl http://localhost:3000/api/auth/callback/google?code=test

# Check environment variables
node -e "console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Missing')"
```

---

## Rollback Plan

If the fix causes issues:

1. Restore original `route.ts` from backup
2. Remove `DEBUG_OAUTH` environment variable
3. Redeploy
4. Contact support with error logs

---

## Success Criteria

- [ ] OAuth flow completes without `?error=db_error`
- [ ] Calendar tokens are stored in database
- [ ] Events sync successfully
- [ ] Webhooks are set up (optional)
- [ ] Tokens are encrypted (security hardening)
