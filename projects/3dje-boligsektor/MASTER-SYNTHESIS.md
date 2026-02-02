# 3dje Boligsektor — Master Synthesis Document
## Tomte-Sourcing System: Complete API Analysis & Architecture

**Date:** February 2, 2026  
**Status:** Research Complete — Ready for Implementation  
**Scope:** Automated identification of developable land for social housing

---

## EXECUTIVE SUMMARY

### The Core Challenge
Build a system that automatically identifies land (tomter) in Norwegian municipalities where:
1. Zoning allows housing (BO/BL in kommuneplan)
2. Land isn't already detailed-regulated (not in vedtatt reguleringsplan)
3. Meets minimum criteria for social housing development
4. Has identifiable owners for acquisition outreach

### The Differanse Algorithm (Heart of the System)
```
KOMMUNEPLAN (bolig zones) − REGULERINGSPLAN (vedtatt) = DEVELOPABLE AREA
```

### Key Findings from Deep Research

| Component | Finding | Impact |
|-----------|---------|--------|
| **Property Boundaries** | Available via open WFS | ✅ Ready to use |
| **Owner Lookup** | Requires Kartverket agreement + SOAP | ⚠️ 2-4 week delay |
| **Kommuneplan Data** | Per-municipality WFS (post-2026) | ⚠️ Fragmented, need discovery |
| **SSB Context** | Grunnkrets-level available | ✅ Excellent for scoring |
| **Addresses** | REST API + WFS available | ✅ Ready to use |

### Critical Path to MVP
1. **Week 1-2:** Apply for Kartverket Matrikkel agreement
2. **Week 2-3:** Build kommuneplan WFS discovery system
3. **Week 3-4:** Implement differanse calculation engine
4. **Week 4-6:** Build scoring system + basic CRM

---

## 1. COMPLETE API INVENTORY

### 1.1 Kartverket/Geonorge (Property Data)

#### ✅ Open Data (No Authentication Required)

**WFS: Property Boundaries (Teig)**
```
Endpoint: https://wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig
Type: WFS 2.0
Feature Types: app:Teig, app:Eiendomsgrense
Key Attributes: matrikkelnummertekst (gnr/bnr/fnr), kommunenummer, areal
```

**Capabilities:**
- Query properties within a polygon (spatial filter)
- Get property boundaries as GML
- Cross-reference with addresses
- Supports OGC Filter Encoding 2.0

**REST API: Addresses**
```
Base: https://ws.geonorge.no/adresser/v1/
Endpoints:
  - /sok?sokestreng={query}              # General search
  - /sok?adressenavn={}&kommunenummer={} # Filtered search
  - /punktsok?radius={}&lat={}&lon={}    # Point/radius search
Rate Limit: 10,000 results max
Output: JSON with coordinates (EPSG:4258/25833)
```

#### ⚠️ Restricted Data (Requires Agreement)

**Matrikkel API: Owner Lookup (hjemmelshaver)**
```
Protocol: SOAP (not REST)
Endpoint: https://matrikkel.no/matrikkelapi/wsapi/v1/
Access: Formal agreement required
Legal Basis: "Berettiget interesse" per Utleveringsforskriften §4
Process: Application → Agreement → IP whitelisting
GDPR: Personal data - requires DPA (data processing agreement)
```

**Critical Finding:** Owner data requires individual SOAP calls per property. No bulk endpoint available.

---

### 1.2 GeoNorge / Municipal Plans (The Differanse)

#### ⚠️ Post-2026 Architecture Change

**Context:** From January 1, 2026, national WMS services ended. Must query each municipality's WFS individually.

**Challenge:** No unified national API for kommuneplaner. Each of 356 municipalities may have:
- Different WFS endpoints
- Different layer names
- Different data quality
- Different access methods

**Discovery Mechanism:**
1. GeoNorge Kartkatalog: https://kartkatalog.geonorge.no/
2. CSW (Catalogue Service for Web) query for WFS services
3. Manual municipality-by-municipality mapping

**Common Layer Names (Varies by Municipality):**
```
Kommuneplan:
  - kommuneplaner_arealbruk
  - KP_arealformal
  - Arealformal
  - Planomrade

Reguleringsplan:
  - reguleringsplaner
  - RP_gjeldende
  - Regulert_omrade
```

**Key Attributes to Filter:**
- `arealformal` = 'BO' (Bolig) or 'BL' (Blanding)
- `planstatus` = 'Vedtatt' (approved)

---

### 1.3 SSB PxWebApi v2 (Context Data)

#### ✅ Fully Open, No Authentication

**Base Endpoint:** `https://data.ssb.no/api/pxwebapi/v2`

**Rate Limits:**
- 30 requests per minute
- 800,000 data cells per extract
- Avoid 07:55-08:15 (peak load)

**Critical Tables for Lot Scoring:**

| Table ID | Name | Granularity | Use Case |
|----------|------|-------------|----------|
| **04317** | Grunnkretsenes befolkning | Grunnkrets (G) | Population density |
| **06913** | Befolkningsendringer | Kommune (K) | Growth trends |
| **12558** | Inntektsfordeling | Kommune (K) | Income levels |
| **03723** | Byggeareal | Fylke (F) | Building permits |
| **01182** | Kommunestyrevalg | Kommune (K) | Political composition |

**Grunnkrets: The Secret Weapon**
- 13,000+ micro-areas
- 100-2,000 residents each
- 8-digit codes (first 4 = municipality)
- Perfect for lot-level context

**Example Query:**
```python
# Get population density for grunnkrets 03010201 (Oslo)
GET https://data.ssb.no/api/pxwebapi/v2/tables/04317/data?\
  lang=no&\
  valueCodes[Grunnkrets]=03010201&\
  valueCodes[Tid]=top(1)
```

---

### 1.4 API Cost Summary

| API | Cost | Auth | Limitations |
|-----|------|------|-------------|
| Kartverket WFS | FREE | None | GML output only |
| Kartverket Adresse | FREE | None | 10k results max |
| Kartverket Matrikkel | FREE | Agreement | SOAP, individual lookups |
| GeoNorge WFS | FREE | Varies | Fragmented per municipality |
| SSB PxWebApi | FREE | None | 30 req/min |
| **TOTAL** | **NOK 0** | | |

**Note:** Only commercial option is Eiendomsverdi/Infotorg for AVM valuations (10k-50k NOK/year).

---

## 2. THE DIFFERANSE ALGORITHM (Detailed Design)

### 2.1 Concept

Find areas where:
1. Kommuneplan says "can build housing" (BO/BL zones)
2. Reguleringsplan hasn't already detailed it (not vedtatt)
3. Result = developable opportunity

### 2.2 Algorithm Steps

```python
def calculate_differanse(kommune_nr):
    """
    Find developable areas in a municipality.
    Returns: GeoDataFrame of potential lots
    """
    
    # Step 1: Get kommuneplan - areas zoned for housing
    kommuneplan = fetch_kommuneplan(kommune_nr)
    bygge_soner = kommuneplan[
        kommuneplan['arealformal'].isin(['BO', 'BL', 'B'])
    ]
    
    # Step 2: Get reguleringsplaner - already developed
    reguleringer = fetch_reguleringsplaner(kommune_nr)
    utviklede = reguleringer[
        reguleringer['planstatus'] == 'Vedtatt'
    ]
    
    # Step 3: Union all developed areas into single polygon
    from shapely.ops import unary_union
    utviklet_omrade = unary_union(utviklede.geometry)
    
    # Step 4: Calculate difference for each zone
    potensial_omrader = []
    for zone in bygge_soner.itertuples():
        # Subtract already developed from buildable
        differanse = zone.geometry.difference(utviklet_omrade)
        
        # Filter: minimum 2,000 m² (0.2 daa)
        if differanse.area >= 2000:
            potensial_omrader.append({
                'geometry': differanse,
                'area_m2': differanse.area,
                'kommune': kommune_nr,
                'sonetype': zone.arealformal,
                'zone_id': zone.id
            })
    
    return gpd.GeoDataFrame(potensial_omrader)
```

### 2.3 Edge Cases to Handle

| Case | Handling |
|------|----------|
| Overlapping reguleringsplaner | Union before difference |
| Holes in polygons | Check geometry validity |
| Sliver polygons | Minimum area filter (2,000 m²) |
| Missing kommuneplan | Flag for manual review |
| Missing reguleringsplan | Assume nothing developed |
| Multi-part geometries | Explode to single parts |

### 2.4 Performance Considerations

- **PostGIS vs GeoPandas:** PostGIS for production, GeoPandas for prototyping
- **Spatial Indexing:** R-tree index on all polygon columns
- **Batch Processing:** Process municipalities in parallel
- **Caching:** Cache WFS responses (plans don't change daily)

---

## 3. SYSTEM ARCHITECTURE

### 3.1 Recommended Stack

```
Backend:
  - Python 3.11+
  - FastAPI (async web framework)
  - GeoPandas (spatial processing)
  - Shapely (geometry operations)
  - OWSLib (WFS client)
  - zeep (SOAP client for Matrikkel)

Database:
  - PostgreSQL 15+ with PostGIS 3.3+
  - Stores: polygons, properties, owners, scores

ETL/Orchestration:
  - Apache Airflow (scheduled data sync)
  - Or: Prefect (modern alternative)

Frontend/CRM:
  - Airtable (recommended for MVP)
  - Or: Custom React app

Infrastructure:
  - Docker containers
  - DigitalOcean / AWS / Azure
```

### 3.2 Database Schema (PostGIS)

```sql
-- Municipalities
CREATE TABLE municipalities (
    kommune_nr CHAR(4) PRIMARY KEY,
    name VARCHAR(100),
    geometry GEOMETRY(MULTIPOLYGON, 25833),
    political_score INT,
    demographic_score INT,
    total_score INT
);

-- Kommuneplan zones
CREATE TABLE kommuneplan_zones (
    id SERIAL PRIMARY KEY,
    kommune_nr CHAR(4) REFERENCES municipalities,
    arealformal VARCHAR(10), -- 'BO', 'BL', etc.
    geometry GEOMETRY(MULTIPOLYGON, 25833),
    updated_at TIMESTAMP
);
CREATE INDEX idx_kommuneplan_geom ON kommuneplan_zones USING GIST(geometry);

-- Reguleringsplaner
CREATE TABLE reguleringsplaner (
    id SERIAL PRIMARY KEY,
    kommune_nr CHAR(4) REFERENCES municipalities,
    planstatus VARCHAR(20), -- 'Vedtatt', 'Under arbeid', etc.
    geometry GEOMETRY(MULTIPOLYGON, 25833),
    vedtatt_dato DATE
);
CREATE INDEX idx_regulering_geom ON reguleringsplaner USING GIST(geometry);

-- Potential lots (the differanse results)
CREATE TABLE potential_lots (
    id SERIAL PRIMARY KEY,
    kommune_nr CHAR(4) REFERENCES municipalities,
    geometry GEOMETRY(MULTIPOLYGON, 25833),
    area_m2 DECIMAL(10,2),
    estimated_capacity INT, -- estimated units
    score_total INT,
    score_size INT,
    score_centrality INT,
    score_infrastructure INT,
    score_political INT,
    status VARCHAR(20), -- 'New', 'Under review', 'Contacted', etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
CREATE INDEX idx_lots_geom ON potential_lots USING GIST(geometry);
CREATE INDEX idx_lots_score ON potential_lots(score_total);

-- Properties (from Matrikkel)
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    kommune_nr CHAR(4),
    gnr INT,
    bnr INT,
    fnr INT DEFAULT 0,
    teig_id VARCHAR(50),
    geometry GEOMETRY(MULTIPOLYGON, 25833),
    area_m2 DECIMAL(10,2),
    address VARCHAR(200),
    -- Owner data (requires Matrikkel API)
    owner_name VARCHAR(200),
    owner_address VARCHAR(200),
    owner_contacted BOOLEAN DEFAULT FALSE,
    owner_contact_date DATE
);
CREATE INDEX idx_properties_gnr_bnr ON properties(kommune_nr, gnr, bnr);

-- Spatial join: lots to properties
CREATE TABLE lot_properties (
    lot_id INT REFERENCES potential_lots,
    property_id INT REFERENCES properties,
    overlap_area_m2 DECIMAL(10,2),
    PRIMARY KEY (lot_id, property_id)
);
```

### 3.3 Data Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA COLLECTION LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Daily @ 02:00 (Airflow DAG)                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Fetch Priority Municipalities                        │  │
│  │     └─> From Phase 1 scoring (top 50-100)                │  │
│  │                                                          │  │
│  │  2. For each municipality:                               │  │
│  │     a) Fetch kommuneplan WFS                             │  │
│  │     b) Fetch reguleringsplan WFS                         │  │
│  │     c) Calculate differanse                              │  │
│  │     d) Store in PostGIS                                  │  │
│  │                                                          │  │
│  │  3. Enrich with context data:                            │  │
│  │     a) SSB grunnkrets data (population density)          │  │
│  │     b) Kartverket property boundaries                    │  │
│  │     c) Address lookups                                   │  │
│  │                                                          │  │
│  │  4. Score all lots (0-100)                               │  │
│  │                                                          │  │
│  │  5. Owner lookup (if Matrikkel available):               │  │
│  │     a) Identify properties in each lot                   │  │
│  │     b) Query Matrikkel SOAP API                          │  │
│  │     c) Store owner data (GDPR-compliant)                 │  │
│  │                                                          │  │
│  │  6. Sync to CRM (Airtable)                               │  │
│  │     └─> New high-scoring lots flagged for review         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. SCORING MODEL (Refined)

### 4.1 Final Scoring Weights

| Factor | Weight | Data Source | Calculation |
|--------|--------|-------------|-------------|
| **Capacity** | 25% | GIS | Estimated units (area / 80 m² per unit) |
| **Size** | 15% | GIS | Area in daa (max 20 pts at 5+ daa) |
| **Centrality** | 20% | SSB + Kartverket | Distance to tettsted / transit |
| **Conflict-Free** | 20% | GeoNorge | Absence of vern, flom, støy |
| **Infrastructure** | 10% | Kartverket | Road/water/sewer proximity |
| **Political Will** | 10% | Phase 1 data | Municipality score from Phase 1 |

### 4.2 Score Calculation

```python
def score_lot(lot, context_data):
    score = 0
    
    # Capacity (25% = 25 points max)
    capacity = lot.area_m2 / 80  # rough estimate
    score += min(capacity / 10 * 25, 25)  # 10 units = full points
    
    # Size (15% = 15 points max)
    daa = lot.area_m2 / 1000
    score += min(daa / 5 * 15, 15)  # 5 daa = full points
    
    # Centrality (20% = 20 points max)
    grunnkrets_pop = context_data['population_density']
    score += min(grunnkrets_pop / 1000 * 20, 20)
    
    # Conflict-free (20% = 20 points max)
    conflict_score = check_conflicts(lot.geometry)  # vern, flom, etc.
    score += conflict_score
    
    # Infrastructure (10% = 10 points max)
    infra_score = check_infrastructure(lot.geometry)  # road, VA
    score += infra_score
    
    # Political will (10% = 10 points max)
    political_score = lot.municipality.political_score / 10
    score += political_score
    
    return min(int(score), 100)
```

### 4.3 Priority Tiers

| Score | Tier | Action |
|-------|------|--------|
| 80-100 | A | Immediate outreach priority |
| 60-79 | B | Secondary priority |
| 40-59 | C | Monitor for changes |
| <40 | D | Archive |

---

## 5. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)

**Week 1:**
- [ ] Apply for Kartverket Matrikkel agreement
- [ ] Set up development environment (PostGIS, Python)
- [ ] Build WFS client library
- [ ] Test with 1-2 pilot municipalities

**Week 2:**
- [ ] Implement kommuneplan WFS discovery system
- [ ] Build differanse calculation engine
- [ ] Create database schema
- [ ] Manual validation of results

**Deliverable:** Working differanse calculation for test municipalities

---

### Phase 2: Core System (Weeks 3-5)

**Week 3:**
- [ ] Integrate SSB API for context data
- [ ] Build scoring engine
- [ ] Add property boundary lookups
- [ ] Address enrichment

**Week 4:**
- [ ] Build Airflow DAG for daily sync
- [ ] Implement caching layer
- [ ] Error handling & retries
- [ ] Data quality checks

**Week 5:**
- [ ] Integrate Matrikkel API (once approved)
- [ ] Owner lookup system
- [ ] Airtable CRM sync
- [ ] Basic dashboard

**Deliverable:** Automated system processing top 50 municipalities

---

### Phase 3: Scale & Refine (Weeks 6-8)

**Week 6:**
- [ ] Expand to all 356 municipalities
- [ ] Performance optimization
- [ ] Parallel processing
- [ ] Advanced scoring refinements

**Week 7:**
- [ ] Manual validation SOPs
- [ ] User feedback integration
- [ ] Alerting for high-scoring lots
- [ ] Reporting features

**Week 8:**
- [ ] Documentation
- [ ] Training materials
- [ ] Handover to 3dje Boligsektor
- [ ] Support structure

**Deliverable:** Production-ready system with documentation

---

## 6. RISKS & MITIGATIONS

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Kartverket agreement delayed** | Medium | High | Start with open data only; manual owner research |
| **Incomplete kommuneplan data** | High | Medium | Flag missing data; manual follow-up; use Arealplaner.no as fallback |
| **WFS endpoint changes** | Medium | Medium | Monitoring; flexible layer name mapping; alert on failures |
| **SSB rate limiting** | Low | Low | Caching; backoff strategy; off-peak scheduling |
| **GDPR compliance for owner data** | Medium | High | DPA with Kartverket; secure storage; access controls; retention policies |
| **Data quality issues** | High | Medium | Manual spot-checking; confidence scoring; feedback loop |

---

## 7. MINIMUM VIABLE SYSTEM (MVP)

### What's Essential

1. **Differanse engine** for top 20 municipalities
2. **Basic scoring** (size + capacity + SSB context)
3. **Property boundary lookup** (open WFS)
4. **Manual owner research** (until Matrikkel approved)
5. **Airtable CRM** for tracking

### What's Deferred

- Full 356 municipality coverage (start with 20)
- Automated owner lookup (manual until Matrikkel ready)
- ML predictions
- Real-time monitoring
- Custom CRM

### MVP Timeline: 4 Weeks

**Week 1:** Differanse engine + 5 pilot municipalities  
**Week 2:** Scoring + expand to 20 municipalities  
**Week 3:** Airtable integration + manual owner workflow  
**Week 4:** Polish + documentation  

**MVP Deliverable:** System identifying 100+ scored lots with manual owner outreach process.

---

## 8. NEXT ACTIONS

### Immediate (This Week)

1. **Apply for Kartverket Matrikkel agreement**
   - Contact: kartverket.no
   - Reference: "Berettiget interesse" for social housing development
   - Include: 3dje Boligsektor business case

2. **Select pilot municipalities**
   - 5 municipalities from Phase 1 top list
   - Criteria: Complete plan data, high political score

3. **Set up development environment**
   - PostGIS database
   - Python environment with GeoPandas
   - WFS test client

### Short-term (Next 2 Weeks)

4. Build differanse proof-of-concept
5. Validate results with manual checks
6. Design Airtable CRM structure

### Medium-term (Next 4 Weeks)

7. Integrate Matrikkel API (when approved)
8. Scale to full municipality coverage
9. Production deployment

---

## 9. APPENDICES

### Appendix A: Key API Endpoints Reference

| Purpose | Endpoint | Auth | Notes |
|---------|----------|------|-------|
| Property boundaries | `wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig` | None | GML output |
| Addresses | `ws.geonorge.no/adresser/v1/sok` | None | JSON, max 10k |
| Owner lookup | `matrikkel.no/matrikkelapi/wsapi/v1/` | Agreement | SOAP protocol |
| SSB tables | `data.ssb.no/api/pxwebapi/v2/tables` | None | JSON-Stat2 |
| SSB data | `data.ssb.no/api/pxwebapi/v2/tables/{id}/data` | None | 30 req/min |

### Appendix B: Critical Table IDs

| ID | Name | Use | Granularity |
|----|------|-----|-------------|
| 04317 | Grunnkretsenes befolkning | Population density | Grunnkrets |
| 06913 | Befolkningsendringer | Growth trends | Kommune |
| 12558 | Inntektsfordeling | Income levels | Kommune |
| 03723 | Byggeareal | Building permits | Fylke |
| 01182 | Kommunestyrevalg | Politics | Kommune |

### Appendix C: Code Resources

All code examples available in:
- `projects/3dje-boligsektor/research/API-KARTVERKET-DEEP-DIVE.md`
- `projects/3dje-boligsektor/research/API-SSB-CONTEXT-DEEP-DIVE.md`

### Appendix D: Glossary

- **Teig:** Property parcel
- **Gnr/Bnr:** Farm/unit number (property ID)
- **Hjemmelshaver:** Registered property owner
- **Grunnkrets:** Basic statistical unit (micro-area)
- **Differanse:** Geometric difference (kommuneplan − reguleringsplan)
- **Arealformål:** Land use designation (BO=Bolig, BL=Blanding)

---

*This document synthesizes research from four deep-dive reports. All findings have been validated and cross-referenced for accuracy as of February 2026.*
