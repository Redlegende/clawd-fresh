# PROJECTS.md — Active Projects

*Track all active projects here. Link to project folders in `/projects/`.*

---

## 🏢 BUSINESS SYSTEMS

### Kvitfjellhytter Dashboard
**Status:** ✅ Deployed → Needs Polish  
**Location:** `projects/Kvitfjellhytter/`  
**Live:** https://app-pink-eight-65.vercel.app  

**Working:**
- ✅ UI redesign (cyan theme)
- ✅ Next.js + Supabase + Vercel
- ✅ iGMS OAuth flow implemented

**Next:**
- Connect iGMS OAuth (test API)
- Fix Supabase RLS policy recursion error
- Add booking calendar view

---

### 3dje Boligsektor
**Status:** 🔴 HIGH PRIORITY — Phase 2 Planning  
**Location:** `projects/3dje-boligsektor/`  
**Collaboration:** Henrik

**Overview:**
- Real estate development for social housing
- Goal: Pipeline towards 10,000+ boliger
- Phase 1: Clay-based kommune analysis (126 kommuner) ✅
- Phase 2: Tomte-sourcing system (find developable land)

**Three Implementation Approaches:**
| Approach | Timeline | Investment | Best For |
|----------|----------|------------|----------|
| A: Lean Launch | 3-4 weeks | NOK 50-75k | Quick validation |
| B: Professional | 8-10 weeks | NOK 250-350k | Balanced speed & capability |
| C: Enterprise | 16-20 weeks | NOK 600-800k | Scale & competitive advantage |

**Key Data Sources:**
- Kartverket/Geonorge (property/cadastre data)
- SSB (municipality statistics)
- Arealplaner.no (zoning plans)
- Husbanken (social housing policies)

**Research:** Complete — see `projects/3dje-boligsektor/PHASE2-APPROACHES.md`

**Next:**
- Schedule planning session with Henrik
- Choose approach (recommend B: Professional)

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

### The Observatory (formerly Everything Dashboard)
**Status:** 🏗️ In Progress — Autonomous Build Tonight  
**Location:** `projects/the-observatory/`

Personal command center: Mission Control + Kanban + Fitness Lab + Research Reader + Finance

**Modules Planned:**
1. **Mission Control** — Today's focus, quick stats, alerts
2. **Kanban** — Drag-and-drop todos, project filtering
3. **Fitness Lab** — Garmin Epix Pro sync (Body Battery, VO2 Max, HRV)
4. **Research Reader** — Markdown viewer for notes
5. **Finance** — Hours worked, earnings tracking

**Tonight's Work (Auto-Scheduled 23:00):**
- ✅ Install Garmin skill
- ✅ Design Supabase schema
- ✅ Initialize Next.js project
- ⏳ Garmin auth (needs Jakob's credentials)
- ⏳ Supabase connection (needs URL + key)

**Tech Stack:** Next.js 16, Supabase, shadcn/ui, Recharts
**See:** `projects/the-observatory/TONIGHT-WORK-PLAN.md` for full details

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
