# PROJECTS.md — Active Projects

*Track all active projects here. Link to project folders in `/projects/`.*

---

## 🏢 BUSINESS SYSTEMS

### Restaurant Staffing SaaS
**Status:** 💡 IDEA — Needs validation & MVP planning  
**Location:** `projects/restaurant-staffing-saas/`  
**Idea Doc:** `projects/restaurant-staffing-saas/IDEA.md`

**Concept:**
- Automatic staff finding for restaurants/businesses
- Scheduling system with shift matching
- Automatic hour tracking (clock in/out)
- Payroll integration & compliance
- Multi-tenant SaaS (scalable per restaurant)

**Key Value Props:**
- Saves restaurant owners hours each month
- Automatic backup of hours (compliance)
- Easy to implement per restaurant
- Network effects: more restaurants = better worker pool

**Next:**
- ⏳ Validate with restaurant owners
- ⏳ Define MVP scope
- ⏳ Create wireframes
- ⏳ Build pilot with 1-2 restaurants

---

### Kvitfjellhytter Dashboard
**Status:** 🟢 LIVE — Bookings Synced & Displayed  
**Location:** `~/clawd/projects/Kvitfjellhytter/app/`  
**Live:** https://app-pink-eight-65.vercel.app  
**Master Doc:** `~/clawd/projects/Kvitfjellhytter/app/MASTER.md`  

**Working:**
- ✅ UI redesign (cyan theme)
- ✅ Next.js + Supabase + Vercel
- ✅ iGMS OAuth flow implemented and connected
- ✅ Environment variables fixed (client_id, client_secret)
- ✅ 30 bookings synced from iGMS to Supabase
- ✅ bookings table recreated with correct schema
- ✅ Bookings page displays live data with sync button
- ✅ Sync API route updated to map iGMS data correctly
- ✅ Guest names extracted from guest_uid
- ✅ Properties linked to bookings
- ✅ Deployed and live
- ✅ MASTER.md created for AI development partner

**Next:**
- ⏳ Hand off to AI partner for UI/UX redesign
- ⏳ Clean up old test tokens (run SQL in Supabase)
- ⏳ Rename properties to actual cabin names

---

### 3dje Boligsektor
**Status:** 🔴 HIGH PRIORITY — Phase 2 Day 1  
**Location:** `projects/3dje-boligsektor/`  
**Collaboration:** Henrik

**Overview:**
- Real estate development for social housing
- Goal: Pipeline towards 10,000+ boliger
- Phase 1: Clay-based kommune analysis (126 kommuner) ✅
- Phase 2: Tomte-sourcing system — 🏗️ IN PROGRESS

**Current Sprint (This Week):**
- **Budget:** 5000 NOK initial development
- **Timeline:** 5 days (Mon-Fri)
- **Goal:** Demo + presentation for apartment developers

**Approach:** B: Professional (validated)

**Key Data Sources:**
- Kartverket/Geonorge (property/cadastre data)
- SSB (municipality statistics)
- Arealplaner.no (zoning plans)
- Husbanken (social housing policies)

**Documentation (Source of Truth):**
- `README-BUILD-START.md` — Start here
- `MVP-SCOPE-AND-PLAN.md` — 5-day build plan
- `LEAN-ARCHITECTURE.md` — System design
- `SOP-MANUAL-VERIFICATION.md` — Quality procedures

**Next (Day 1):**
- [ ] Read MVP-SCOPE-AND-PLAN.md
- [ ] Select 2 pilot municipalities
- [ ] Set up Python environment
- [ ] Test Arealplaner.no WFS connection

---

### Hour Management System
**Status:** ✅ Phase 1A Working → Phase 1B Planned  
**Location:** `hours/`

**Phase 1A (Working):**
- ✅ Text-based hour reporting via Telegram
- ✅ Automatic pay calculation (day/night rates + MVA)
- ✅ Markdown logging

**Phase 1B (Planned):**
- PDF parsing for scheduled driving dates
- Calendar integration (add driving dates as reminders)
- Automated reminders on driving days

**January 2025 Hours:**
- Fåvang Varetaxi: 92.25h | 36,625 kr (with MVA)
- Treffen: (no entries yet)

---

## 🤖 AI & AUTOMATION SYSTEMS

### Hybrid Browser Autonomy
**Status:** 🔴 CRITICAL — In Progress  
**Location:** `skills/browser-autonomy/`  
**Priority:** HIGHEST — Blocks all browser-based work

**The Problem:**
- Cannot debug iGMS OAuth without user clicking extension every time
- Cannot access logged-in sessions autonomously
- Limits error diagnosis and web automation capabilities

**The Solution — Hybrid Approach:**
1. **Peekaboo** launches/brings Chrome to front
2. **Peekaboo** navigates to target site (iGMS, etc.)
3. **Peekaboo** clicks OpenClaw extension icon in toolbar
4. **Browser tool** takes over with full DOM access
5. Debug, diagnose, document errors autonomously

**Why This Works:**
| Step | Tool | Capability |
|------|------|------------|
| Launch/Navigate | Peekaboo | Any browser, no permissions needed from user mid-flow |
| Click extension | Peekaboo | One-time setup action |
| Debug/Interact | Browser tool | Full DOM, console logs, network inspection |

**Required Setup:**
- [ ] Peekaboo permissions (Screen Recording + Accessibility)
- [ ] OpenClaw extension pinned to Chrome toolbar
- [ ] Chrome installed

**Next Steps:**
1. Grant permissions
2. Test on iGMS OAuth
3. Create reusable scripts
4. Document full workflow

---

### Freddy Research Agent
**Status:** ✅ Working  
**Location:** `projects/freddy-research-agent/`

Deep research system with Kimi K2.5 + Crawl4AI + Brave Search.
- Cost: ~$0.05-0.50 per research task
- 70% cost savings vs Gemini Deep Research
- Structured output with executive summary, findings, sources

**Usage:**
```bash
cd projects/freddy-research-agent
source venv/bin/activate
python src/agent.py "Your research topic" -o report.md
```

---

### The Observatory
**Status:** 🟢 LIVE — Deployed + Polished  
**Location:** `projects/the-observatory/`  
**Live:** https://the-observatory-beta.vercel.app

Personal command center: Mission Control + Kanban + Calendar + Fitness Lab + Finance + Research + Fred Control

**Modules:**
1. **Mission Control** — Today's Focus (overdue/due today/in-progress), quick stats, project health, priority tasks
2. **Kanban** — Drag-and-drop with AI Queue column + recurring/cron tasks
3. **Calendar** — Monthly view with Google Calendar events + task deadlines
4. **Fitness Lab** — Garmin sync + Recharts trend charts (Body Battery, Sleep, HR, Steps)
5. **Finance** — Workplace-separated hours (Varetaxi/Treffen/Kvitfjellhytter/Other) with Add Entry modal
6. **Research** — 13 research notes from DB with category filters + search + project cards
7. **Fred Control** — Workspace file management
8. **Settings** — Google Calendar OAuth, preferences

**Working:**
- ✅ All 8 pages deployed and functional
- ✅ Supabase connected with live data (7 projects, no duplicates)
- ✅ 3 Vercel cron jobs (morning-sync 7AM, task-check 12PM, recurring-tasks 6AM)
- ✅ 13 research notes populated from workspace
- ✅ Recharts fitness trend charts (Body Battery, Sleep, Resting HR, Steps)
- ✅ Dynamic Today's Focus dashboard replacing static banner
- ✅ Task sync with Fred (webhooks)
- ✅ AI Queue column — drag tasks for Fred to handle
- ✅ Recurring tasks support (daily/weekly/monthly) + cron processor
- ✅ Calendar page with events + task deadlines
- ✅ Finance workplace tabs with auto-rate calculation
- ✅ Fred Control Panel — browse, view, manage workspace files

**Blocked:**
- ⚠️ Garmin Sync — needs MFA code from Jakob
- ⚠️ Google Calendar OAuth — needs Google Cloud credentials (client_id, client_secret)

**Tech Stack:** Next.js 16, Supabase, shadcn/ui, Recharts, Vercel

---

## 🥗 PERSONAL PROJECTS

### Gut Health Lab
**Status:** ✅ Active Research  
**Location:** `projects/gut-health-lab/`

Personal gut healing protocol based on Dr. William Davis's work.

**Research Completed:**
| Topic | File |
|-------|------|
| Super Gut Diet | `research/01-super-gut-diet.md` |
| Wheat Belly | `research/02-wheat-belly.md` |
| L. reuteri + SIBO | `research/03-l-reuteri-sibo.md` |
| Yogurt Strains | `research/04-yogurt-strains.md` |
| **Lentils & Chickpeas** | `research/05-lentils-chickpeas-gut-health.md` ✅ |

**Current Protocol:**
- Knut bread (green banana flour)
- Beef stock daily
- L. reuteri yogurt (36h fermentation)
- Lentils/chickpeas: 1/4–1/2 cup, canned + rinsed

---

## 🔬 RESEARCH PROJECTS

### 3dje Boligsektor Data Sources
**Status:** ✅ Complete  
**Location:** `research/3dje-boligsektor/`

Comprehensive research on Norwegian APIs for:
- Property/cadastre data (Kartverket)
- Municipality statistics (SSB)
- Property valuations (Eiendomsverdi)
- Social housing policies (Husbanken)

**Key deliverables:**
- API cost analysis
- Data source comparison
- Implementation recommendations

---

### AI Company Management
**Status:** 📝 Planning  
**Location:** `research/ai-company-management/`

Research on AI tools for business operations

---

### AI Orchestration Patterns
**Status:** ✅ Research Complete  
**Location:** `research/ai-orchestration-patterns/`

5 orchestration patterns identified:
1. Sequential
2. Concurrent
3. Group Chat
4. Handoff
5. Magentic (Freddy as manager)

---

## 📊 Quick Reference

| Project | Status | Next Action | Priority |
|---------|--------|-------------|----------|
| Kvitfjellhytter | ✅ Working | Fix RLS + test iGMS | Medium |
| 3dje Boligsektor | 🔴 Planning | Schedule with Henrik | **HIGH** |
| Hour Tracking | ✅ Working | Install PDF tools (poppler) | Medium |
| YouTube | 🔵 Planning | Choose first video topic | Medium |
| Gut Health Lab | ✅ Active | Continue protocol | — |
| Research Agent | ✅ Working | Use as needed | — |
| Everything Dashboard | 🏗️ Building | Continue development | Low |

---

## 🎬 CONTENT SYSTEMS

### YouTube Channel
**Status:** 🔵 Planning  
**Location:** `projects/youtube/`  
**Rule:** One main project. Videos = sub-folders/files. No video-sprawl.

**Structure:**
```
youtube/
├── video-ideas/           # Video concepts
├── scripts/               # Written scripts
├── research/              # YouTube-specific research HERE
├── assets/                # Thumbnails, graphics
└── analytics/             # Performance data
```

**Video Ideas:**
- "How I Cured My Depression in 3 Days" (gut health)
- "From 90kg Teen to 60+ VO2 Max" (fitness)
- "Building a Cabin Rental Business with AI"

**Next:** Choose first video + deep research → `youtube/research/`

---

## 💡 FUTURE IDEAS

| Project | Status | Notes |
|---------|--------|-------|
| Treffen Timesheet SaaS | 💡 Idea | B2B SaaS for restaurant hours |
| Tiny Home on Wheels | 💡 Idea | Long-term project |

---

*For detailed tasks, see TODO.md*  
*Last updated: 2026-02-01 — Migrated from old workspace*
