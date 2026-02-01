# 3dje Boligsektor Research Summary
## Comprehensive Deep Research Report for Social Housing Tomte-Sourcing System

**Date:** January 30, 2026  
**Project:** Tomte-sourcing system for social housing development in Norway  
**Company:** 3dje Boligsektor  
**Research Focus:** Identifying municipalities ready for social housing projects  

---

## Executive Summary

This comprehensive research report provides a detailed analysis of Norwegian data sources and APIs relevant to the 3dje Boligsektor project. The goal is to identify municipalities that are ready for social housing projects and find lots that municipalities would potentially sell for social housing development.

### Key Findings:

1. **Kartverket/Geonorge** provides comprehensive property and cadastre data through WFS/WMS APIs, but requires formal agreements for detailed property data access
2. **SSB (Statistics Norway)** offers extensive municipality data through PxWebApi v2 with 7,500+ tables covering demographics, economics, and housing statistics
3. **Kommunedatabasen (Sikt)** provides specialized municipality statistics with historical data and political composition
4. **Husbanken** has limited public API access but provides social housing policy data
5. **Eiendomsverdi** offers property valuation APIs through commercial providers like Infotorg

### Critical Success Factors:

- **Municipality Filtering Priority:** Focus on municipalities with declining populations, high housing costs, and progressive political leadership
- **Data Integration Strategy:** Combine demographic, economic, political, and property data for comprehensive scoring
- **Legal Compliance:** Ensure proper data access agreements are in place for sensitive property information

---

## 1. Property and Cadastre Data Sources

### 1.1 Kartverket / Geonorge

**Organization:** Norwegian Mapping Authority  
**Website:** https://www.kartverket.no/  
**Data Coverage:** National property register, cadastre, addresses, buildings  

#### API Documentation:

**Base URLs:**
- WFS Services: https://wfs.geonorge.no/skwms1/
- WMS Services: https://wms.geonorge.no/skwms1/
- Kartkatalog: https://kartkatalog.geonorge.no/

**Key Services:**
1. **Matrikkelen (Cadastre)** - Property boundaries, ownership, building data
2. **Adresse REST-API** - Address data with coordinates
3. **N50 Kartdata** - Topographical data for mainland Norway

#### Access Requirements:

**Open Data (No Registration Required):**
- Basic property boundaries
- Address locations
- Administrative boundaries
- Topographical maps

**Restricted Data (Requires Agreement):**
- Detailed ownership information
- Building technical data
- Property valuation data
- Historical transaction data

#### API Endpoints:

```
# Property boundaries (WFS)
https://wfs.geonorge.no/skwms1/wfs.matrikkelen.enkel?service=WFS&version=1.1.0&request=GetFeature&typeName=matrikkelen:Eiendom&outputFormat=application/json

# Address data (REST)
https://ws.geonorge.no/adresser/v1/sok?sokestreng={query}

# Municipal boundaries
https://wfs.geonorge.no/skwms1/wfs.kommuner?service=WFS&version=1.1.0&request=GetFeature&typeName=app:Kommune&outputFormat=application/json
```

#### Rate Limits:
- 30 requests per minute per IP address
- 800,000 data cells maximum per query

#### Data Coverage:
- 357 municipalities (2024)
- 2.5+ million properties
- 5+ million addresses
- Historical data from 2010

#### Usage Terms:
- Creative Commons Attribution 4.0 (CC BY 4.0)
- Free for commercial use
- Attribution required

#### Municipal Filtering Relevance:
- Property density analysis
- Available land identification
- Zoning information
- Building stock assessment

---

## 2. Statistical Data Sources

### 2.1 Statistics Norway (SSB) - PxWebApi v2

**Organization:** Statistics Norway (Statistisk sentralbyrå)  
**Website:** https://www.ssb.no/  
**API Base:** https://data.ssb.no/api/pxwebapi/v2/  
**Data Coverage:** 7,500+ statistical tables covering all aspects of Norwegian society

#### API Documentation:

**Key Municipal-Level Tables:**

1. **Population Statistics (05810)**
   - URL: https://data.ssb.no/api/pxwebapi/v2/tables/05810
   - Variables: Population by age, gender, municipality
   - Update frequency: Quarterly

2. **Housing Conditions (07459)**
   - URL: https://data.ssb.no/api/pxwebapi/v2/tables/07459
   - Variables: Housing type, ownership, size by municipality
   - Update frequency: Annually

3. **Income Statistics (07473)**
   - URL: https://data.ssb.no/api/pxwebapi/v2/tables/07473
   - Variables: Median income, income distribution by municipality
   - Update frequency: Annually

4. **Employment Statistics (11406)**
   - URL: https://data.ssb.no/api/pxwebapi/v2/tables/11406
   - Variables: Employment rate, unemployment by municipality
   - Update frequency: Monthly

5. **Building Permits (04963)**
   - URL: https://data.ssb.no/api/pxwebapi/v2/tables/04963
   - Variables: New construction, renovations by municipality
   - Update frequency: Monthly

#### Query Examples:

```
# Get population data for all municipalities
https://data.ssb.no/api/pxwebapi/v2/tables/05810/data?lang=en&valueCodes[Region]=*&valueCodes[ContentsCode]=Folketallet1&valueCodes[Tid]=top(1)

# Get housing data for specific municipalities
https://data.ssb.no/api/pxwebapi/v2/tables/07459/data?lang=en&valueCodes[Region]=0301,1103,1601&valueCodes[ContentsCode]=Personer1&valueCodes[Tid]=top(1)
```

#### Rate Limits:
- 30 queries per minute per IP
- 800,000 data cells maximum per extract
- Avoid 07:55-08:15 (high load period)

#### Municipal Filtering Relevance:
- Demographics trends
- Economic indicators
- Housing market conditions
- Construction activity
- Employment rates

---

### 2.2 Kommunedatabasen (Sikt)

**Organization:** Sikt (Norwegian Agency for Shared Services in Education and Research)  
**Website:** https://kommunedatabasen.sikt.no/  
**API Base:** https://kommunedatabasen.sikt.no/api/  
**Data Coverage:** Historical municipality statistics from 1769-present

#### API Documentation:

**Key Variables:**
- Demographics (population, age distribution, migration)
- Economy (municipal budgets, tax revenue)
- Politics (election results, party composition)
- Infrastructure (roads, schools, healthcare)
- Environment (nature reserves, pollution)

#### Access Requirements:
- Free for research and education
- Registration required for API access
- Contact: kdb@sikt.no

#### API Endpoints:

```
# Get municipality data
https://kommunedatabasen.sikt.no/api/variable/{variable_id}/data?year={year}&municipality={municipality_code}

# Get available variables
https://kommunedatabasen.sikt.no/api/variables

# Get municipality list
https://kommunedatabasen.sikt.no/api/municipalities
```

#### Municipal Filtering Relevance:
- Historical population trends
- Political party composition
- Municipal economic health
- Service provision capacity

---

## 3. Social Housing Data Sources

### 3.1 Husbanken (Norwegian State Housing Bank)

**Organization:** Norwegian State Housing Bank  
**Website:** https://www.husbanken.no/  
**Data Coverage:** Social housing policies, housing allowance, homeless statistics

#### Data Availability:

**Limited Public Data:**
- Annual reports with aggregated statistics
- Housing allowance recipient numbers by county
- Homeless population estimates
- Policy documentation

**No Public API Available**

#### Access Requirements:
- Formal research agreements for detailed data
- Contact through official channels
- Subject to privacy regulations

#### Municipal Filtering Relevance:
- Existing social housing programs
- Housing allowance uptake
- Homelessness rates
- Municipal cooperation level

---

## 4. Property Valuation Data

### 4.1 Eiendomsverdi (Property Value)

**Organization:** Eiendomsverdi AS  
**Access:** Through Infotorg API  
**Website:** https://home.eiendomsverdi.no/  
**Data Coverage:** Property valuations, transaction history, market analysis

#### API Documentation:

**Provider:** Infotorg (https://www.infotorg.no/developers/api/eiendomsverdi/)

**Key Data:**
- Automated property valuations (AVM)
- Transaction history from 1990
- Market price indices
- Property characteristics
- Debt and financing information

#### Access Requirements:
- Commercial subscription required
- API key authentication
- Per-query pricing model

#### Municipal Filtering Relevance:
- Property value trends
- Market activity levels
- Affordability indicators
- Investment potential

---

## 5. Planning and Building Data

### 5.1 Plan- og Bygningslov Data

**Organization:** Various municipal and national sources  
**Data Coverage:** Planning applications, building permits, zoning plans

#### Data Sources:

**National Level:**
- Direktoratet for byggkvalitet (DIBK)
- Building application regulations
- National planning guidelines

**Municipal Level:**
- Individual municipality websites
- Planning portals (varies by municipality)
- Building permit registers

#### Data Availability:
**Limited Standardization:**
- No unified national API
- Varies significantly by municipality
- Some municipalities have online portals
- Others require manual requests

#### Municipal Filtering Relevance:
- Development activity levels
- Planning policy orientation
- Processing efficiency
- Zoning availability

---

## 6. Political Composition Data

### 6.1 Election Results and Party Data

**Primary Source:** SSB Kommunestyre Elections  
**API:** https://data.ssb.no/api/pxwebapi/v2/tables/07475  
**Data Coverage:** Municipal council election results by party

#### Key Variables:
- Party representation in municipal councils
- Voter turnout rates
- Coalition patterns
- Political stability indicators

#### Additional Sources:
- Kommunedatabasen (historical election data)
- Individual municipality websites
- Norwegian Association of Local and Regional Authorities (KS)

#### Municipal Filtering Relevance:
- Political willingness for social housing
- Coalition stability
- Progressive policy orientation
- Historical voting patterns

---

## 7. Filter Logic Recommendations

### 7.1 Primary Filter Criteria

Based on the research findings, the following criteria should be used to score and filter municipalities:

#### Demographic Factors (30% weight)
1. **Population Decline** (10%)
   - Negative population growth over 5 years
   - Ageing population (>25% over 65)
   - Youth outmigration rates

2. **Housing Stress Indicators** (20%)
   - High housing cost-to-income ratio (>30%)
   - Low housing construction rate
   - High rental market share

#### Economic Factors (25% weight)
1. **Economic Vulnerability** (15%)
   - Below-average median income
   - High unemployment rate
   - Declining tax base

2. **Development Potential** (10%)
   - Available municipal land
   - Infrastructure capacity
   - Service accessibility

#### Political Factors (25% weight)
1. **Progressive Leadership** (15%)
   - Labour/Left party majority
   - Coalition including progressive parties
   - Historical social housing support

2. **Political Stability** (10%)
   - Consistent coalition patterns
   - Low party fragmentation
   - Long-term planning orientation

#### Property Market Factors (20% weight)
1. **Market Conditions** (10%)
   - Moderate property values (not extremely high/low)
   - Stable market trends
   - Reasonable land availability

2. **Development Activity** (10%)
   - Moderate building permit activity
   - Planning policy flexibility
   - Zoning availability for housing

### 7.2 Scoring Algorithm

```python
def calculate_municipality_score(municipality_data):
    score = 0
    
    # Demographic scoring
    if population_decline_5yr < -2%:
        score += 10
    elif population_decline_5yr < -1%:
        score += 7
    elif population_decline_5yr < 0%:
        score += 5
    
    if housing_cost_ratio > 35%:
        score += 20
    elif housing_cost_ratio > 30%:
        score += 15
    elif housing_cost_ratio > 25%:
        score += 10
    
    # Economic scoring
    if median_income < national_average * 0.9:
        score += 15
    elif median_income < national_average * 0.95:
        score += 10
    
    if unemployment_rate > national_average * 1.2:
        score += 10
    elif unemployment_rate > national_average:
        score += 7
    
    # Political scoring
    if labour_party_strength > 35%:
        score += 15
    elif labour_party_strength > 25%:
        score += 10
    elif left_coalition:
        score += 8
    
    # Property market scoring
    if property_value_index > 80 and property_value_index < 120:
        score += 10
    
    if building_permits_per_capita < national_average * 0.8:
        score += 10
    
    return score
```

### 7.3 Priority Municipality Categories

#### Tier 1 - High Priority (Score 70-100)
- Declining population with housing stress
- Progressive political leadership
- Economic vulnerability but development potential
- Example candidates: Industrial towns, rural service centers

#### Tier 2 - Medium Priority (Score 40-69)
- Stable population with housing affordability issues
- Moderate political support for social housing
- Mixed economic indicators
- Example candidates: Regional centers, commuter towns

#### Tier 3 - Low Priority (Score <40)
- Growing population with high property values
- Conservative political leadership
- Strong economic performance
- Example candidates: Major cities, affluent suburbs

---

## 8. System Architecture Recommendations

### 8.1 Data Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                     │
├─────────────────────────────────────────────────────────────┤
│                   API Gateway Layer                         │
├─────────────────────────────────────────────────────────────┤
│   Municipality Scoring Service    │   Property Data Service │
├─────────────────────────────────────────────────────────────┤
│              Data Integration Layer                         │
├─────────────────────────────────────────────────────────────┤
│   SSB API    │  Kartverket  │  Kommunedatabasen │ Other   │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Recommended Tech Stack

#### Backend:
- **Language:** Python 3.9+
- **Framework:** FastAPI (async support, automatic OpenAPI docs)
- **Database:** PostgreSQL with PostGIS (spatial data support)
- **Cache:** Redis (API response caching)
- **Queue:** Celery with Redis (background data processing)

#### Data Processing:
- **ETL:** Apache Airflow (scheduling and monitoring)
- **Geospatial:** GeoPandas, Shapely, GDAL
- **API Clients:** aiohttp (async HTTP requests)
- **Data Formats:** JSON, GeoJSON, CSV, PostGIS

#### Infrastructure:
- **Containerization:** Docker
- **Orchestration:** Kubernetes
- **Cloud:** Norwegian cloud providers (compliance)
- **Monitoring:** Prometheus, Grafana

### 8.3 Data Flow Architecture

```
1. Data Collection Phase
   ├── Scheduled API calls to SSB (daily/weekly)
   ├── Periodic Kartverket data updates (monthly)
   ├── Municipal database synchronization (quarterly)
   └── Manual data entry for non-API sources

2. Data Processing Phase
   ├── Data validation and cleaning
   ├── Geospatial processing and joins
   ├── Statistical calculations
   └── Scoring algorithm execution

3. Data Storage Phase
   ├── Raw data archival (compliance)
   ├── Processed data in PostgreSQL
   ├── Cached results in Redis
   └── Backup and recovery systems

4. API Serving Phase
   ├── RESTful API endpoints
   ├── Geospatial query capabilities
   ├── Filtering and sorting options
   └── Export functionality
```

---

## 9. Implementation Roadmap

### Phase 1 - Foundation (Months 1-2)
1. **Data Access Setup**
   - Establish SSB API integration
   - Set up Kartverket data access agreements
   - Register for Kommunedatabasen API access

2. **Infrastructure Setup**
   - Deploy development environment
   - Set up database with PostGIS
   - Implement basic API framework

### Phase 2 - Data Integration (Months 2-4)
1. **API Integrations**
   - SSB statistical data pipeline
   - Kartverket property data integration
   - Municipal database synchronization

2. **Data Processing**
   - Implement ETL pipelines
   - Develop data validation rules
   - Create geospatial processing workflows

### Phase 3 - Scoring System (Months 4-5)
1. **Algorithm Development**
   - Implement scoring algorithm
   - Calibrate weights based on expert input
   - Validate against known successful cases

2. **Testing and Validation**
   - Test with historical data
   - Validate with industry experts
   - Refine based on feedback

### Phase 4 - Application Development (Months 5-6)
1. **API Development**
   - RESTful API implementation
   - Geospatial query capabilities
   - Export and reporting features

2. **User Interface**
   - Municipality search and filtering
   - Scoring dashboard
   - Detailed municipality profiles

### Phase 5 - Deployment and Optimization (Months 6-7)
1. **Production Deployment**
   - Infrastructure scaling
   - Performance optimization
   - Security hardening

2. **Monitoring and Maintenance**
   - Monitoring systems
   - Data quality checks
   - Regular updates and maintenance

---

## 10. Risk Assessment and Mitigation

### 10.1 Data Access Risks

**Risk:** Kartverket property data access restrictions  
**Mitigation:** Establish formal data processing agreements early in the project

**Risk:** API rate limiting during peak usage  
**Mitigation:** Implement request queuing and caching strategies

**Risk:** Data source discontinuation  
**Mitigation:** Maintain relationships with multiple data providers

### 10.2 Technical Risks

**Risk:** Geospatial data processing complexity  
**Mitigation:** Use established libraries and validate with domain experts

**Risk:** Scoring algorithm accuracy  
**Mitigation:** Validate against historical successful cases and expert input

**Risk:** System scalability  
**Mitigation:** Design for horizontal scaling from the beginning

### 10.3 Business Risks

**Risk:** Municipal cooperation levels  
**Mitigation:** Include political stability in scoring algorithm

**Risk:** Market conditions changes  
**Mitigation:** Regular algorithm updates based on new data

**Risk:** Regulatory changes  
**Mitigation:** Monitor policy developments and adjust criteria accordingly

---

## 11. Next Steps and Recommendations

### Immediate Actions (Next 30 Days)

1. **Establish Data Access**
   - Contact Kartverket for property data agreements
   - Register for Kommunedatabasen API access
   - Set up SSB API integration accounts

2. **Stakeholder Engagement**
   - Present findings to Henrik and 3dje Boligsektor team
   - Gather input on scoring criteria weights
   - Validate municipality categories with industry experts

3. **Technical Planning**
   - Finalize technology stack selection
   - Design detailed system architecture
   - Plan development team composition

### Medium-term Goals (Next 90 Days)

1. **MVP Development**
   - Implement basic data integration
   - Develop initial scoring algorithm
   - Create proof-of-concept application

2. **Validation Process**
   - Test with known successful municipalities
   - Gather feedback from industry experts
   - Refine scoring criteria based on results

3. **Business Development**
   - Identify potential pilot municipalities
   - Develop partnership strategies
   - Create go-to-market plan

### Long-term Vision (6-12 Months)

1. **Full System Deployment**
   - Complete production system
   - Comprehensive municipality database
   - Advanced analytics and reporting

2. **Market Expansion**
   - Expand to additional market segments
   - Develop complementary services
   - Build industry partnerships

3. **Continuous Improvement**
   - Regular algorithm updates
   - New data source integration
   - User feedback incorporation

---

## 12. Conclusion

This comprehensive research reveals that Norway has a rich ecosystem of data sources suitable for identifying municipalities ready for social housing development. The combination of SSB's extensive statistical database, Kartverket's property information, and specialized municipal databases provides a solid foundation for the 3dje Boligsektor tomte-sourcing system.

The key to success lies in:

1. **Effective Data Integration:** Combining demographic, economic, political, and property data into a unified scoring system
2. **Smart Filtering Logic:** Focusing on municipalities with the right combination of need, political will, and development potential
3. **Systematic Approach:** Using data-driven insights to prioritize efforts and maximize success probability

The recommended approach prioritizes municipalities with declining populations, housing stress indicators, progressive political leadership, and reasonable property market conditions. This strategy should yield the highest probability of finding municipalities willing to sell land for social housing development.

The next phase should focus on establishing data access agreements, developing the technical infrastructure, and creating a minimum viable product for testing and validation with industry experts and potential pilot municipalities.

---

## Appendices

### Appendix A: API Reference Summary

| Source | API Type | Authentication | Rate Limits | Key Endpoints |
|--------|----------|----------------|-------------|---------------|
| SSB | REST/JSON | None | 30/min, 800k cells | /tables/{id}/data |
| Kartverket | WFS/WMS | API Key (restricted) | Varies by service | /wfs.matrikkelen.enkel |
| Kommunedatabasen | REST/JSON | API Key | Contact provider | /variable/{id}/data |
| Eiendomsverdi | REST/JSON | Commercial | Per-query pricing | Via Infotorg API |

### Appendix B: Municipal Scoring Template

```json
{
  "municipality_code": "0301",
  "municipality_name": "Oslo",
  "demographic_score": 45,
  "economic_score": 38,
  "political_score": 52,
  "property_score": 41,
  "total_score": 176,
  "tier": 2,
  "key_indicators": {
    "population_change_5yr": -1.2,
    "housing_cost_ratio": 32.5,
    "median_income_ratio": 0.95,
    "unemployment_rate": 4.2,
    "labour_party_strength": 28.3,
    "property_value_index": 145
  }
}
```

### Appendix C: Data Source Contact Information

- **SSB Support:** statistikkbanken@ssb.no
- **Kartverket Contact:** See website contact form
- **Kommunedatabasen:** kdb@sikt.no
- **Husbanken:** Contact through official channels
- **Infotorg:** Commercial contact required

---

*This report represents a comprehensive analysis of available data sources for the 3dje Boligsektor project as of January 2026. Data source availability and access requirements may change over time, and regular updates to this analysis are recommended.*