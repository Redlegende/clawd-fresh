# TODO.md — Jakob's Tasks

**Single source of truth for all tasks.**

---

## 🔴 NOW — Active Tasks

| Priority | Task | Project | Status |
|----------|------|---------|--------|
| 1 | **🎯 3dje Boligsektor Phase 2** — Apply for Kartverket Matrikkel agreement | 3dje Boligsektor | 🔴 BLOCKER for owner lookup |
| 2 | **Connect iGMS OAuth** — Click "Connect iGMS" on dashboard and authorize | Kvitfjellhytter | Code ready, needs your auth |
| 3 | **Test iGMS API** with real data after OAuth | Kvitfjellhytter | Blocked until #2 done |
| 4 | **🌙 The Observatory Build** — Supabase LIVE, 7 projects + 12 tasks populated. Garmin auth blocked (401) | The Observatory | ✅ DB ready, 🔴 needs Garmin fix |

---

## 🟡 NEXT — Backlog (Prioritized)

### High Priority
- [ ] **Fix Supabase RLS policy recursion error** (bookings query) — Kvitfjellhytter
- [ ] **Hour Tracking Phase 1B** — Install PDF tools (`brew install poppler`)
- [ ] Add property images to Kvitfjellhytter dashboard cards
- [ ] Implement booking calendar view for dashboard

### 🏗️ 3dje Boligsektor — Phase 2 Tomte-Sourcing (THIS WEEK)
**🎯 Objective:** Build demo + presentation for apartment developers by Friday  
**💰 Budget:** 5000 NOK initial development (charging them, not spending)  
**🔄 Model:** Setup fee + monthly retainer  
**⚠️ Note:** Manual processes OK — automatic owner lookup NOT priority

**📁 START HERE:** `projects/3dje-boligsektor/README-BUILD-START.md`

**📁 Build Documents Ready:**
- `LEAN-ARCHITECTURE.md` — 5000 NOK system design
- `SOP-MANUAL-VERIFICATION.md` — Quality assurance procedures  
- `MVP-SCOPE-AND-PLAN.md` — 5-day build plan
- `README-BUILD-START.md` — Quick start guide

**🔴 DAY 1 (TODAY):**
- [ ] Read `MVP-SCOPE-AND-PLAN.md`
- [ ] Select 2 pilot municipalities from Phase 1 list
- [ ] Set up Python environment (geopandas, shapely, requests)
- [ ] Test Arealplaner.no WFS connection

**🔴 DAY 2:**
- [ ] Build kommuneplan fetcher (BO/BL zones)
- [ ] Build reguleringsplan fetcher (vedtatt)
- [ ] Test with Pilot 1

**🔴 DAY 3:**
- [ ] Implement differanse calculation
- [ ] Add size filtering (>2000 m²)
- [ ] Run on both pilots

**🔴 DAY 4:**
- [ ] Build scoring algorithm
- [ ] Set up Airtable CRM
- [ ] Pre-screen top 20 lots

**🔴 DAY 5 (FRIDAY — PRESENTATION):**
- [ ] Complete SOPs on top 10 lots
- [ ] Build presentation deck
- [ ] Demo for apartment developers

**📋 Presentation Must Include:**
- [ ] How differanse works (kommuneplan − reguleringsplan = opportunity)
- [ ] Demo: Actual lots in pilot municipalities
- [ ] Manual verification process (quality assurance)
- [ ] Pricing: 5000 NOK setup + monthly retainer
- [ ] Value prop: "We find the lots you can't find manually"

### Medium Priority  
- [ ] **The Observatory** — Provide Garmin credentials + Supabase project details (see Telegram report)
- [ ] **YouTube Content System** — Choose first video topic & create script outline
- [ ] **Morning Brief System** — Daily 8 AM automation
- [ ] **Social Listening Research** — Reddit/X trending topics
- [ ] **AI Company Management Research** — Deep analysis of AI tools

### Low Priority
- [ ] Treffen Timesheet System (B2B SaaS idea)
- [ ] YouTube Content System setup
- [ ] Invoice generation for hour tracking

---

## 🟢 DONE — Recently Completed

| Date | Task | Project |
|------|------|---------|
| 2026-02-01 | **3dje Boligsektor API Deep Research** — Kartverket, SSB, GeoNorge, Architecture | 3dje Boligsektor |
| 2026-02-01 | **3dje Boligsektor Master Synthesis** — Complete system design & roadmap | 3dje Boligsektor |
| 2026-02-01 | Migrated from old clawd workspace | System |
| 2026-01-30 | Cleaned up scattered task files | System |
| 2026-01-28 | Kvitfjellhytter dashboard UI redesign | Kvitfjellhytter |
| 2026-01-28 | Deployed dashboard to Vercel | Kvitfjellhytter |
| 2026-01-28 | iGMS OAuth flow implemented | Kvitfjellhytter |

---

## 📋 Task Sources

1. **You tell me** — "Add X to my todo list"
2. **Projects need work** — I add next steps
3. **Research completes** — Findings become actionable tasks
4. **Heartbeat checks** — Automated task advancement

**No other task lists exist.** If you see tasks elsewhere, tell me and I'll consolidate.

---

*Last updated: 2026-02-01*  
*Next review: Daily*
