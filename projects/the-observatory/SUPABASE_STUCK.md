# The Observatory - Supabase Setup Status

**Date:** 2026-02-02  
**Status:** ⏳ STUCK - Need SQL execution help

## What's Done
- ✅ Dashboard deployed: https://observatory-dashboard-two.vercel.app
- ✅ Supabase project connected (vhrmxtolrrcrhrxljemp)
- ✅ Schema designed (schema.sql - 5 tables, indexes, RLS, views)
- ✅ Garmin skill ready (needs auth fix)

## What's Stuck
**Cannot execute schema.sql to create tables.**

### Attempted:
1. **Management API /database/query** - Works for single queries, fails for multi-statement schema
2. **REST API with service_role** - 405 error on DDL statements
3. **Python script with split statements** - Breaks on PL/pgSQL functions (semicolons inside $$ blocks)

### Root Cause
The SQL schema contains:
- `CREATE FUNCTION ... $$ ... END; $$` - Semicolons inside function bodies
- `CREATE TRIGGER` statements
- `CREATE POLICY` for RLS
- `CREATE VIEW` statements

My naive `split(';')` breaks these. Need proper SQL parsing or run as single transaction.

## Options to Fix

### Option A: SQL Editor via Browser (RECOMMENDED)
Open Supabase dashboard SQL Editor and paste schema.sql:
1. Visit: https://supabase.com/dashboard/project/vhrmxtolrrcrhrxljemp/sql
2. Paste contents of `projects/the-observatory/schema.sql`
3. Click "Run"

### Option B: Single Query via API
Try sending entire schema as one string (untested):
```bash
curl -X POST "https://api.supabase.com/v1/projects/vhrmxtolrrcrhrxljemp/database/query" \
  -H "Authorization: Bearer sbp_2b1f19d25ca514fb6bc03e77ec225c682e836d66" \
  -d "{\"query\": \"$(cat schema.sql | sed 's/\\"/\\\\\\"/g')\"}"
```

### Option C: psql with Connection String
Get DB password from Supabase dashboard → Database → Connection string → URI tab:
```bash
psql "postgresql://postgres.vhrmxtolrrcrhrxljemp:[PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres" -f schema.sql
```

## Credentials Available
- **Management Token:** `sbp_2b1f19d25ca514fb6bc03e77ec225c682e836d66` (in .project-automation.env)
- **Project Ref:** `vhrmxtolrrcrhrxljemp`
- **Service Role Key:** Available via API (see create_tables.py output)

## Next Steps After Tables
1. **Populate tables** with projects/tasks from TODO.md + PROJECTS.md
2. **Connect frontend** to Supabase (update lib/supabase.ts with correct keys)
3. **Build Kanban UI** - fetch from tasks table, implement drag-and-drop
4. **Fix Garmin auth** - password may be wrong or needs MFA handling

## Files
- `projects/the-observatory/schema.sql` - Complete schema
- `projects/the-observatory/create_tables.py` - Failed Python attempt
- `projects/the-observatory/create-tables.js` - Node attempt (needs password)
- `.project-automation.env` - Supabase token

---
**Jakob's Garmin credentials:** kontakt@kvitfjellhytter.no / gladiator12! (auth failing, may need MFA or password reset)
