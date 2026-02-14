# Observatory — Next Session Prompt

> **Copy-paste this to your next AI session to continue where we left off.**
> **Date:** 2026-02-08
> **Project:** `projects/the-observatory/`

---

## Context

The Observatory is Jakob's personal life command center — a Next.js 16 app with Supabase backend, deployed on Vercel. We just completed a **major restructure** of the app. All pages build and compile cleanly (`npx next build` passes with 0 errors).

**Read these files first:**
1. `AGENTS.md` — Workspace rules (you are Fred 🦅)
2. `projects/the-observatory/AI_GUIDE.md` — Full technical spec
3. `PROJECTS.md` — Project status
4. `TODO.md` — Active tasks

**Tech stack:** Next.js 16 (App Router), TypeScript, Supabase (Postgres), shadcn/ui, Tailwind CSS, Vercel hosting.

---

## What Was Just Completed (2026-02-08)

- ✅ **Kanban AI Queue** — New `ai_queue` column + recurring tasks (daily/weekly/monthly) + assigned_to (jakob/fred)
- ✅ **Calendar Page** — `/calendar` with monthly view, events from `events` table, task deadlines, day detail panel
- ✅ **Fitness Lab** — Manual "Sync Garmin" button, stale data warning, `/api/fitness/sync` endpoint
- ✅ **Finance** — Workplace tabs (Fåvang Varetaxi / Treffen / Kvitfjellhytter / Other), Add Entry modal with rate auto-fill
- ✅ **Research** — Real data from Supabase `projects` + `research_notes` tables (replaced mock data)
- ✅ **Sidebar** — Calendar link added
- ✅ **DB Migration** — Added `assigned_to`, `is_recurring`, `recurrence_rule`, `recurrence_interval`, `last_run_at`, `next_run_at` to tasks table
- ✅ **Documentation** — AI_GUIDE.md, PROJECTS.md, TODO.md, MEMORY.md all updated

---

## What Needs To Be Done Next

### 1. 🚀 Deploy to Vercel (HIGH)
The changes are only local. Deploy to Vercel so the live site is updated.
```bash
cd projects/the-observatory
npx vercel --prod
```
Or push to git and let Vercel auto-deploy if connected.

### 2. 🏋️ Fix Garmin Sync — Run Python Script (HIGH)
Last fitness data is from **Feb 3** (5 days stale). The Garmin sync is a Python script:
```bash
cd projects/the-observatory/garmin-skill
source venv/bin/activate
python daily_sync.py
```
This fetches data from Garmin Connect and saves to JSON. After that, the data needs to be uploaded to the `fitness_metrics` Supabase table. Check `fetch_and_upload.py` for the upload logic.

**Note:** May need MFA/token refresh. Check `.garmin_tokens.json` for saved OAuth tokens.

### 3. 📅 Fix Google Calendar OAuth (HIGH)
The Calendar page exists but has no events because Google Calendar OAuth is broken.
- Check `/api/auth/google` and `/api/auth/callback/google` routes
- The OAuth callback URL may need updating in Google Cloud Console
- Environment variables needed: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- Once working, `/api/calendar/sync-all` will populate the `events` table

### 4. 📚 Populate research_notes Table (MEDIUM)
The Research page pulls from `research_notes` in Supabase but the table is likely empty. Need to:
- Create a script that indexes `.md` files from `research/` folder and project folders
- Insert rows with: `title`, `file_path`, `category`, `tags` (array), `summary`, `status`
- Could be a Fred task or a one-time migration

### 5. 🏠 Kvitfjellhytter Finance Integration (MEDIUM)
The Finance page has a "Kvitfjellhytter" tab but it needs actual data. Jakob's business has a Supabase table with booking/revenue data. Tasks:
- Check what tables exist for Kvitfjellhytter in Supabase (likely `bookings`, `igms_properties`)
- Either pull revenue/earnings data into `finance_entries` OR create a dedicated business data section
- The Kvitfjellhytter dashboard is a separate project at a different Vercel URL

### 6. ⏰ Set Up Cron Jobs (MEDIUM)
The app has cron routes but they need to be scheduled:
- `/api/cron/morning-sync` — Daily at 8:00 AM (checks overdue tasks, creates notifications)
- Garmin daily sync — Should run daily to keep fitness data fresh
- Recurring tasks — Tasks with `is_recurring = true` need a cron to reset them

Vercel Cron can be configured in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/morning-sync", "schedule": "0 7 * * *" }
  ]
}
```

### 7. 💰 Finance: total_nok Auto-Calculation (LOW)
The Add Entry modal calculates the preview but the `total_nok` column might not auto-calculate on insert. Check if there's a Postgres trigger or if we need to add `total_nok: hours * rate_nok * mva_rate` to the insert.

### 8. 🎨 Nice-to-Have Improvements (LOW)
- **Fitness charts** — Add Recharts line charts for Body Battery, Sleep, HR trends
- **Calendar event creation** — Let Jakob add events directly from the calendar UI
- **Task detail from calendar** — Click a task deadline to open the task detail modal
- **Finance export** — CSV export of hour entries for invoicing
- **Research note viewer** — Render markdown content inline when clicking a note

---

## Supabase Project Info

Use Supabase MCP tools (`mcp0_list_tables`, `mcp0_execute_sql`) to check the database. Key tables:
- `tasks` — Kanban tasks (has new AI/recurring columns)
- `projects` — Active projects
- `events` — Calendar events (from Google Calendar sync)
- `fitness_metrics` — Garmin data (date, body_battery, vo2_max, sleep_score, etc.)
- `finance_entries` — Hours worked (date, source, hours, rate_nok, total_nok, etc.)
- `research_notes` — Research knowledge base
- `fred_notifications` — Fred's notification inbox

---

## Key Files Modified

| File | What Changed |
|------|-------------|
| `src/components/kanban/KanbanBoard.tsx` | AI Queue column, Task type with recurring fields, Bot/Repeat icons |
| `src/components/kanban/TaskDetailModal.tsx` | ai_queue status, assigned_to field |
| `src/components/kanban/TaskModal.tsx` | AI assignment, recurring task options in create modal |
| `src/components/layout/Sidebar.tsx` | Added Calendar link |
| `src/app/calendar/page.tsx` | **NEW** — Full calendar page |
| `src/app/fitness/page.tsx` | Rebuilt as client component with sync button |
| `src/app/finance/page.tsx` | Rebuilt with workplace tabs + add entry modal |
| `src/app/research/page.tsx` | Rebuilt with real Supabase data |
| `src/app/api/fitness/sync/route.ts` | **NEW** — Fitness sync status + request endpoint |

---

## Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
```

---

**Priority order:** Deploy → Garmin Sync → Google Calendar OAuth → Populate research_notes → Cron jobs → Polish
