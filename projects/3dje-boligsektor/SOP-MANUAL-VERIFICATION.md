# 3dje Boligsektor — SOP: Manual Lot Verification
## Standard Operating Procedures for Quality Assurance

**Purpose:** Ensure identified lots are actually viable before client presentation  
**When:** After automated differanse calculation, before scoring finalization  
**Who:** Jakob (or trained operator)  
**Time per lot:** 5-10 minutes

---

## OVERVIEW

### The Verification Flow

```
AUTOMATED FINDING
       │
       ▼
┌─────────────────┐
│  MANUAL CHECK   │ ← You are here (SOP-guided)
│  (This SOP)     │
└─────────────────┘
       │
       ▼
  SCORE & PRIORITIZE
       │
       ▼
  CLIENT PRESENTATION
```

### Why Manual Verification Matters

| Automated Finding | Manual Check | Why |
|-------------------|--------------|-----|
| Polygon exists | Is it accessible? | Roads matter |
| Size > 2000 m² | Is it buildable? | Slope, terrain |
| BO/BL zoning | Any conflicts? | Vern, flom, støy |
| Not regulated | Owner findable? | Some owners hidden |

**Goal:** Filter out false positives before client sees them.

---

## SOP-001: INITIAL SCREENING (2 min/lot)

### Purpose
Quick triage — is this worth detailed review?

### Checklist

- [ ] **Lot appears on current map**
  - Open Google Maps / Norgeskart
  - Search for coordinates
  - Does terrain match expectation?

- [ ] **Not obviously wrong**
  - Not a lake
  - Not a cliff
  - Not an existing building
  - Not a highway

- [ ] **Rough size plausible**
  - Visual estimate matches calculated area
  - At least 2-3 «mål» (football fields)

### Decision

| Result | Action |
|--------|--------|
| ✅ Pass all checks | Proceed to SOP-002 |
| ❌ Fail any check | REJECT — mark as "Invalid geometry" |

---

## SOP-002: ACCESS VERIFICATION (2 min/lot)

### Purpose
Confirm the lot can actually be built on (access, infrastructure).

### Checklist

- [ ] **Road access exists**
  - Check Norgeskart (kartverket.no)
  - Is there a public road within 100m?
  - Is access reasonable (not through dense forest)?

- [ ] **Not landlocked**
  - Can construction vehicles reach it?
  - No need for expensive access roads?

- [ ] **Utility proximity** (optional but good)
  - Water/sewer nearby? (check kommune website)
  - Power lines visible?

### Tools
- Norgeskart: https://www.norgeskart.no/
- Google Maps Street View (if available)
- Kommune website (VA maps)

### Red Flags (REJECT)
- No road within 200m
- Steep terrain (>15% slope)
- Dense forest requiring major clearing
- Marsh/wetland

---

## SOP-003: CONFLICT CHECK (2 min/lot)

### Purpose
Identify legal/physical barriers to development.

### Checklist

- [ ] **Not in verneområde** (protected area)
  - Check: https://kartkatalog.geonorge.no/
  - Layers: "Naturvern", "Landskapsvernområde"

- [ ] **Not in flomsone** (flood zone)
  - Check: https://www.nve.no/
  - Or: GeoNorge flomdata

- [ ] **Not in støysone** (noise zone)
  - Check proximity to:
    - Highways (>70 dB = problem)
    - Airports
    - Railways

- [ ] **Not kulturminne** (cultural heritage)
  - Check: https://www.kulturminnesok.no/

- [ ] **No apparent ommøblering issues**
  - Not recently subdivided
  - No pending planning disputes

### Tools
- GeoNorge Kartkatalog: https://kartkatalog.geonorge.no/
- NVE (flood): https://www.nve.no/
- Kulturminnesøk: https://www.kulturminnesok.no/

### Decision

| Conflicts Found | Action |
|-----------------|--------|
| None | ✅ Proceed |
| Minor (fixable) | ⚠️ Flag "Needs further review" |
| Major (dealbreaker) | ❌ REJECT |

---

## SOP-004: OWNER IDENTIFICATION (3-5 min/lot)

### Purpose
Find who owns the land (for outreach).

### Method 1: Kartverket/Grunnboka (Free)

1. Go to: https://seeiendom.kartverket.no/
2. Search by address OR click on map
3. Click property → "Grunnboka"
4. Note:
   - GNR/BNR (property ID)
   - Owner name (hjemmelshaver)
   - Owner address

### Method 2: 1881 / Proff (If address known)

1. Search owner name on 1881.no
2. Find phone number
3. Verify address matches

### Method 3: Direct Kontakt (Best for large lots)

1. Check if property has a "gard" (farm) name
2. Search local history / bygdebok
3. Contact local municipality (teknisk etat)
4. Sometimes they know owners of large parcels

### Recording

In Airtable, record:
```
Owner Name: [Full name]
Owner Address: [Address from Grunnboka]
Owner Phone: [From 1881 or manual search]
Contact Status: Not contacted / Letter sent / Called / Meeting set
Notes: [Any relevant info]
```

### If Owner Can't Be Found

- Flag as "Owner research needed"
- Try: Local megler (broker) may know
- Try: Kommune teknisk etat
- Last resort: Send letter to "Eier av gnr X bnr Y"

---

## SOP-005: PRELIMINARY VIABILITY SCORING

### Purpose
Assign confidence score based on manual checks.

### Scoring Matrix

| Factor | Points | How to Judge |
|--------|--------|--------------|
| **Access** | 0-20 | Good road = 20, Poor = 0 |
| **Buildability** | 0-20 | Flat, dry = 20, Steep/wet = 0 |
| **No conflicts** | 0-20 | Clean = 20, Minor issues = 10, Major = 0 |
| **Owner found** | 0-20 | Found + contact = 20, Found only = 10, Unknown = 0 |
| **Strategic fit** | 0-20 | Aligns with kommune goals = 20 |

### Total Score

| Score | Confidence | Action |
|-------|------------|--------|
| 80-100 | ⭐⭐⭐ High | Present to client immediately |
| 60-79 | ⭐⭐ Medium | Present with caveats |
| 40-59 | ⭐ Low | Monitor, don't present yet |
| <40 | — | Reject / archive |

---

## SOP-006: CLIENT PRESENTATION PREP

### Purpose
Format verified lots for developer review.

### Required Info per Lot

```yaml
Lot ID: TBS-2026-001
Kommune: [Name]
Area: [X daa] ([Y] m²)
Estimated Units: [Z] apartments
Zoning: BO/BL (confirmed via Arealplaner.no)
Status: Not regulated (differanse confirmed)

Access:
  Road: [Name] - [Distance]m
  Quality: Good/Fair/Poor

Conflicts: None / [List if any]

Owner:
  Name: [Name]
  Contact: [Phone/Address]
  Status: Not contacted / Contacted

Score: [X]/100
Confidence: High/Medium/Low

Map: [Link to Norgeskart]
Documents: [Link to plan documents]

Recommendation: [Your professional judgment]
```

### Presentation Format

**Airtable View:**
- Gallery view with map screenshot
- Filter: Score >= 60
- Sort: Score descending

**Export Options:**
- PDF report (for email)
- Excel/CSV (for their systems)
- Airtable share link (interactive)

---

## QUALITY CHECKLIST (Before Client Handoff)

For each lot presented to client:

- [ ] SOP-001 passed (initial screening)
- [ ] SOP-002 passed (access verified)
- [ ] SOP-003 passed (no major conflicts)
- [ ] SOP-004 attempted (owner identified or flagged)
- [ ] SOP-005 scored >= 60
- [ ] All info recorded in Airtable
- [ ] Map link included
- [ ] Your professional recommendation noted

---

## COMMON ISSUES & SOLUTIONS

### Issue: Lot is partially developed
**Solution:** Check reguleringsplan date. If recent, may still be opportunity for expansion.

### Issue: Multiple owners (same lot)
**Solution:** List all owners. More complex but not impossible. Score lower (harder deal).

### Issue: Owner is a company/AS
**Solution:** Look up company in Brønnøysund Register Centre. Find CEO or board.

### Issue: Kommuneplan is old (10+ years)
**Solution:** Check if new plan underway. May indicate opportunity (rezoning coming).

### Issue: Lot is forest (productive)
**Solution:** Forest = not necessarily problem. Check if "produktiv skog" — may have restrictions.

---

## TIME BUDGET

| Task | Time/lot | Batch of 20 lots |
|------|----------|------------------|
| SOP-001 Initial | 2 min | 40 min |
| SOP-002 Access | 2 min | 40 min |
| SOP-003 Conflicts | 2 min | 40 min |
| SOP-004 Owner | 4 min | 80 min |
| SOP-005 Scoring | 1 min | 20 min |
| **Total** | **11 min** | **~4 hours** |

**Target:** Process 20 lots per day = 100 lots per week (1 kommune)

---

## DOCUMENT VERSION

**Version:** 1.0  
**Created:** February 2, 2026  
**Author:** Fred (OpenClaw)  
**Review:** Before first client presentation  
**Update:** As processes improve

---

*These SOPs ensure consistent quality while allowing the automated system to do the heavy lifting. The goal: present only high-confidence opportunities to developers.*
