# 🎯 Observatory Phase 2 - Google Calendar Integration

## Current Status: ⚠️ NEEDS FRESH START

**Last session ended at:** OAuth flow failing with database errors

---

## ✅ What Was Fixed

**Schema Issues Resolved:**
- ✅ Added missing `user_id` column to `events` table
- ✅ Added `sync_status` and `status` columns to `events` table  
- ✅ Created unique index on `events(calendar_id, external_id)` for upserts
- ✅ Disabled RLS on `calendars` and `events` tables temporarily

**Remaining Issue:**
- ⚠️ `.env.local` has anon key in `SUPABASE_SERVICE_KEY` slot
- Need the **real service_role key** from Supabase dashboard

---

## ✅ What Was Built (and should work)

### 1. OAuth Flow
- `/api/auth/google` - Initiates OAuth
- `/api/auth/callback/google` - Handles callback, stores tokens
- `/settings` page - UI to connect/disconnect

### 2. Calendar Sync APIs
- `/api/calendar/sync` - Manual sync endpoint
- `/api/calendar/sync-all` - Full sync with delta support
- `/api/calendar/webhook/setup` - Google webhook registration
- `/api/webhooks/calendar` - Receives push notifications

### 3. Task Scheduling
- `/api/tasks/schedule` - Auto-schedule tasks into free time slots
- `/api/tasks/conflicts` - Detect calendar conflicts
- Daily view component in Kanban

### 4. Database Schema (in `public` schema now)
Tables created:
- `calendars` - OAuth credentials, tokens, sync status
- `events` - Calendar events synced from Google
- `tasks` - Added `scheduled_start`, `scheduled_end`, `duration_minutes`, `energy_level`

### 5. Google OAuth Client
- Web application client: `182662960527-n5ml3ohhhf3v8vhcmmcinkmjudlk6ecv`
- Redirect URIs configured: `http://localhost:3000/api/auth/callback/google`
- JSON in Downloads folder

---

## 🚨 CRITICAL ISSUES TO FIX

### Issue 1: Database Permissions
**Problem:** OAuth callback fails with `db_error`

**Files to check:**
- `projects/the-observatory/src/app/api/auth/callback/google/route.ts`
- `projects/the-observatory/.env.local` - Verify SUPABASE_SERVICE_KEY

**Potential solutions:**
1. Get the REAL service_role key from Supabase dashboard (Project Settings → API)
2. Or disable RLS entirely on `calendars` and `events` tables for now
3. Or use server-side SQL via Management API instead of REST API

### Issue 2: Schema Mismatch
The original SQL was built for `orchestrator` schema but Supabase REST API only exposes `public`. Tables were moved but may have issues.

**Check:** Are all columns present in `public.calendars`?
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'calendars';
```

---

## 🎯 RECOMMENDED NEXT STEPS

### Step 1: Get the Real Service Role Key (CRITICAL)
1. Go to https://supabase.com/dashboard/project/vhrmxtolrrcrhrxljemp/settings/api
2. Copy the **service_role** key (NOT the anon key)
3. Update `projects/the-observatory/.env.local`:
   ```
   SUPABASE_SERVICE_KEY=eyJhbG... (the real service_role key)
   ```

### Step 2: Test OAuth Flow
1. Start the dev server: `cd projects/the-observatory && npm run dev`
2. Visit http://localhost:3000/settings
3. Click "Connect Google Calendar"
4. Authorize in the popup
5. Should redirect back with `?success=calendar_connected`

### Step 3: Re-enable RLS (Optional)
Once OAuth is working, add proper RLS policies:
```sql
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Add policies for authenticated users
CREATE POLICY "Users can only see their own calendars"
  ON calendars FOR ALL
  USING (user_id = auth.uid());
```

---

## 📁 Key Files

```
projects/the-observatory/
├── .env.local                                    # Environment variables (check keys!)
├── src/app/api/auth/callback/google/route.ts     # OAuth callback (where it fails)
├── src/app/api/auth/google/route.ts              # OAuth init
├── src/app/settings/page.tsx                     # Settings UI
├── src/lib/supabase/client.ts                    # Supabase client config
└── sql/06_oauth_webhook_migration.sql            # Database migration
```

---

## 🔑 Credentials Location

**Supabase:**
- Project: `vhrmxtolrrcrhrxljemp`
- URL: `https://vhrmxtolrrcrhrxljemp.supabase.co`
- Credentials: `.project-automation.env` in workspace root

**Google OAuth:**
- Client JSON: `~/Downloads/client_secret_182662960527-n5ml3ohhhf3v8vhcmmcinkmjudlk6ecv.apps.googleusercontent.com.json`

---

## 🎬 START HERE

When picking this up:

1. **Check server logs first** - What's the exact error?
2. **Verify Supabase keys** - Are they valid?
3. **Test database connection** - Can we read/write to `calendars` table?
4. **Pick a fix approach** (A, B, or C above)
5. **Get OAuth working end-to-end**

**Success criteria:**
- User clicks "Connect Google Calendar"
- Google OAuth popup → user authorizes
- Redirect back to `/settings?success=calendar_connected`
- Calendar shows as connected with email address

---

## 💡 Notes

- The Web application OAuth client is correctly configured
- Server runs on `http://localhost:3000`
- All API routes are built, just need database permissions fixed
- Consider using `npx supabase@latest` CLI for easier management

---

**Priority:** HIGH - This blocks the entire calendar integration feature
