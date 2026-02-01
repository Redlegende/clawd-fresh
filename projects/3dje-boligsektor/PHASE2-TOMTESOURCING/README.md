# Phase 2: Tomte-sourcing System - Research Plan

**Status:** 🔴 HIGH PRIORITY  
**Goal:** Design implementable system for finding developable land/lots  
**Approach:** Multi-step research with Kimi K2.5 + API doc extraction

---

## 🎯 Phase 2 Overview

From Fase 2 dokumentet:
> **Kjernelogikk:** KOMMUNEPLAN BOLIG − VEDTATT REGULERINGSPLAN = UTVIKLINGSMULIGHET

**Tre parallelle spor:**
- **A. Datamotor** - GIS analysis of plandata
- **B. Meglermotor** - Structured broker contact
- **C. Grunneiermotor** - Direct landowner outreach
- **D. Kommunemotor** - Direct municipality contact

---

## 📋 Research Steps

### Step 1: API Documentation Collection ⏳
**Goal:** Gather all API docs for Norwegian geodata sources

| Data Source | Priority | Status | API Docs Location |
|-------------|----------|--------|-------------------|
| Kartverket Matrikkel | 🔴 HIGH | ⏳ Need docs | kartverket.no |
| SSB PxWebAPI | 🔴 HIGH | ⏳ Need docs | ssb.no |
| GeoNorge | 🔴 HIGH | ⏳ Need docs | geonorge.no |
| Arealplaner.no | 🟡 MED | ⏳ Need docs | arealplaner.no |
| Husbanken Monitor | 🟡 MED | ⏳ Need docs | husbanken.no |
| Ambita/Infoland | 🟢 LOW | ⏳ Need docs | ambita.com |
| Byggfakta | 🟢 LOW | ⏳ Need docs | byggfakta.no |
| Prognosesenteret | 🟢 LOW | ⏳ Need docs | prognosesenteret.no |

**Deliverable:** `references/api-docs/` folder with extracted documentation

---

### Step 2: Filter Logic Definition ⏳
**Goal:** Define exact filtering criteria for lot identification

From "Filtreringslogikker omtalt i prosjektfilene":

**Kommune-level filters:**
- Sykepleierindeks (numerisk verdi)
- Boligstruktur (andel leiligheter vs eneboliger)
- Barn i leiebolig (SSB statistikk)
- Husbanken-samarbeid (ja/nei)
- Kommuneøkonomi (KOSTRA data)
- Demografiske data (befolkningsframskrivninger)

**Tomte-level filters:**
- Reguleringsstatus (LNF vs "gul" - regulert til bolig)
- Areal (størrelse i daa)
- Kapasitet (antall boliger)
- Sentralitet (avstand til kollektiv)
- Konfliktfrihet (fravær av hindringer)
- Eierstruktur (få eiere = enklere)

**Scoring model (0-100):**
| Variabel | Vekt |
|----------|------|
| Størrelse | 15% |
| Kapasitet | 20% |
| Sentralitet | 15% |
| Infrastruktur | 10% |
| Konfliktfrihet | 20% |
| Kommunal vilje | 10% |
| Eierstruktur | 10% |

**Deliverable:** `filter-logic-spec.md` with exact criteria and thresholds

---

### Step 3: Workflow Design ⏳
**Goal:** Step-by-step workflow for Phase 2 implementation

**Datamotor workflow:**
1. HENT kommuneplan_polygoner WHERE arealformål = 'Bolig'
2. HENT reguleringsplan_polygoner WHERE planstatus = 'Vedtatt'
3. BEREGN differanse = kommuneplan MINUS reguleringsplan
4. FOR HVERT polygon: Beregn areal, estimer kapasitet, flagg konflikter
5. KOBLE til matrikkelenheter og hjemmelshavere

**Prioriterte kommuner:**
| Kommune | BA-region | Langsiktig reserve | Prioritet |
|---------|-----------|-------------------|-----------|
| Nordre Follo | Oslo | ~5.000+ | 1 |
| Ås | Oslo | ~3.000 | 1 |
| Nesodden | Oslo | ~2.000 | 1 |
| Drammen | Drammen | ~15.000 | 2 |
| Stavanger | Stavanger | ~11.493 | 2 |
| Trondheim | Trondheim | ~9.800 | 2 |

**Deliverable:** `workflow-spec.md` with detailed process flow

---

### Step 4: Tech Stack Recommendation ⏳
**Goal:** Recommend optimal tech stack for implementation

**Options to evaluate:**
- PostGIS + QGIS (open source)
- Supabase (existing preference)
- Airtable (mentioned in docs)
- Clay (already using)
- Custom solution

**Deliverable:** `tech-stack-recommendation.md`

---

### Step 5: Implementation Roadmap ⏳
**Goal:** Create actionable implementation plan

**Fase 2.1 GIS:** Mnd 1-2
- PostGIS setup
- WFS-kartlegging
- Differanseanalyse

**Fase 2.2 Megler:** Mnd 2-3
- Megler-database
- Mandat, utsendelse
- 30+ megler-relasjoner

**Fase 2.3 Grunneier:** Mnd 3-4
- Matrikkel-kobling
- Brevkampanje
- Oppfølging

**Fase 2.4 CRM:** Mnd 4-6
- Airtable setup
- Clay-integrasjon
- Skalering

**Deliverable:** Updated `ROADMAP.md` with detailed phases

---

## 🔄 Research Methodology

Using Ralph Wiggum + Kimi K2.5:

```
1. Research topic with Kimi K2.5
   → Synthesis saved to research/synthesis/
   
2. Extract key findings
   → Update relevant spec files
   
3. Validate with secondary sources
   → Cross-check critical data
   
4. Document in project files
   → Commit to git
   
5. Report to Jakob
   → Telegram with summary
```

---

## 📁 File Structure for Phase 2

```
3dje-boligsektor/
├── README.md
├── PRD.md
├── ROADMAP.md
├── PHASE2-TOMTESOURCING/
│   ├── README.md                    # This file
│   ├── filter-logic-spec.md         # (to be created)
│   ├── workflow-spec.md             # (to be created)
│   ├── tech-stack-recommendation.md # (to be created)
│   └── implementation-plan.md       # (to be created)
├── references/
│   ├── README.md
│   └── api-docs/                    # Extracted API docs
│       ├── kartverket-matrikkel.md
│       ├── ssb-pxwebapi.md
│       ├── geonorge.md
│       ├── arealplaner.md
│       ├── husbanken-monitor.md
│       ├── ambita-infoland.md
│       ├── byggfakta.md
│       └── prognosesenteret.md
├── data-sources.md                  # From Norske datakilder doc
└── filtreringslogikker.md           # From Filtreringslogikker doc
```

---

## 🚀 Next Actions

1. **Create API doc extraction system**
   - Script to fetch and convert API docs to MD
   - Store in `references/api-docs/`

2. **Research Kartverket Matrikkel API**
   - How to get access
   - What data available
   - Cost and limitations

3. **Research SSB PxWebAPI**
   - Endpoints for kommune data
   - Query structure
   - Rate limits

4. **Define exact filter criteria**
   - Work with Henrik to set thresholds
   - Document in filter-logic-spec.md

---

*Created: 2026-01-28*  
*Status: Research phase initiated*
