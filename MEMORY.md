# MEMORY.md — Long-Term Memory

Curated memories that persist across sessions. For raw daily logs, see `memory/YYYY-MM-DD.md`.

---

## People

### Jakob Bakken
- **Born:** July 3, 1999 (26 years old)
- **Location:** Sandmovegen 3, 2634 Fåvang, Norway
- **Traits:** Systems thinker, gut health obsessed, practical, no-bullshit
- **Businesses:** Kvitfjellhytter (Airbnb cabins), 3dje Boligsektor (with Henrik)

---

## 🏢 Businesses

### Kvitfjellhytter
- Short-term cabin rentals (Airbnb-style)
- PMS: IGMS
- **Dashboard LIVE:** https://app-pink-eight-65.vercel.app
- Tech stack: Next.js 16, Supabase, Tailwind CSS, TypeScript
- **Storage: Supabase (not S3)** - All PDFs, files in Supabase storage
- Location: Fåvang, Norway
- Design system: Clean modern SaaS, cyan primary (#0891B2), Plus Jakarta Sans
- **Status:** ✅ OAuth connected, 30 bookings synced, bookings table created

**🏠 Cabins & Management Rules (CRITICAL):**
- **Cabins:** cabin 12, cabin 13, cabin 22, cabin 23, Ringebuhuset
- **Cleaning is NON-NEGOTIABLE** - Business-critical, must happen
- **Cleaning window:** 11:00–15:00 (4 hours max)
- **CRITICAL RULE:** If cleaning + check-in on same day → Jakob CANNOT drive
  - Must either have someone else working, OR not drive that day
- **Non-check-in cleaning days:** Can block calendar so no bookings
- **Current system:** Calendar events marked with 🧹 CLEAN (red) and 🏠 CHECK-IN (green)

### 3dje Boligsektor (HIGH PRIORITY)
- **Collaboration with Henrik** - Real estate development for social housing
- **Phase 1:** Clay-based kommune analysis (126 kommuner, 3 fokus) ✅ COMPLETE
- **Phase 2:** Tomte-sourcing system - find developable land/lots 🏗️ IN PROGRESS
- **Goal:** Pipeline towards 10,000+ boliger
- **Key data sources:** SSB, Kartverket, Arealplaner.no, Husbanken
- **Tech approach:** GIS analysis + grunneier outreach + megler network

### The Observatory (LIVE — 2026-02-03)
- **Dashboard:** https://the-observatory-beta.vercel.app
- **Stack:** Next.js 16 + Supabase + Tailwind + shadcn/ui
- **Database:** 5 tables (projects, tasks, fitness_metrics, finance_entries, research_notes)
- **Data:** 30 days Garmin fitness data, 7 projects, 12 tasks, hour tracking
- **Research Workflow:** ✅ Fully automated (2026-02-15)
  - Research saved to both `.md` files AND Supabase
  - Full markdown rendering with ReactMarkdown
  - Searchable, categorized, tagged
  - Skill: `skills/research-to-observatory/`

### Hybrid Browser Autonomy (NEW — 2026-02-03) 🔴 CRITICAL
**Status:** Implementation in progress  
**Goal:** Enable Fred to autonomously control logged-in browser sessions  
**Approach:** Peekaboo (launch/navigate/click extension) + Chrome Extension (DOM debugging)  
**Blocks:** iGMS debugging, all logged-in site automation  
**Priority:** HIGHEST — Documented in TODO.md and PROJECTS.md  
**Location:** `skills/browser-autonomy/`
- **Pages:** Mission Control, Kanban, Fitness, Finance, Research, Settings
- **Auto-sync:** Daily 8:30 AM Garmin fetch (token persistence, no MFA)

**📁 Research Complete (2026-02-01):**
- `MASTER-SYNTHESIS.md` — Complete system design & 8-week roadmap
- `LEAN-ARCHITECTURE.md` — Demo-focused 5000 NOK scope
- `SOP-MANUAL-VERIFICATION.md` — Quality assurance procedures
- `MVP-SCOPE-AND-PLAN.md` — 5-day build plan for developer presentation
- `research/API-KARTVERKET-DEEP-DIVE.md` — Property boundaries ✅, Owner lookup ⚠️ (manual OK)
- `research/API-SSB-CONTEXT-DEEP-DIVE.md` — Grunnkrets-level context data for scoring
- `research/API-GEONORGE-PLANS-DEEP-DIVE.md` — Kommuneplan/reguleringsplan differanse algorithm
- `research/SYSTEM-ARCHITECTURE-DESIGN.md` — Technical architecture & database schema

**🎯 Current Focus (This Week):**
- **Budget:** 5000 NOK initial development (charging clients)
- **Model:** Setup fee + monthly retainer
- **Goal:** Demo + presentation for apartment developers by Friday
- **Scope:** 2 pilot municipalities, 20-50 lots, manual verification
- **Not priority:** Automatic owner lookup (manual process OK)

**📋 Build Plan:**
- Day 1: Setup + pilot selection
- Day 2: Data fetching (kommuneplan/reguleringsplan)
- Day 3: Differanse engine
- Day 4: Scoring + Airtable CRM
- Day 5: Presentation prep

**📋 Deliverables:**
- Working differanse algorithm
- 10+ verified lots with scores
- Airtable CRM
- Presentation deck
- Pricing: 5000 NOK setup + retainer tiers

---

## 🤖 Sub-Agent Architecture (IMPLEMENTED 2026-02-03)

**Philosophy:** I am the orchestrator, not the soloist. Delegate coding/DevOps/data to specialized agents.

**Active Agents (All Kimi 2.5):**
| Agent | Role | Tasks |
|-------|------|-------|
| **Code Agent** | TypeScript/React/Next.js | Frontend fixes, components, builds |
| **DevOps Agent** | Vercel/Supabase | Deployments, env vars, infrastructure |
| **Data Agent** | Python/SQL | Garmin sync, data imports, reports |
| **QA Agent** | Testing | Verification, health checks, validation |
| **Research Agent** | Deep research | Summaries, transcription, analysis |

**Orchestrator Health System:**
- FAILURE_LOG.md — Track failed attempts, prevent repetition
- ORCHESTRATOR_HEALTH.md — Self-monitoring, vital signs
- Decision log — Record "why" for architectural choices
- Escalation triggers — Confidence < 70%, timeout, contradiction

**Key Rules:**
- Research BEFORE patching (don't fix what you don't understand)
- Verify before reporting "done"
- Use Kimi 2.5 exclusively (no cheaper models without approval)
- Log every fix attempt
- Wait for user verification on critical features

---

## 🎯 Active Goals

### Priority 1 - Business
1. ✅ Kvitfjellhytter website structure complete
2. ✅ Kvitfjellhytter owner dashboard deployed
3. ✅ The Observatory LIVE — Full system operational
4. 🔴 **3dje Boligsektor Phase 2 planning** - Tomte-sourcing system (HIGH PRIORITY)

### Priority 2 - Personal Systems
4. ⏳ **Hour Tracking System** - Phase 1A working (text reporting), Phase 1B planned (PDF → calendar)
5. ⏳ Set up Freddy for autonomous calendar/todo/life management

### Priority 3 - AI Systems
6. ✅ **Freddy Research Agent** - Moonshot-based deep research, ~$0.05-0.50 per task
7. ✅ **The Observatory** - Personal command center FULLY OPERATIONAL. Supabase backend connected, 7 projects + 13 tasks populated. Frontend ready for live data.

---

## 🔧 Integrations Status

| Integration | Status | Notes |
|-------------|--------|-------|
| Calendar (Google) | ⏳ Planned | Need new calendar for Freddy |
| Telegram | ✅ Working | For notifications |
| Kimi K2.5 | ✅ Active | `moonshot/kimi-k2.5` primary |
| **iGMS** | ✅ Connected | OAuth working, 30 bookings synced, displaying in dashboard |
| **Vercel** | ✅ Active | Kvitfjellhytter dashboard deployed |
| **Supabase** | ✅ Active | MCP connected, all storage there |
| **Project Automation** | ✅ READY | Full stack auto-setup (Supabase + Next.js + Vercel + browser verify) |
| **Observatory** | ✅ LIVE | https://the-observatory-lxb444gor-redlegendes-projects.vercel.app — Supabase connected, **Task Sync API enabled** |
| **Browser Autonomy** | ✅ NEW 2026-02-03 | Chrome Extension Relay + Peekaboo — can now debug iGMS autonomously |

---

## 🛠️ Custom Skills Available

| Skill | Purpose | Location |
|-------|---------|----------|
| auto-updater | Daily OpenClaw + skill updates | `skills/auto-updater-1.0.0/` |
| byterover | Project knowledge management | `skills/byterover/` |
| clawddocs | OpenClaw documentation expert | `skills/clawddocs-1.2.2/` |
| supabase | Database operations, SQL queries, CRUD | `skills/supabase/` |
| **browser-autonomy** | **Autonomous browser control** — Chrome Extension + Peekaboo for logged-in sites like iGMS | `skills/browser-autonomy/` |
| **links** | **Quick bookmarks** — Fast access to Observatory, Kvitfjellhytter, Folio, etc. | `skills/links/` |

---

## 💰 Hour Tracking System

**Status:** Phase 1A ✅ Working | Phase 1B 📝 Planned  
**Location:** `hours/`

**Rates:**
- Day (before 22:00): 300 kr/h × 1.25 MVA = 375 kr/h
- Night (after 22:00): 400 kr/h × 1.25 MVA = 500 kr/h
- Treffen: 400 kr/h × 1.25 MVA = 500 kr/h

**January 2025 Totals:**
- Day Drives: 76h | 28,500 kr (with MVA)
- Night Drives: 16.25h | 8,125 kr (with MVA)
- **TOTAL: 92.25h | 36,625 kr**

---

## 🔬 Deep Research Agent

**Status:** LIVE & WORKING  
**Location:** `projects/freddy-research-agent/`  
**Stack:** Python + Crawl4AI + Moonshot API + Brave Search

**Cost per task: ~$0.05-0.50** (vs $2-5 for Gemini Deep Research)

**Model Strategy:**
| Task | Model | Cost |
|------|-------|------|
| Query analysis | `kimi-k2-turbo-preview` | ~$0.005 |
| Page summaries | `kimi-k2-turbo-preview` | ~70% of work |
| Final synthesis | `kimi-k2.5` | ~$0.15 |

**Usage:**
```bash
cd projects/freddy-research-agent
source venv/bin/activate
python src/agent.py "Your research topic" -o report.md
```

---

## ⚠️ Lessons Learned

### Cost Control (2026-01-29)
- **Issue:** $10 token cost in one day from reading 28KB PRDs in main session
- **Solution:** Strict sub-agent-only workflow for all research/coding
- **Rule:** Main session tokens <20k. Reset (`/new`) between topics.

### Model Selection Strategy
| Use Case | Model |
|----------|-------|
| Main session (orchestration) | `kimi-k2.5` |
| Sub-agents (work) | `kimi-k2-0905-preview` |
| Deep reasoning | `kimi-k2-thinking` |
| Fast/cheap | `kimi-k2-turbo-preview` |

---

## 📝 Preferences & Values

**Communication style:** Casual, friendly, human. Never cheap or strict.  
**Values:** Simplicity, quality, low maintenance  
**Tech comfort:** APIs, web scraping, VPS, automation platforms  
**Search:** Brave Search has free tier (2k/month) - USE THIS

---

## 💡 Ideas Backlog

- AI-first lifestyle documentation
- Tiny home on wheels project
- **Content creation (YouTube, documentary)** — Project folder created 2026-02-01
- Affiliate monetization (AIRE, Freedom, Bricks)
- Web scraping side projects

---

## 📁 Workspace Organization Rules

**Core principle:** Project-specific research lives IN the project. General research in research/.

**Limits:**
- Max 7 active projects in `/projects/`
- YouTube = 1 main project (videos = sub-folders, not new projects)
- Max 5 sub-folders per project
- No duplicate information

**Folder hierarchy:**
```
projects/
├── youtube/               ← Main project
│   ├── video-ideas/
│   ├── scripts/
│   └── research/          ← YouTube research HERE
├── 3dje-boligsektor/
│   └── research/          ← Boligsektor research HERE
└── freddy-research-agent/

research/                  ← General research only
├── ai-orchestration-patterns/
└── ai-company-management/
```

**Health check:** Daily cron at 9 AM runs `scripts/workspace-health-check.sh`

---

## 🥗 Gut Health Protocol

Jakob's personal gut healing system based on Dr. William Davis's research.

### Current Protocol:
- **Knut Bread** — Homemade gut-friendly bread (green banana flour base)
- **Beef Stock** — Daily morning consumption
- **L. reuteri Yogurt** — 36-hour fermented, SIBO protocol

### Research Archive:
| Topic | Location |
|-------|----------|
| L. reuteri + SIBO | `projects/gut-health-lab/research/03-l-reuteri-sibo.md` |
| Yogurt Strains | `projects/gut-health-lab/research/04-yogurt-strains.md` |
| **Lentils & Chickpeas** | `projects/gut-health-lab/research/05-lentils-chickpeas-gut-health.md` ✅ |

### Key Findings:
- ✅ **Lentils & chickpeas approved** — Rich in GOS prebiotic fiber
- ⚠️ **SIBO preparation matters** — Use canned/rinsed or soak + strain
- 🎯 **Portions:** 1/4–1/2 cup cooked per serving
- 📊 **Dr. Davis target:** 20g prebiotic fiber daily

---

## 📝 Recent Activity

### 2026-02-08 — Observatory Major Restructure
- ✅ **Kanban AI Queue** — New column for tasks Fred should do. Drag tasks to AI Queue. Support for recurring tasks (daily/weekly/monthly). Bot + Repeat icons on task cards.
- ✅ **Calendar Page** — Full monthly calendar view at `/calendar`. Shows Google Calendar events + task deadlines. Day detail panel + upcoming 7 days sidebar.
- ✅ **Fitness Lab Sync** — Added manual "Sync Garmin" button. Stale data warning banner when data > 1 day old. API at `/api/fitness/sync`. Currently 5 days stale (last Feb 3).
- ✅ **Finance Workplace Tabs** — Filter by Fåvang Varetaxi / Treffen / Kvitfjellhytter / Other. Add Entry modal with auto-rate (day/night), shift type, time tracking. Full MVA calculation preview.
- ✅ **Research from DB** — Replaced mock data with real Supabase queries. Shows active projects with health scores. Research notes with search + category filter.
- ✅ **Sidebar** — Added Calendar link between Kanban and Fitness Lab.
- ✅ **DB Migration** — Added `assigned_to`, `is_recurring`, `recurrence_rule`, `recurrence_interval`, `last_run_at`, `next_run_at` columns to tasks table.
- 🎯 **Next:** Deploy to Vercel, run Garmin sync to get fresh data, populate research_notes table

### 2026-02-06 — Kvitfjellhytter Dashboard FULLY FIXED & DEPLOYED
- ✅ **Fixed bookings table schema** — recreated with proper columns matching dashboard expectations
- ✅ **Updated sync route** — maps iGMS API data to dashboard schema correctly
- ✅ **Fixed data fetching** — joins with properties table for property names
- ✅ **Added sync button** — bookings page now has working sync button
- ✅ **Deployed to Vercel** — live at https://app-pink-eight-65.vercel.app
- ✅ **30 bookings synced** — all iGMS bookings now in Supabase and displaying
- ✅ **Fixed guest names** — extracted from guest_uid (e.g., "john.doe@email.com" → "John")
- ✅ **Linked properties** — populated properties table and linked bookings to them
- ✅ **Created MASTER.md** — comprehensive documentation for AI development partner
- 🎯 Next: Hand off to AI partner for UI/UX redesign

### 2026-02-06 — Kvitfjellhytter Bookings Table & Page
- ✅ Created `bookings` table in Supabase (16 columns, proper indexes)
- ✅ Created `igms_properties` table for property sync
- ✅ Built bookings page component (`/dashboard/bookings`)
  - Stats cards (upcoming, guests, revenue)
  - Sortable table with status badges
  - Norwegian date/currency formatting
- ✅ Built property sync API route (`/api/igms/properties`)
- 📁 Files ready at: `projects/kvitfjellhytter/dashboard-bookings/`
- 🎯 Next: Copy files to dashboard codebase, test with live data

### 2026-02-02 — Observatory FULLY OPERATIONAL
- ✅ FIXED: Supabase table creation via Management API (was blocked by REST API limitations)
- ✅ Created all 5 tables + 3 views for Observatory
- ✅ Populated database: 7 projects + 13 tasks from PROJECTS.md/TODO.md
- ✅ Connected frontend to Supabase (credentials configured)
- ✅ Installed `supabase` skill from ClawHub
- ✅ Documented findings in `OBSERVATORY-BUILD-REPORT.md`
- 🎯 Next: Deploy frontend with live data, test Garmin Connect

### 2026-02-01 — Workspace Migration Complete
- Migrated from old `clawd/` workspace to `clawd-fresh/`
- Created `WORKFLOW.md` — automatic progress tracking system
- Created `ORGANIZATION.md` — hierarchical file structure rules
- Restructured: YouTube as main project, research moved to project folders
- Set up daily workspace health check cron job
- See `memory/2026-02-01.md` for full session log

---

*Last updated: 2026-02-01 — Migrated from old workspace + Project automation skill created*

---

## 🔧 Supabase Management Learnings (2026-02-02)

### Critical Discovery: Two Different APIs
| API | Purpose | Auth | Use For |
|-----|---------|------|---------|
| **REST API** (PostgREST) | CRUD on tables | `anon` or `service_role` key | SELECT, INSERT, UPDATE, DELETE |
| **Management API** | Admin/DDL operations | Access token (`sbp_...`) | CREATE TABLE, CREATE VIEW, SQL queries |

### Key Endpoints
```bash
# REST API (data operations)
https://{project}.supabase.co/rest/v1/{table}

# Management API (schema operations)
https://api.supabase.com/v1/projects/{project_id}/database/query
```

### Creating Tables (The Right Way)
**WRONG:** Using REST API or supabase-js client
```javascript
// This will NOT work
supabase.from('sql').select('*')  // No such table
```

**RIGHT:** Using Management API with access token
```bash
curl -X POST "https://api.supabase.com/v1/projects/{id}/database/query" \
  -H "Authorization: Bearer sbp_..." \
  -d '{"query": "CREATE TABLE ..."}'
```

### Response Handling
- Management API returns `[]` on success (not `{}`)
- Empty array means "success, no rows returned"
- HTTP 200 with `[]` = table created successfully

### Credentials Location
- Access token: `.project-automation.env` → `SUPABASE_TOKEN`
- Anon key: Supabase dashboard → Project Settings → API
- Service key: Same location (keep secret!)

### Observatory Status (2026-02-03)
**URL:** https://the-observatory-lxb444gor-redlegendes-projects.vercel.app  
**Supabase:** https://supabase.com/dashboard/project/vhrmxtolrrcrhrxljemp  
**Tables:** projects, tasks, fitness_metrics, finance_entries, research_notes, **fred_notifications**, **task_sync_log**

### Task Sync System (NEW 2026-02-03)
Two-way sync between Kanban and Fred:
- **Inbound webhook:** When you mark a task done → Fred gets notified immediately
- **Outbound API:** Fred can mark tasks done via `/api/fred/tasks/[id]/complete`
- **Notification queue:** `fred_notifications` table for my inbox

**Fred's CLI tools:** `skills/observatory-sync/`
- `observatory-notifications.sh` — Check my inbox
- `observatory-tasks.sh --urgent` — List urgent tasks
- `observatory-complete-task.sh [id]` — Mark task done

---

## 🌐 Browser Autonomy (NEW 2026-02-03)

**Created to solve:** iGMS debugging without you micromanaging every click

**What it is:** Two methods for me to autonomously operate browsers

### Method 1: Chrome Extension Relay (PRIMARY)
- I control YOUR logged-in Chrome via OpenClaw Browser Relay extension
- You click the toolbar icon on iGMS tab → I take over
- Full DOM access: snapshots, clicks, typing, navigation
- **Best for:** iGMS, Google Calendar, any site you're logged into

**How to use:**
1. Open iGMS in Chrome
2. Click OpenClaw Browser Relay extension (badge turns ON)
3. Tell me: "Debug iGMS connection"
4. I snapshot → analyze → document errors

### Method 2: Peekaboo (FALLBACK)
- macOS UI automation via screenshots + clicks
- Works with any browser, any app
- **Best for:** Safari, Firefox, desktop apps

**Prerequisites:**
```bash
brew install steipete/tap/peekaboo
peekaboo permissions  # Grant Screen Recording + Accessibility
```

**Decision Tree:**
```
Debug iGMS error?
├── Using Chrome + logged in? → Chrome Extension (fastest)
├── Using Safari/Firefox? → Peekaboo
└── Desktop app? → Peekaboo
```

**Skill location:** `skills/browser-autonomy/`

---

## 🚀 Project Automation Skill

**Status:** ✅ READY TO USE  
**Location:** `skills/project-automation/`

### What It Does
Full automation pipeline: Supabase project → Next.js app → Vercel deploy → Browser verification

### Usage
```bash
# One command creates everything:
source .project-automation.env
./skills/project-automation/scripts/project-automation.sh observatory-dashboard

# Result:
# ✅ Supabase project created (eu-north-1)
# ✅ Next.js + shadcn/ui initialized
# ✅ Supabase client configured
# ✅ Vercel linked & deployed
# ✅ Browser verification run
```

### What's Automated
1. **Supabase** — Creates project in `kvitfjellhytter` org, eu-north-1
2. **Next.js** — shadcn template, Supabase client, env files
3. **Vercel** — Link, env vars, production deploy
4. **Verification** — HTTP 200, response time, error checks

### Credentials Stored
- `.project-automation.env` — Tokens for Supabase & Vercel
- Supabase org: `qpeaojfvnbwciqttuhzc`
- Vercel scope: `redlegende`

### Browser Checks
- ✅ Page loads (HTTP 200)
- ✅ Response time < 5s
- ✅ No error patterns
- ⚠️ Manual still needed: interactive features, JS console
