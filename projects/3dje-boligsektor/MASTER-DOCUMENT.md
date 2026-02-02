# 3dje Boligsektor — Master Project Document
## Automated Tomte-Sourcing System for Social Housing Development

**Date:** February 1, 2026  
**Status:** Phase 2 Planning — Tomte-Sourcing System  
**Objective:** Build automated system to identify developable land for social housing in Norwegian municipalities

---

## 1. EXECUTIVE SUMMARY

### The Business Context
3dje Boligsektor develops social housing in Norway. Their unique value proposition:
- Build 140+ apartments on lots typically restricted from development
- 40% of units sold at reduced rates to lower-income families
- Target municipalities with social benefit programs
- Get special permits due to social housing contribution

### The Challenge
Need to identify:
1. **Municipalities** receptive to social housing (political will + need)
2. **Lots/land** in those municipalities viable for development
3. **Owners** of those lots for acquisition outreach

### The Solution
Build an automated tomte-sourcing system that:
- Scans all 356 Norwegian municipalities
- Identifies developable land using GIS analysis
- Scores lots based on viability criteria
- Provides owner contact information
- Tracks pipeline in CRM

---

## 2. PROJECT PHASES

### Phase 1: Municipality Analysis ✅ (COMPLETE)
**Goal:** Identify top municipalities for social housing

**Deliverables:**
- Scored list of 356 municipalities
- Filtering based on demographics, economics, politics
- Prioritized targets with contact information

**Status:** Research complete — see `RESEARCH-SUMMARY.md`

---

### Phase 2: Tomte-Sourcing (IN PLANNING)
**Goal:** Find specific lots/land in target municipalities

**Core Logic:**
```
KOMMUNEPLAN (building allowed) — REGULERINGSPLAN (already developed) = OPPORTUNITY
```

**Key Questions to Answer:**
1. What defines a "qualified lot" for this project?
2. Which APIs can identify these lots automatically?
3. How do we verify lot viability?
4. What manual checks are still required?
5. How do we automate owner identification?

---

## 3. LOT QUALIFICATION CRITERIA

### Minimum Requirements (Hard Filters)

| Criteria | Threshold | Rationale |
|----------|-----------|-----------|
| **Minimum Area** | 2,000 m² (0.2 daa) | Space for 20+ units |
| **Zoning** | BO (Bolig) or BL (Blanding) | Legal to build housing |
| **Not Already Regulated** | Outside vedtatt reguleringsplan | Available for development |
| **No Major Conflicts** | No vern, flomsone, etc. | Buildable without issues |

### Scoring Criteria (0-100 Points)

| Factor | Weight | Data Source | Description |
|--------|--------|-------------|-------------|
| **Capacity** | 20% | GIS calculation | Estimated # of units |
| **Størrelse** | 15% | GIS | Total area |
| **Konfliktfrihet** | 20% | GeoNorge | Absence of restrictions |
| **Sentralitet** | 15% | SSB | Distance to transit |
| **Infrastruktur** | 10% | Kartverket | Road/water/sewer |
| **Kommunal vilje** | 10% | Phase 1 data | Political support |
| **Eierstruktur** | 10% | Matrikkel | Fewer owners = easier |

### Target Lot Profile
- **Size:** 2,000–50,000 m²
- **Capacity:** 20–200 units
- **Development timeline:** 2–10 years
- **Type:** Apartments, row houses
- **Zoning:** BO/BL in kommuneplan, not yet regulated

---

## 4. DATA SOURCES & APIs

### Tier 1: Core Free APIs

#### 1. Kartverket / Geonorge
**Purpose:** Property boundaries, cadastre, addresses
**Access:** Free (WFS/WMS), Matrikkel requires agreement
**Key Data:**
- Eiendomsgrenser (property boundaries)
- Matrikkel (cadastre with owners)
- Adresser (addresses with coordinates)
- Administrative boundaries

**Critical for:**
- Identifying lot boundaries
- Owner lookup (hjemmelshaver)
- Address geocoding

#### 2. SSB (Statistics Norway) PxWebApi v2
**Purpose:** Municipal statistics
**Access:** Free, no auth
**Key Data:**
- Population demographics
- Housing statistics
- Income levels
- Employment rates
- Building permits

**Critical for:**
- Municipality scoring
- Demographic context
- Housing need indicators

#### 3. Kommunedatabasen (Sikt)
**Purpose:** Historical municipality data
**Access:** Free, registration required
**Key Data:**
- Political composition
- Historical trends
- Election results
- Municipal finances

**Critical for:**
- Political will assessment
- Historical context
- Trend analysis

### Tier 2: Specialized Data

#### 4. GeoNorge WFS (Municipal Plans)
**Purpose:** Planning data
**Access:** Free but fragmented
**Key Data:**
- Kommuneplaner (municipal plans)
- Reguleringsplaner (detailed plans)
- Arealformål (land use zones)

**Critical for:**
- Identifying BO/BL zones
- Differanse analysis
- Buildable area calculation

**Note:** From 2026, must query each municipality's WFS individually

#### 5. Arealplaner.no
**Purpose:** National planning portal
**Access:** Free WMS/WFS
**Key Data:**
- Aggregated plan data
- Visualization
- Plan status

**Critical for:**
- Cross-municipality view
- Plan status verification
- Backup data source

#### 6. Husbanken
**Purpose:** Social housing data
**Access:** Limited public API
**Key Data:**
- Housing allowance stats
- Social housing policies
- Support programs

**Critical for:**
- Municipal social housing activity
- Policy alignment

### Tier 3: Commercial (Optional)

#### 7. Eiendomsverdi / Infotorg
**Purpose:** Property valuations
**Access:** Paid commercial API
**Key Data:**
- Automated valuations (AVM)
- Transaction history
- Market prices

**Critical for:**
- Price estimation
- Market analysis
- ROI calculations

---

## 5. SYSTEM ARCHITECTURE (Hypothetical)

### Core Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TOMTE-SOURCING SYSTEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  MUNICIPALITY│  │    LOT       │  │    OWNER     │              │
│  │  FILTERING   │→ │  IDENTIFIER  │→ │   LOOKUP     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                 │                 │                       │
│         ▼                 ▼                 ▼                       │
│  ┌──────────────────────────────────────────────────────┐          │
│  │              POSTGIS + SPATIAL DATABASE              │          │
│  └──────────────────────────────────────────────────────┘          │
│         │                 │                 │                       │
│         ▼                 ▼                 ▼                       │
│  ┌──────────────────────────────────────────────────────┐          │
│  │               SCORING ENGINE (0-100)                 │          │
│  └──────────────────────────────────────────────────────┘          │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────┐          │
│  │               CRM PIPELINE (Airtable)                │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Input:** Priority municipalities from Phase 1
2. **Fetch:** Kommuneplaner (BO/BL zones) from GeoNorge
3. **Fetch:** Reguleringsplaner (developed areas)
4. **Calculate:** Differanse = zones not yet developed
5. **Filter:** Minimum size, no conflicts
6. **Score:** 0-100 based on criteria
7. **Enrich:** Add owner info from Matrikkel
8. **Output:** Prioritized list to CRM

---

## 6. KEY RESEARCH QUESTIONS

### For Each API, We Need to Know:

1. **What specific endpoints can identify developable lots?**
   - Exact WFS layer names
   - Query parameters for BO/BL zones
   - Spatial filters

2. **How do we calculate the "differanse"?**
   - Which plan layers to compare
   - How to handle overlapping polygons
   - Edge cases and exceptions

3. **What's the data quality?**
   - Coverage per municipality
   - Update frequency
   - Completeness of plan data

4. **What are the technical limitations?**
   - Rate limits
   - Query complexity
   - Response formats

5. **What manual steps remain?**
   - Data verification needed
   - Owner contact validation
   - Site visits required

### System Design Questions:

1. **Can we fully automate lot identification?**
   - Or do we need manual review?
   - What confidence threshold?

2. **How do we verify lot viability?**
   - AI analysis of satellite imagery?
   - Cross-reference multiple sources?
   - Manual spot-checking?

3. **What's the minimum viable system?**
   - Which APIs are absolutely required?
   - What can we launch without?

4. **How do we handle data gaps?**
   - Missing kommuneplaner
   - Incomplete reguleringsplaner
   - Unavailable owner data

---

## 7. IMPLEMENTATION APPROACHES

### Option A: Lean Launch (4 weeks, 50-75k NOK)
- Manual identification of 200+ lots
- Basic Airtable CRM
- SOPs for manual research
- Limited automation

### Option B: Professional (10 weeks, 250-350k NOK) ⭐ RECOMMENDED
- Automated differanse calculation
- 5,000+ auto-identified lots
- Daily data sync
- Full owner lookup
- Scoring system

### Option C: Enterprise (20 weeks, 600-800k NOK)
- ML predictions
- Real-time monitoring
- Competitive intelligence
- Custom CRM
- API for integrations

---

## 8. NEXT STEPS

1. **Deep API Research** (Spawn sub-agents)
   - Kartverket/Geonorge capabilities
   - GeoNorge WFS specifics
   - SSB data for lot context
   - Kommunedatabasen integration

2. **System Design Document**
   - Architecture decisions
   - Data flow diagrams
   - API integration specs

3. **SOP Development**
   - Manual verification processes
   - Data quality checks
   - Owner outreach workflows

4. **Prototype Planning**
   - Pilot municipality selection
   - Test cases for validation
   - Success metrics

---

## 9. APPENDICES

### Appendix A: Terminology
- **Tomt:** Lot/parcel of land
- **Kommuneplan:** Municipal master plan
- **Reguleringsplan:** Detailed zoning plan
- **Arealformål:** Land use designation
- **BO:** Bolig (residential)
- **BL:** Blanding (mixed use)
- **GNR/BNR:** Property identification numbers
- **Hjemmelshaver:** Registered owner

### Appendix B: Data Sources Contact Info
- **Kartverket:** Contact via website form
- **SSB:** statistikkbanken@ssb.no
- **Kommunedatabasen:** kdb@sikt.no
- **Husbanken:** Contact through official channels

### Appendix C: Existing Research Files
- `RESEARCH-SUMMARY.md` — Comprehensive API analysis
- `API-COST-ANALYSIS.md` — Cost breakdown
- `MEETING-SYNTHESIS.md` — Approach options
- `TBS_Fase2_Tomtesourcing.docx.md` — Detailed requirements

---

*This document serves as the master reference for the 3dje Boligsektor tomte-sourcing system. Spawned research tasks should reference this context.*
