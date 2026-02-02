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
- **Status:** UI deployed, iGMS OAuth code ready, needs connection testing

### 3dje Boligsektor (HIGH PRIORITY)
- **Collaboration with Henrik** - Real estate development for social housing
- **Phase 1:** Clay-based kommune analysis (126 kommuner, 3 fokus) ✅ COMPLETE
- **Phase 2:** Tomte-sourcing system - find developable land/lots 🏗️ IN PROGRESS
- **Goal:** Pipeline towards 10,000+ boliger
- **Key data sources:** SSB, Kartverket, Arealplaner.no, Husbanken
- **Tech approach:** GIS analysis + grunneier outreach + megler network

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

## 🎯 Active Goals

### Priority 1 - Business
1. ✅ Kvitfjellhytter website structure complete
2. ✅ Kvitfjellhytter owner dashboard deployed
3. 🔴 **3dje Boligsektor Phase 2 planning** - Tomte-sourcing system (HIGH PRIORITY)

### Priority 2 - Personal Systems
4. ⏳ **Hour Tracking System** - Phase 1A working (text reporting), Phase 1B planned (PDF → calendar)
5. ⏳ Set up Freddy for autonomous calendar/todo/life management

### Priority 3 - AI Systems
6. ✅ **Freddy Research Agent** - Moonshot-based deep research, ~$0.05-0.50 per task
7. 🏗️ **The Observatory** - Personal command center (Mission Control, Kanban, Fitness Lab, Research Reader) - Autonomous build tonight

---

## 🔧 Integrations Status

| Integration | Status | Notes |
|-------------|--------|-------|
| Calendar (Google) | ⏳ Planned | Need new calendar for Freddy |
| Telegram | ✅ Working | For notifications |
| Kimi K2.5 | ✅ Active | `moonshot/kimi-k2.5` primary |
| **iGMS** | ✅ Code Ready | OAuth flow implemented, needs connection test |
| **Vercel** | ✅ Active | Kvitfjellhytter dashboard deployed |
| **Supabase** | ✅ Active | MCP connected, all storage there |
| **Project Automation** | ✅ READY | Full stack auto-setup (Supabase + Next.js + Vercel + browser verify) |

---

## 🛠️ Custom Skills Available

| Skill | Purpose | Location |
|-------|---------|----------|
| auto-updater | Daily OpenClaw + skill updates | `skills/auto-updater-1.0.0/` |
| byterover | Project knowledge management | `skills/byterover/` |
| clawddocs | OpenClaw documentation expert | `skills/clawddocs-1.2.2/` |

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
