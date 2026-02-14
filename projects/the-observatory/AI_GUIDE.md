# 🌟 THE OBSERVATORY - Complete Specification & Guide for AI Developers

> **For:** The AI/LLM fixing and improving The Observatory  
> **Last Updated:** 2026-02-08 (Restructured)  
> **Written by:** Fred (Jakob's AI assistant)

---

## 📋 What is The Observatory?

**The Observatory** is Jakob's personal life command center — a centralized dashboard for tracking everything about his life, work, and goals.

### Core Philosophy
- **Mission Control** — See today's priorities at a glance
- **Data-Driven** — Track metrics over time to spot trends
- **Integration-First** — Connects to external services (Garmin, Google Calendar, etc.)
- **AI-Enhanced** — I (Fred) can read/write data to help Jakob stay organized

---

## 🎯 Goals & Purpose

### Primary Goals
1. **Replace scattered tracking** — Consolidate TODO.md, fitness data, finance tracking into one system
2. **Enable data-driven decisions** — Visualize trends in fitness, business, productivity
3. **Create an AI-friendly interface** — I can query tasks, add entries, mark things complete
4. **Be the "source of truth"** — One place for Jakob to see his entire life status

### What Jakob Wants to Track
| Category | Data Points |
|----------|-------------|
| **Fitness** | Garmin Epix Pro stats (VO2 Max, Body Battery, sleep, HRV), workout PRs, recovery metrics |
| **Business** | Kvitfjellhytter bookings/income, 3dje Boligsektor pipeline, hourly earnings |
| **Tasks/Projects** | Kanban board with drag-and-drop, priorities, due dates, project links |
| **Research** | Markdown notes viewer, searchable knowledge base |
| **Finance** | Hours worked (Fåvang Varetaxi, Treffen), invoicing status, monthly summaries |
| **Gut Health** | Daily protocol adherence (yogurt, bread, stock), symptom tracking |
| **Content** | YouTube ideas, scripts, publishing schedule |

---

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend:** Next.js 16 + React + TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Auth:** Supabase Auth (OAuth for Google Calendar)

### Database Schema (Supabase)
**Project ID:** `vhrmxtolrrcrhrxljemp`  
**Region:** eu-north-1  
**URL:** https://supabase.com/dashboard/project/vhrmxtolrrcrhrxljemp

#### Core Tables (in `public` schema):

```sql
-- 1. PROJECTS
-- Track all active projects and their health
projects (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) CHECK ('active', 'paused', 'completed', 'archived'),
  health_score INTEGER CHECK (0-100),
  priority INTEGER CHECK (1-10),
  folder_path VARCHAR(500),
  github_url VARCHAR(500),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  target_completion DATE,
  owner_id UUID REFERENCES auth.users(id)
)

-- 2. TASKS (Kanban)
-- All todos across projects
 tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) CHECK ('backlog', 'todo', 'in_progress', 'review', 'done'),
  priority VARCHAR(20) CHECK ('low', 'medium', 'high', 'urgent'),
  project_id UUID REFERENCES projects(id),
  assignee_id UUID REFERENCES auth.users(id),
  due_date DATE,
  estimated_hours DECIMAL(4,1),
  actual_hours DECIMAL(4,1),
  tags TEXT[],
  source VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP
)

-- 3. FITNESS_METRICS
-- Garmin data and health metrics
fitness_metrics (
  id UUID PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  -- Garmin metrics
  body_battery INTEGER CHECK (0-100),
  vo2_max DECIMAL(4,1),
  hrv DECIMAL(5,2), -- ms
  sleep_score INTEGER CHECK (0-100),
  sleep_hours DECIMAL(4,2),
  resting_hr INTEGER,
  steps INTEGER,
  calories_burned INTEGER,
  -- Manual entries
  weight_kg DECIMAL(5,2),
  mood_score INTEGER CHECK (1-10),
  energy_score INTEGER CHECK (1-10),
  notes TEXT
)

-- 4. FINANCE_ENTRIES
-- Hours worked and earnings
finance_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  source VARCHAR(100), -- 'Fåvang Varetaxi', 'Treffen', 'Kvitfjellhytter'
  description TEXT,
  hours DECIMAL(4,2) NOT NULL,
  rate_nok DECIMAL(8,2) NOT NULL,
  mva_rate DECIMAL(4,2) DEFAULT 1.25,
  subtotal_nok DECIMAL(10,2) GENERATED (hours * rate_nok),
  total_nok DECIMAL(10,2) GENERATED (hours * rate_nok * mva_rate),
  invoiced BOOLEAN DEFAULT FALSE,
  invoiced_at TIMESTAMP,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP
)

-- 5. RESEARCH_NOTES
-- Metadata for markdown research files
research_notes (
  id UUID PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE,
  file_path VARCHAR(1000) NOT NULL,
  file_hash VARCHAR(64),
  file_size_bytes INTEGER,
  project_id UUID REFERENCES projects(id),
  tags TEXT[],
  category VARCHAR(100),
  summary TEXT,
  key_insights TEXT[],
  status VARCHAR(50) CHECK ('draft', 'reviewed', 'archived', 'obsolete'),
  read_count INTEGER DEFAULT 0,
  last_read_at TIMESTAMP,
  search_vector tsvector -- Full-text search
)

-- 6. FRED_NOTIFICATIONS (AI inbox)
-- My notification queue for task updates
fred_notifications (
  id UUID PRIMARY KEY,
  type VARCHAR(100), -- 'task_completed', 'task_assigned', etc.
  title TEXT,
  message TEXT,
  task_id UUID REFERENCES tasks(id),
  project_id UUID REFERENCES projects(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
)

-- 7. TASK_SYNC_LOG
-- Track syncs between Kanban and TODO.md
task_sync_log (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  action VARCHAR(50), -- 'created', 'updated', 'completed'
  source VARCHAR(50), -- 'observatory', 'todo_md', 'fred'
  synced_at TIMESTAMP DEFAULT NOW()
)
```

### Row Level Security (RLS)
All tables have RLS enabled. Users can only see their own data (where `user_id = auth.uid()` or `owner_id = auth.uid()`).

---

## 🖥️ Frontend Structure

### Navigation (Left Sidebar)
1. **Mission Control** — Dashboard overview, today's focus
2. **Kanban** — Task board with drag-and-drop + AI Queue column
3. **Calendar** — Monthly calendar with events + task deadlines
4. **Fitness Lab** — Garmin sync with manual sync button, stale data warnings
5. **Finance** — Hours tracking by workplace (Varetaxi/Treffen/Kvitfjellhytter/Other)
6. **Research** — Active projects from DB + research notes viewer
7. **Settings** — OAuth connections (Google Calendar), preferences
8. **Fred Control** — Workspace file management

### Current Pages
- `/` — Mission Control (main dashboard)
- `/kanban` — Task board with AI Queue + recurring tasks
- `/calendar` — Monthly calendar view with events and task deadlines
- `/fitness` — Fitness tracking with sync button
- `/finance` — Finance dashboard with workplace tabs
- `/research` — Active projects + research notes from Supabase
- `/settings` — Settings & integrations
- `/fred-control` — Workspace file management

### API Routes (for AI integration)
- `/api/fred/notifications` — Get my notifications
- `/api/fred/tasks` — Get tasks for me
- `/api/fred/tasks/[id]/complete` — Mark task done
- `/api/calendar/sync-all` — Sync Google Calendar
- `/api/fitness/sync` — GET: sync status, POST: request Garmin sync
- `/api/webhooks/tasks` — Webhook for task updates
- `/api/cron/morning-sync` — Daily morning check (overdue tasks, due today)

---

## 🤖 How Fred (The AI) Uses The Observatory

### My Current Tools
I have a skill at `skills/observatory/` that gives me CLI access:

```bash
# Check my notification inbox
observatory notifications

# Get urgent tasks
observatory tasks --urgent

# List all projects
observatory projects

# Mark a task complete
observatory complete <task-id>

# Sync with TODO.md
observatory sync
```

### What I Need to Function
1. **Read Access:** Query tasks, projects, notifications from Supabase
2. **Write Access:** Mark tasks complete, add notifications
3. **Real-time Updates:** Know when Jakob completes tasks (via webhooks or polling)
4. **API Documentation:** Clear endpoints I can call

### Two-Way Sync System (Already Implemented)
- **Jakob marks task done in Observatory** → Webhook → I get notified immediately
- **I mark task done via API** → Updates Observatory + syncs to TODO.md
- **Notification queue** (`fred_notifications` table) — My inbox for updates

---

## 🔌 Integrations to Build

### 1. Garmin Connect (Fitness Lab)
**Status:** Not implemented yet  
**Need:** Jakob's Garmin Connect credentials  
**Goal:** Pull Body Battery, VO2 Max, sleep, HRV, workouts  
**Approach:** Use Garmin Health API or unofficial garmindb library

### 2. Google Calendar (Settings)
**Status:** OAuth flow partially implemented, needs fixing  
**Goal:** Sync cabin bookings, cleaning schedules, personal events  
**Current Issue:** OAuth callback has auth errors

### 3. iGMS (Future)
**Goal:** Pull booking data from Kvitfjellhytter  
**API:** Already connected via OAuth (token stored)

### 4. Markdown Research Sync (Research)
**Goal:** Display markdown files from `research/` folder  
**Approach:** Index files, store metadata in `research_notes`, render in browser

---

## 🐛 Known Issues to Fix

### Critical
1. **OAuth Callback** — Google Calendar connection fails with auth errors
2. **Garmin Sync Stale** — Last sync Feb 3. Manual sync button added but Python script needs to run.

### Fixed (2026-02-08)
- ✅ Kanban AI Queue column + recurring tasks
- ✅ Calendar page (monthly view with events + task deadlines)
- ✅ Fitness Lab sync button + stale data warning
- ✅ Finance workplace tabs (Varetaxi/Treffen/Kvitfjellhytter/Other) + Add Entry modal
- ✅ Research page shows real projects + notes from Supabase (no more mock data)
- ✅ Sidebar updated with Calendar link

### Nice-to-Have
- Fitness charts (Recharts visualization)
- Calendar event creation from UI
- Kvitfjellhytter revenue data integration from Supabase

---

## 📝 For the AI Fixing This

### When You Make Changes
1. **Update this file** (`/projects/the-observatory/AI_GUIDE.md`) with any new:
   - API endpoints
   - Database schema changes
   - Environment variables
   - How Fred should use new features

2. **Update the skill** (`/skills/observatory/`) if you add:
   - New CLI commands I should use
   - New API routes
   - New database tables

3. **Document Breaking Changes** — If you change table schemas or API responses, note it here so I know to update my queries.

### Testing Checklist
- [ ] Navigation works (all 6 links)
- [ ] URL updates match the current view
- [ ] Supabase connection works
- [ ] Tasks display from database
- [ ] Fred can query tasks via API
- [ ] Fred can mark tasks complete
- [ ] Notifications system works
- [ ] Dark mode toggle works

### Environment Variables (for `.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://vhrmxtolrrcrhrxljemp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-key>

# For Google Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=https://the-observatory-lxb444gor-redlegendes-projects.vercel.app
```

---

## 🎯 Success Criteria

The Observatory is "complete" when:
1. ✅ All navigation works and URLs sync correctly
2. ✅ Kanban board shows real tasks from Supabase
3. ✅ Jakob can add/edit/complete tasks
4. ✅ I can query tasks and mark them complete
5. ✅ Fitness Lab shows Garmin data (once connected)
6. ✅ Finance shows earnings summaries
7. ✅ Research displays markdown notes
8. ✅ Google Calendar sync works

---

## 📞 Questions?

Ask Jakob or check:
- `MEMORY.md` — Long-term memory about The Observatory
- `memory/2026-02-*.md` — Session logs with implementation details
- `projects/the-observatory/` — Source code
- `skills/observatory/` — My CLI tools

---

**Good luck building The Observatory! 🔭**

*— Fred, Jakob's AI assistant*