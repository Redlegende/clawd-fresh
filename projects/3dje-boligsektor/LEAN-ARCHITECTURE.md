# 3dje Boligsektor — Lean System Architecture
## Demo-Ready Design for Apartment Developer Presentation

**Date:** February 2, 2026  
**Budget:** 5000 NOK Initial Development  
**Model:** Setup fee + Monthly Retainer  
**Goal:** Demonstrate lot-finding capability to secure developer buy-in

---

## EXECUTIVE SUMMARY FOR DEVELOPERS

### What This System Does
Automatically identifies land in Norwegian municipalities where:
1. Zoning allows apartment construction (BO/BL zones in kommuneplan)
2. Land isn't already detailed-regulated (not in vedtatt reguleringsplan)
3. Meets minimum size for profitable development (2000+ m²)

### The "Differanse" Concept
```
KOMMUNEPLAN (areas where housing is allowed)
     −
REGULERINGSPLAN (areas already developed)
     =
OPPORTUNITY (your potential lots)
```

### Value Proposition
- **Manual research:** Weeks to scan one municipality
- **Our system:** Hours to scan entire kommune, prioritized by score
- **Result:** You get first look at opportunities competitors miss

---

## SYSTEM OVERVIEW (5000 NOK Scope)

### Phase 1: MVP Demo (This Week)

```
┌─────────────────────────────────────────────────────────────┐
│                    TOMTE-FINDER MVP                         │
│                      (5000 NOK Build)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUT: 1-2 Pilot Municipalities                            │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  STEP 1: Fetch Kommuneplan (from Arealplaner.no)    │   │
│  │          Filter: BO/BL zones only                   │   │
│  │          Cost: Free                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  STEP 2: Fetch Reguleringsplaner                    │   │
│  │          Filter: Vedtatt status only                │   │
│  │          Cost: Free                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  STEP 3: Calculate Differanse                       │   │
│  │          Tools: Python + GeoPandas                  │   │
│  │          Output: Polygons of opportunity            │   │
│  └─────────────────────────────────────────────────────┘   │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  STEP 4: Manual Verification (SOP-Guided)           │   │
│  │          Check: Size, access, conflicts             │   │
│  │          Output: Verified lot list                  │   │
│  └─────────────────────────────────────────────────────┘   │
│     │                                                       │
│     ▼                                                       │
│  OUTPUT: Scored lot list in Airtable                        │
│          Ready for developer review                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## TECHNICAL ARCHITECTURE

### Core Components (All Free/Open Source)

| Component | Technology | Cost | Purpose |
|-----------|------------|------|---------|
| **Data Source** | Arealplaner.no WFS | FREE | Kommuneplan + Reguleringsplan |
| **Data Source** | Kartverket WFS | FREE | Property boundaries (teig) |
| **Data Source** | SSB PxWebApi | FREE | Municipality context stats |
| **Processing** | Python + GeoPandas | FREE | Differanse calculation |
| **Database** | Local GeoJSON/Shapefile | FREE | Store results |
| **CRM** | Airtable (Free tier) | FREE | Track lots & outreach |
| **Hosting** | Local / Jupyter | FREE | Demo environment |
| **Maps** | QGIS / GeoNorge | FREE | Visualization |

**Total Infrastructure Cost: 0 NOK**

### Python Stack
```python
# Core libraries (all free)
import geopandas as gpd      # Spatial data processing
import shapely               # Geometry operations
import requests              # API calls
import pandas as pd          # Data manipulation

# Optional visualization
import matplotlib.pyplot as plt
import folium                # Interactive maps
```

---

## THE DIFFERANSE ALGORITHM (Simplified)

### Step-by-Step Logic

```python
def find_developable_lots(kommune_nr):
    """
    Find lots for apartment development.
    Returns: List of potential lots with scores.
    """
    
    # 1. Get kommuneplan — where housing is allowed
    kommuneplan = fetch_from_arealplaner_no(kommune_nr)
    bygge_soner = kommuneplan[
        kommuneplan['arealformal'].isin(['BO', 'BL'])
    ]
    
    # 2. Get reguleringsplaner — what's already developed
    reguleringer = fetch_from_arealplaner_no(kommune_nr, type='reguleringsplan')
    utviklede = reguleringer[
        reguleringer['planstatus'] == 'Vedtatt'
    ]
    
    # 3. Calculate difference
    from shapely.ops import unary_union
    utviklet_omrade = unary_union(utviklede.geometry)
    
    # 4. Find opportunities
    lots = []
    for zone in bygge_soner.itertuples():
        # Subtract developed from buildable
        mulig_omrade = zone.geometry.difference(utviklet_omrade)
        
        # Filter: Must be > 2000 m² (0.2 daa)
        if mulig_omrade.area >= 2000:
            lots.append({
                'geometry': mulig_omrade,
                'area_m2': mulig_omrade.area,
                'estimated_units': int(mulig_omrade.area / 80),  # ~80 m²/unit
                'kommune': kommune_nr
            })
    
    return lots
```

### Scoring (Simple Version)

```python
def score_lot(lot):
    """Score 0-100 based on viability."""
    score = 0
    
    # Size score (bigger = better, up to 5 daa)
    daa = lot['area_m2'] / 1000
    score += min(daa / 5 * 30, 30)  # 30% weight
    
    # Capacity score (more units = better)
    units = lot['estimated_units']
    score += min(units / 50 * 40, 40)  # 40% weight
    
    # Context score (from SSB data)
    # - Population density
    # - Housing demand indicators
    score += 30  # Placeholder for context
    
    return min(score, 100)
```

---

## DATA SOURCES (Detailed)

### 1. Arealplaner.no (Primary Source)

**What it provides:**
- Kommuneplaner (municipal master plans)
- Reguleringsplaner (detailed zoning plans)
- Arealformål (land use zones: BO, BL, etc.)
- Planstatus (vedtatt, under arbeid, etc.)

**Access:**
- URL: https://arealplaner.no/
- API: WFS (Web Feature Service)
- Cost: FREE
- Auth: None required

**How we use it:**
```python
# Query kommuneplan for a municipality
wfs_url = "https://www.arealplaner.no/arcgis/services/Arealplaner/..."

# Get BO/BL zones
filter = "arealformal IN ('BO', 'BL')"
```

### 2. Kartverket WFS (Property Data)

**What it provides:**
- Eiendomsgrenser (property boundaries)
- Teiger (parcels)
- Matrikkel info (gnr/bnr)

**Access:**
- URL: https://wfs.geonorge.no/
- Cost: FREE
- Auth: None for open data

**How we use it:**
```python
# Get properties within a polygon (our lot)
# Cross-reference to find owners manually
```

### 3. SSB (Context Data)

**What it provides:**
- Population by municipality
- Housing statistics
- Building permits
- Income levels

**Access:**
- URL: https://data.ssb.no/api/pxwebapi/v2/
- Cost: FREE
- Rate limit: 30 req/min

---

## MANUAL WORKFLOWS (SOPs)

### Why Manual Steps Are OK

| Task | Automation Level | Reason |
|------|-----------------|--------|
| Fetch plan data | Automated | API available |
| Calculate differanse | Automated | Algorithm-based |
| Size filtering | Automated | Simple threshold |
| **Verify access roads** | **Manual** | Needs human judgment |
| **Check for conflicts** | **Manual** | Vern, flom, etc. |
| **Find owner** | **Manual** | Until Matrikkel approved |
| **Contact owner** | **Manual** | Relationship building |

**Goal:** Automate the 80% (finding), manual the 20% (verifying).

---

## DELIVERABLES FOR DEVELOPERS

### What You Get for 5000 NOK Setup

1. **System Access**
   - Python scripts for lot identification
   - Airtable CRM with your pilot municipalities
   - Documentation for using the system

2. **Initial Scan**
   - 1-2 pilot municipalities fully analyzed
   - 20-50 potential lots identified
   - Scored and prioritized list

3. **SOP Documentation**
   - How to verify lots manually
   - How to find owners
   - How to prioritize outreach

4. **Training**
   - 1-hour walkthrough of system
   - How to read results
   - How to add new municipalities

### What Monthly Retainer Includes

| Tier | Price | Includes |
|------|-------|----------|
| **Basic** | 2000 NOK/mo | 5 municipalities monitored, monthly report |
| **Growth** | 5000 NOK/mo | 20 municipalities, weekly updates, priority lots |
| **Enterprise** | 15000 NOK/mo | All 356 municipalities, daily monitoring, API access |

---

## IMPLEMENTATION PLAN

### This Week (Demo Build)

**Day 1 (Today):**
- [ ] Select 2 pilot municipalities (from Phase 1 top list)
- [ ] Set up Python environment
- [ ] Test Arealplaner.no WFS connection

**Day 2:**
- [ ] Build kommuneplan fetcher
- [ ] Build reguleringsplan fetcher
- [ ] Test with 1 municipality

**Day 3:**
- [ ] Implement differanse calculation
- [ ] Add size filtering
- [ ] Basic scoring

**Day 4:**
- [ ] Create Airtable CRM structure
- [ ] Manual verification SOPs
- [ ] Test end-to-end workflow

**Day 5 (Presentation Day):**
- [ ] Demo with real data
- [ ] Presentation deck
- [ ] Pricing discussion

### Post-Sale (Full Build)

**Week 2-4:**
- Scale to 10 municipalities
- Refine scoring algorithm
- Add SSB context data
- Build simple web interface

**Month 2+:**
- Expand to 50 municipalities
- Automated daily updates
- Owner outreach tracking
- Performance analytics

---

## RISK MITIGATION

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Arealplaner.no data incomplete | Medium | Flag missing data, manual follow-up |
| Differanse calculation errors | Low | Manual spot-checking SOP |
| Developers want more features | High | Clear roadmap, phased delivery |
| Data quality varies by kommune | High | Quality scoring, confidence flags |

---

## SUCCESS METRICS

### Demo Success (This Week)
- [ ] Identify 20+ potential lots in pilot municipalities
- [ ] At least 5 lots score >60/100
- [ ] Developer understands the value
- [ ] Agreement to proceed

### MVP Success (Month 1)
- [ ] System processing 10 municipalities
- [ ] 100+ lots in database
- [ ] 1-2 developer clients signed
- [ ] Monthly retainer revenue started

---

## NEXT STEPS

1. **Approve pilot municipalities** (you pick 2 from Phase 1 list)
2. **I build the demo** (this week)
3. **Present to developers** (end of week)
4. **Iterate based on feedback**
5. **Scale when clients sign**

---

*This is a lean, focused system designed to demonstrate value quickly and cheaply. The 5000 NOK covers setup and initial configuration — ongoing value comes from the monthly retainer for continuous monitoring and updates.*
