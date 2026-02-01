# Phase 2: Workflow Specification

**Status:** Research Complete  
**Date:** 2026-01-28  
**Goal:** Step-by-step workflow for tomte-sourcing system

---

## 🎯 Core Logic

```
KOMMUNEPLAN BOLIG − VEDTATT REGULERINGSPLAN = UTVIKLINGSMULIGHET
```

**Translation:** Find areas zoned for housing in municipal plans that don't yet have detailed zoning plans approved.

---

## 🔄 Master Workflow

### Stage 1: Data Collection (Automated)

#### 1.1 Kommuneplan - Bolig Arealformål
**Source:** Geonorge WFS  
**API:** `wfs.geonorge.no/skwfs1/wfs.arealplaner`  
**Query:** `arealformål = 'Bolig'`  
**Output:** Polygons of all housing-zoned areas

```python
# Pseudocode
wfs = WebFeatureService(url=geonorge_wfs)
kommuneplan_bolig = wfs.getfeature(
    typename='arealplaner:Kommuneplan',
    filter="arealformål = 'Bolig'"
)
```

#### 1.2 Reguleringsplaner - Vedtatte
**Source:** Geonorge WFS  
**Query:** `planstatus = 'Vedtatt'`  
**Output:** Polygons of all approved detailed plans

```python
reguleringsplaner = wfs.getfeature(
    typename='arealplaner:Reguleringsplan',
    filter="planstatus = 'Vedtatt'"
)
```

#### 1.3 Calculate Differanse
**Operation:** GIS overlay analysis  
**Tool:** PostGIS / GeoPandas  
**Output:** Polygons with development potential

```sql
-- PostGIS SQL
SELECT 
    kp.geom,
    kp.areal,
    ST_Area(kp.geom) as area_m2
FROM kommuneplan_bolig kp
LEFT JOIN reguleringsplaner rp 
    ON ST_Intersects(kp.geom, rp.geom)
WHERE rp.id IS NULL  -- Not covered by detailed plan
   OR ST_Area(ST_Intersection(kp.geom, rp.geom)) / ST_Area(kp.geom) < 0.9
```

### Stage 2: Scoring & Prioritization

#### 2.1 Calculate Base Metrics

| Metric | Calculation | Source |
|--------|-------------|--------|
| Størrelse | Area in daa | PostGIS ST_Area |
| Kapasitet | Area / 400 m² per unit | Estimate |
| Sentralitet | Distance to nearest transit | SSB data + OSM |

#### 2.2 Enrich with External Data

**Demographics (SSB):**
```python
ssb_query = {
    "Region": [kommune_nr],
    "ContentsCode": ["Folkemengde"],
    "Tid": ["2025"]
}
```

**Municipal Economy (SSB KOSTRA):**
- Netto driftsresultat
- Gjeldsnivå
- ROBEK status

**Housing Data (Husbanken):**
- Boligsosiale indikatorer
- Startlån statistics

#### 2.3 Apply Scoring Model

```python
score = (
    størrelse * 0.15 +
    kapasitet * 0.20 +
    sentralitet * 0.15 +
    infrastruktur * 0.10 +
    konfliktfrihet * 0.20 +
    kommunal_vilje * 0.10 +
    eierstruktur * 0.10
)
```

**Output:** Ranked list of potential lots

### Stage 3: Owner Identification

#### 3.1 Matrikkel Lookup
**Source:** Kartverket Matrikkel API  
**Input:** Polygon (from Stage 2)  
**Output:** List of gnr/bnr (property IDs)

```python
# Spatial join: polygon → matrikkel units
matrikkelenheter = matrikkel_api.spatial_query(
    polygon=lot_polygon,
    return_fields=['gnr', 'bnr', 'fnr', 'snr']
)
```

#### 3.2 Owner Lookup
**Source:** Kartverket OR Ambita  
**Input:** gnr/bnr list  
**Output:** Owner information (hjemmelshavere)

```python
for unit in matrikkelenheter:
    owner = matrikkel_api.get_owner(
        gnr=unit.gnr,
        bnr=unit.bnr
    )
    # Returns: name, address (if available)
```

**GDPR Note:** Legal basis required (legitimate interest or legal obligation)

#### 3.3 Contact Enrichment
**Sources:**
- 1881.no API
- Proff.no
- Manual research

**Output:** Phone numbers, emails for owners

### Stage 4: Outreach

#### 4.1 Grunneierbrev (Landowner Letter)
**Template:** Personalized, professional  
**Content:**
- Reference specific property (gnr/bnr)
- Explain opportunity (kommuneplan = housing allowed)
- Offer value (TBS takes regulatory risk)
- Call to action (meeting)

**Delivery:**
- Digital (email) where available
- Physical mail otherwise

#### 4.2 Tracking
**CRM:** Airtable / Monday.com  
**Fields:**
- Property ID
- Owner name
- Contact date
- Response status
- Next action

#### 4.3 Follow-up
**Timeline:**
- Day 0: Send letter
- Day 3: Email follow-up (if email available)
- Day 14: Phone call
- Day 30: Second letter

### Stage 5: Negotiation

#### 5.1 Initial Meeting
**Goal:** Understand owner situation and interest
**Topics:**
- Timeline
- Expectations
- Knowledge of development potential

#### 5.2 LOI (Letter of Intent)
**Terms:**
- Exclusive negotiation period (6-12 months)
- Option to purchase upon approval
- Price framework (market-based)

#### 5.3 Due Diligence
**Checks:**
- Clear title (Ambita/Kartverket)
- No competing mortgages
- Zoning verification

#### 5.4 Opsjon/Contract
**Options:**
- **Option agreement:** Right to buy upon approval
- **Purchase:** Immediate (if already developable)
- **Joint venture:** Partner with owner

### Stage 6: Project Development

#### 6.1 Regulatory Process
**Activities:**
- Detailed zoning plan (reguleringsplan)
- Environmental assessments
- Infrastructure planning

#### 6.2 Funding
**Sources:**
- Etablererbolig financing
- Construction loans
- Investor capital

#### 6.3 Construction
**Partners:**
- Contractors
- Architects
- Project managers

---

## 🔄 Parallel Motors

### Motor A: Datamotor (Automated)
**Purpose:** Systematic GIS analysis  
**Frequency:** Daily/weekly batch  
**Output:** Ranked lot list

### Motor B: Meglermotor
**Purpose:** Broker relationships  
**Activities:**
- Maintain database of 30+ brokers
- Quarterly updates
- Share investment mandate

### Motor C: Grunneiermotor
**Purpose:** Direct landowner outreach  
**Activities:**
- Batch letter campaigns
- Phone follow-up
- Meeting scheduling

### Motor D: Kommunemotor
**Purpose:** Municipal relationships  
**Activities:**
- Direct contact with planners
- Early dialogue
- Political positioning

---

## 📊 Pipeline Metrics

| Stage | Target Volume | Conversion |
|-------|---------------|------------|
| Identified (GIS) | ~10,000 polygons | 100% |
| Kvalifisert (score >60) | ~2,000 | 20% |
| Kontaktet | ~500-1,000 | 25-50% |
| Dialog | ~100 | 10-20% |
| LOI/Opsjon | ~30-80 | 30-80% |
| **Prosjekt** | **10,000+ boliger** | **Goal** |

---

## 🛠️ Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                           │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ Geonorge    │ SSB         │ Kartverket  │ Husbanken       │
│ WFS/WMS     │ PxWebAPI    │ Matrikkel   │ Monitor         │
├─────────────┴─────────────┴─────────────┴─────────────────┤
│                        ETL PIPELINE                        │
│         (Python + GeoPandas + Apache Airflow)              │
├─────────────────────────────────────────────────────────────┤
│                      POSTGIS DATABASE                       │
│   (Polygons, properties, owners, scores, status)           │
├─────────────────────────────────────────────────────────────┤
│                      SCORING ENGINE                         │
│            (Multi-factor model, 0-100 points)              │
├─────────────────────────────────────────────────────────────┤
│                        CRM SYSTEM                           │
│          (Airtable / Monday.com / Custom)                  │
├─────────────────────────────────────────────────────────────┤
│                      OUTREACH TOOLS                         │
│    (Letter generator, email automation, phone scripts)     │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Key Limitations

### Data Limitations
1. **Arealplaner.no** - No unified API, fragmented municipal systems
2. **Geonorge** - Vedtatte planer only, not ongoing processes
3. **Kartverket** - 2-4 week registration required
4. **SSB** - Historical data, not real-time

### Operational Limitations
1. **GDPR** - Owner data requires legal basis
2. **Volume** - 356 municipalities, different systems
3. **Time** - Regulatory process 2-10 years
4. **Capital** - Requires significant investment capacity

---

## ✅ Success Criteria

**6-Month Targets:**
- [ ] 5,000+ polygons analyzed
- [ ] 1,000+ qualified (score >60)
- [ ] 300+ landowners contacted
- [ ] 50+ active dialogues
- [ ] 10+ LOI/options signed
- [ ] **5,000+ boliger in pipeline**

---

## 📅 Next Steps

1. **Week 1:** Set up PostGIS database
2. **Week 2:** Implement Geonorge WFS connection
3. **Week 3:** Build scoring engine
4. **Week 4:** Register Kartverket API access
5. **Week 5-6:** Integrate SSB data
6. **Week 7-8:** Build CRM + outreach tools

---

*Workflow based on research of 7 Norwegian data APIs*  
*Created: 2026-01-28*
