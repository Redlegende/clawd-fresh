# 3dje Boligsektor — MVP Scope & Build Plan
## Demo-Ready System for Apartment Developer Presentation

**Timeline:** 5 Days (This Week)  
**Budget:** 5000 NOK  
**Goal:** Working proof-of-concept + presentation for developer buy-in

---

## MVP PHILOSOPHY

### What's IN (This Week)
- ✅ Core differanse algorithm (kommuneplan − reguleringsplan)
- ✅ 1-2 pilot municipalities with real data
- ✅ 20-50 identified lots (raw)
- ✅ Manual verification SOPs
- ✅ Basic scoring (size + capacity)
- ✅ Airtable CRM setup
- ✅ Presentation deck

### What's OUT (Post-Sale)
- ❌ Automatic owner lookup (manual only)
- ❌ All 356 municipalities (2 only)
- ❌ Advanced scoring (SSB context data)
- ❌ Web dashboard (Airtable only)
- ❌ Daily automated sync (manual runs)
- ❌ AI/ML features
- ❌ Conflict checking automation

### Why This Scope

**For the Demo:**
- Proves the concept works
- Shows real value (actual lots)
- Can be built in 5 days
- Costs ~5000 NOK

**For the Sale:**
- Developers see immediate utility
- Clear upgrade path (retainer model)
- You look professional and capable

---

## 5-DAY BUILD PLAN

### DAY 1: Setup & Pilot Selection (Monday)

**Morning (2 hours):**
- [ ] Review Phase 1 municipality list
- [ ] Select 2 pilot municipalities:
  - Criteria: Complete plan data, high Phase 1 score, variety
  - Suggestion: 1 Oslo-region, 1 elsewhere
- [ ] Document selection rationale

**Afternoon (3 hours):**
- [ ] Set up Python environment:
  ```bash
  python -m venv venv
  source venv/bin/activate
  pip install geopandas shapely requests pandas
  ```
- [ ] Test Arealplaner.no WFS connection
- [ ] Test Kartverket WFS connection
- [ ] Document any issues

**Deliverable:**
- Environment ready
- 2 pilot municipalities selected
- API connections tested

---

### DAY 2: Data Fetching (Tuesday)

**Morning (3 hours):**
- [ ] Build kommuneplan fetcher:
  ```python
  # fetch_kommuneplan.py
  def fetch_kommuneplan(kommune_nr):
      """Fetch BO/BL zones from Arealplaner.no"""
      # WFS query for arealformal IN ('BO', 'BL')
      pass
  ```
- [ ] Test with Pilot 1
- [ ] Validate output (check expected zones exist)

**Afternoon (3 hours):**
- [ ] Build reguleringsplan fetcher:
  ```python
  # fetch_reguleringsplan.py
  def fetch_reguleringsplan(kommune_nr):
      """Fetch vedtatt reguleringsplaner"""
      # WFS query for planstatus = 'Vedtatt'
      pass
  ```
- [ ] Test with Pilot 1
- [ ] Document data quality issues

**Deliverable:**
- Working fetchers for both plan types
- Raw data saved for Pilot 1
- Quality notes documented

---

### DAY 3: Differanse Engine (Wednesday)

**Morning (3 hours):**
- [ ] Implement differanse calculation:
  ```python
  # calculate_differanse.py
  def calculate_differanse(kommuneplan, reguleringsplaner):
      """Find developable areas"""
      # 1. Union all reguleringsplaner
      # 2. Subtract from kommuneplan BO/BL zones
      # 3. Filter > 2000 m²
      # 4. Return GeoDataFrame
      pass
  ```
- [ ] Test with Pilot 1 data
- [ ] Visualize results (matplotlib/QGIS)

**Afternoon (3 hours):**
- [ ] Add size-based filtering
- [ ] Add basic capacity estimation:
  ```python
  # Rough estimate: area_m2 / 80 = units
  lot['estimated_units'] = int(lot.area_m2 / 80)
  ```
- [ ] Run on Pilot 2
- [ ] Compare results (sanity check)

**Deliverable:**
- Working differanse engine
- 20-50 raw lots identified across 2 pilots
- Visualizations for each lot

---

### DAY 4: Scoring & CRM (Thursday)

**Morning (3 hours):**
- [ ] Build simple scoring:
  ```python
  def score_lot(lot):
      score = 0
      # Size: up to 30 pts
      score += min(lot.area_m2 / 1000 / 5 * 30, 30)
      # Capacity: up to 40 pts
      score += min(lot.estimated_units / 50 * 40, 40)
      # Strategic: 30 pts (placeholder)
      score += 30
      return min(score, 100)
  ```
- [ ] Score all identified lots
- [ ] Sort by score

**Afternoon (3 hours):**
- [ ] Set up Airtable CRM:
  - Table: Lots
    - Lot ID, Kommune, Area, Units, Score, Status
  - Table: Owners
    - Name, Contact, Status, Notes
  - Table: Activities
    - Date, Type, Notes, Related Lot
- [ ] Import scored lots
- [ ] Test manual entry workflow

**Evening (1 hour):**
- [ ] Run SOP-001 (Initial Screening) on top 20 lots
- [ ] Flag obvious rejects

**Deliverable:**
- Scored lots in Airtable
- CRM ready for tracking
- Top 20 lots pre-screened

---

### DAY 5: Presentation Prep (Friday)

**Morning (3 hours):**
- [ ] Complete SOPs on top 10 lots:
  - SOP-002: Access verification
  - SOP-003: Conflict check
  - SOP-004: Owner identification (manual)
  - SOP-005: Final scoring
- [ ] Prepare lot summaries

**Afternoon (3 hours):**
- [ ] Build presentation deck:
  1. **Problem:** Finding developable land is hard
  2. **Solution:** Automated differanse system
  3. **Demo:** Show actual lots in [Pilot 1]
  4. **Process:** How it works (diagram)
  5. **Quality:** Manual verification SOPs
  6. **Pricing:** 5000 NOK setup + retainer
  7. **Roadmap:** What comes next
  8. **CTA:** Sign up for pilot

**Evening (1 hour):**
- [ ] Practice demo
- [ ] Prepare for questions
- [ ] Send calendar invite to developers

**Deliverable:**
- 10 verified, scored lots
- Presentation deck
- Demo ready

---

## SUCCESS CRITERIA

### Technical (Must Have)
- [ ] Differanse algorithm works for 2 municipalities
- [ ] Identifies 20+ potential lots
- [ ] Basic scoring functional
- [ ] Airtable CRM operational

### Quality (Must Have)
- [ ] At least 5 lots score >60/100
- [ ] SOPs followed for top 10 lots
- [ ] No obvious false positives
- [ ] Professional presentation

### Business (Must Have)
- [ ] Developers understand the value
- [ ] Clear pricing communicated
- [ ] At least 1 developer interested
- [ ] Next steps agreed

---

## RISK MITIGATION

| Risk | Probability | Mitigation |
|------|-------------|------------|
| API doesn't work day-of | Medium | Test thoroughly Day 1-2, have screenshots backup |
| Data quality poor in pilots | Medium | Have 2 backup municipalities ready |
| Differanse produces nonsense | Low | Manual validation SOP, sanity checks |
| Developers don't see value | Medium | Focus on time savings, show competitor analysis |

---

## POST-DEMO NEXT STEPS

### If Developers Sign Up

**Week 2:**
- [ ] Finalize contract
- [ ] Receive payment (5000 NOK)
- [ ] Add their priority municipalities
- [ ] Run full analysis

**Week 3-4:**
- [ ] Expand to 10 municipalities
- [ ] Refine scoring with their feedback
- [ ] Set up monthly reporting

**Month 2+:**
- [ ] Implement retainer model
- [ ] Scale system
- [ ] Add features based on demand

### If Developers Need More Convincing

- [ ] Offer free pilot (1 municipality, 30 days)
- [ ] Show competitor analysis
- [ ] Case study from similar project
- [ ] Adjust pricing/terms

---

## BUDGET BREAKDOWN

| Item | Cost | Notes |
|------|------|-------|
| Development time | 5000 NOK | Your time this week |
| APIs | 0 NOK | All free (SSB, Kartverket, Arealplaner) |
| Tools | 0 NOK | Python, Airtable free tier |
| Hosting | 0 NOK | Local/Jupyter for demo |
| **Total** | **5000 NOK** | |

---

## WHAT YOU'RE SELLING

### The 5000 NOK Setup Includes:
1. System configured for your municipalities
2. Initial scan (20-50 lots identified)
3. Manual verification of top lots
4. Airtable CRM setup
5. Training session (1 hour)

### The Monthly Retainer Includes:
1. Ongoing monitoring of municipalities
2. New lot alerts
3. Monthly reports
4. Priority support
5. System updates

**Pricing Tiers:**
- Basic: 2000 NOK/mo (5 municipalities)
- Growth: 5000 NOK/mo (20 municipalities)
- Enterprise: 15000 NOK/mo (unlimited)

---

## CHECKLIST: BEFORE PRESENTATION

- [ ] Demo runs without errors
- [ ] 10+ verified lots ready to show
- [ ] Airtable looks professional
- [ ] Presentation deck complete
- [ ] Pricing clear
- [ ] Contract template ready
- [ ] Calendar invite sent
- [ ] Backup plan (screenshots if demo fails)

---

*This MVP proves the concept and secures developer buy-in. The full system gets built after you have paying clients.*
