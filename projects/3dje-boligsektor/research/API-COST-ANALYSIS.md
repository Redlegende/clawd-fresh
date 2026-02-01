# API Cost Analysis for 3dje Boligsektor

## Executive Summary

This analysis evaluates Norwegian housing and municipality data APIs for cost-efficiency in the 3dje Boligsektor project. The research identifies several key data sources with varying cost structures, from completely free government APIs to commercial services requiring paid subscriptions.

**Key Findings:**
- **Kartverket/Geonorge** provides extensive property and cadastre data through free WFS/WMS services
- **SSB PxWebApi v2** offers comprehensive municipal statistics completely free with generous rate limits
- **Kommunedatabasen (Sikt)** provides historical municipality data through a free API
- **Commercial APIs** (Eiendomsverdi/Infotorg) require paid subscriptions but offer detailed property valuations
- **Husbanken** has limited public API access
- **Building permit data** is primarily available through SSB rather than DIBK APIs

## Phase 1: Data Collection Results

### 1. Kartverket/Geonorge APIs

**Base URLs:**
- Main API: `https://www.geonorge.no/verktoy/APIer-og-grensesnitt/`
- WFS/WMS Services: `http://wms.geonorge.no/skwms1/`
- Matrikkelen API: `https://www.matrikkel.no/` and `https://nd.matrikkel.no/`

**Authentication:**
- Most WFS/WMS services: **No authentication required** (open data)
- Matrikkelen API: Requires agreement with Kartverket (Norge Digitalt partners get priority access)

**Rate Limits:**
- WFS/WMS services: No explicit rate limits mentioned for open data services
- Matrikkelen API: Rate limits not publicly specified

**Pricing:**
- **Completely FREE** for WFS/WMS services
- Matrikkelen API: Free for approved users with agreement

**Data Coverage:**
- Property boundaries and cadastre data
- Topographical maps (N50, N100, N250, N500, N1000, N2000, N5000)
- Administrative/property boundaries
- Road networks including addresses
- National elevation models
- Place name data
- Historical maps
- Marine geospatial data

**Usage Terms:**
- Creative Commons licensing for most datasets
- Must follow Norwegian Mapping Authority's terms of use
- Attribution required

### 2. SSB (Statistics Norway) PxWebApi v2

**Base URLs:**
- Main API: `https://data.ssb.no/api/pxwebapi/v2/`
- Tables endpoint: `https://data.ssb.no/api/pxwebapi/v2/tables`
- Documentation: `https://www.ssb.no/en/api/pxwebapiv2`

**Authentication:**
- **No authentication required** (completely open)

**Rate Limits:**
- **30 queries per minute per IP address**
- **800,000 data cells per extract maximum**
- URL length limit: ~2,100 characters for GET requests

**Pricing:**
- **Completely FREE** for all users
- Creative Commons Attribution 4.0 International (CC BY 4.0) license

**Data Coverage:**
- Comprehensive municipal statistics
- Housing and construction data
- Population demographics
- Economic indicators by municipality
- Building permit statistics
- Price indices for existing dwellings
- Rental market surveys

**Usage Terms:**
- CC BY 4.0 license - attribution required
- Avoid high-load periods (07:55-08:15 when new figures are published)

### 3. Kommunedatabasen (Sikt)

**Base URLs:**
- Main API: `https://kommunedatabasen.sikt.no/api`
- API Documentation: `https://kommunedatabasen.sikt.no/api` (version 1.1)

**Authentication:**
- **No authentication required** for basic access

**Rate Limits:**
- Not publicly specified

**Pricing:**
- **Completely FREE** for basic access
- Contact kdb@sikt.no for support

**Data Coverage:**
- Historical municipality statistics from 1769 to present
- Demography, economy, employment, politics, health, culture, transportation, natural resources
- Unique feature: data can be retrieved for current municipal boundaries for any historical year
- Handles municipal boundary changes through conversion coefficients

**Usage Terms:**
- Academic/research use encouraged
- Contact support for assistance

### 4. Eiendomsverdi/Infotorg (Commercial)

**Base URLs:**
- API Overview: `https://www.infotorg.no/developers/api/eiendomsverdi/`
- Service Information: `https://www.infotorg.no/tjenester/eiendomsverdi`

**Authentication:**
- Requires commercial agreement and API credentials
- Part of Infotorg developer platform

**Rate Limits:**
- Not publicly specified (commercial service)

**Pricing:**
- **Commercial paid service** - specific pricing requires contact with Eiendomsverdi AS
- Owned by four major Norwegian banks
- Member of European AVM Alliance

**Data Coverage:**
- Property valuations (Automated Valuation Models - AVM)
- Asking price determination
- Public property data
- Floor areas from taxation processes
- Complete Norwegian property market coverage
- Real-time housing market prices
- Services for banking, insurance, real estate brokerage, appraisal, and public administration

**Usage Terms:**
- Commercial subscription required
- Professional use cases (banking, insurance, real estate)

### 5. Husbanken (Housing Bank)

**Base URLs:**
- Main site: `https://www.husbanken.no/english/`
- No dedicated public API found

**Authentication:**
- Limited public data access
- Some data sharing agreements exist (mentioned in privacy policy)

**Rate Limits:**
- Not applicable - no public API

**Pricing:**
- **No public API available**
- Some data may be available through specific agreements

**Data Coverage:**
- Housing allowance data
- Loan customer information
- Interest rates
- Housing policy implementation data

**Usage Terms:**
- Government agency with limited public data APIs
- Data sharing requires specific agreements

### 6. DIBK (Building Authority) Building Permits

**Base URLs:**
- Main site: `https://www.dibk.no/`
- Regulations: `https://www.dibk.no/globalassets/byggeregler/building_application_regulations.pdf`

**Authentication:**
- **No public API available**
- Building permit data primarily available through SSB

**Rate Limits:**
- Not applicable

**Pricing:**
- **No direct API access**
- Data available through SSB statistics

**Data Coverage:**
- Building permit regulations and procedures
- Building statistics aggregated by SSB
- No direct API access to permit database

**Usage Terms:**
- Regulatory authority rather than data provider
- Statistics compiled by SSB

## Phase 2: Cost Analysis & Recommendations

### Cost Analysis Summary

| API Source | Cost Structure | Rate Limits | Data Volume Limits |
|------------|----------------|-------------|-------------------|
| Kartverket WFS/WMS | **FREE** | None specified | Unlimited |
| SSB PxWebApi v2 | **FREE** | 30/min per IP | 800K cells per query |
| Kommunedatabasen | **FREE** | Not specified | Not specified |
| Eiendomsverdi/Infotorg | **Commercial** | Contact vendor | Contact vendor |
| Husbanken | **No API** | N/A | N/A |
| DIBK | **No API** | N/A | N/A |

### Recommended Integration Approach

#### Tier 1: Free Government APIs (Primary Data Sources)
1. **SSB PxWebApi v2** - Core municipal statistics and housing data
2. **Kartverket WFS/WMS** - Property boundaries, cadastre, and geographical data
3. **Kommunedatabasen** - Historical municipal data and boundary changes

#### Tier 2: Commercial APIs (Supplementary Data)
4. **Eiendomsverdi/Infotorg** - Property valuations and market data (if budget allows)

### Implementation Strategy

#### Phase 1: Core Implementation (Free APIs)
- Start with SSB PxWebApi v2 for municipal statistics
- Integrate Kartverket WFS services for property data
- Use Kommunedatabasen for historical context
- Implement rate limiting and caching for SSB API (30/min limit)

#### Phase 2: Enhanced Features (Commercial APIs)
- Evaluate Eiendomsverdi integration based on project budget
- Consider commercial APIs for advanced property valuation features

### Total Estimated API Costs

#### Minimum Cost Scenario (Free APIs Only)
- **Monthly Cost: 0 NOK**
- **Annual Cost: 0 NOK**
- **Coverage: 80-90% of core requirements**

#### Enhanced Scenario (With Commercial APIs)
- **Base Cost: 0 NOK** (free APIs)
- **Eiendomsverdi Cost: Contact vendor** (estimated 10,000-50,000 NOK/year based on usage)
- **Total Annual: 10,000-50,000 NOK** (depending on commercial API usage)

### Filter Logic Recommendations

#### SSB PxWebApi v2 Optimization
- Use efficient query parameters to minimize API calls
- Implement result caching for frequently accessed data
- Use wildcard (*) and range functions to reduce URL length
- Schedule bulk data retrieval during off-peak hours (avoid 07:55-08:15)

#### Kartverket WFS/WMS Optimization
- Leverage WMS for visualization (pre-rendered tiles)
- Use WFS for data queries with spatial filters
- Implement client-side caching for map tiles
- Consider using GeoNorgeAPI .NET library for complex operations

#### Data Integration Strategy
- Combine multiple free APIs to maximize coverage
- Use SSB as primary statistical source
- Supplement with Kartverket for geographical/property data
- Add Kommunedatabasen for historical trends

### System Architecture Sketch

```
┌─────────────────────────────────────────────────────────────┐
│                    3dje Boligsektor Application           │
├─────────────────────────────────────────────────────────────┤
│                    API Integration Layer                    │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │   Caching   │ Rate Limit  │  Data       │  Error       │ │
│  │   Service   │ Manager     │  Transformation│  Handling   │ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Data Sources                             │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │ SSB PxWebApi│ Kartverket  │Kommunedatabas│ Eiendomsverdi│ │
│  │     v2      │ WFS/WMS     │    (Sikt)   │  (Optional)  │ │
│  │   (FREE)    │  (FREE)     │   (FREE)    │ (Commercial) │ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Risk Assessment & Mitigation

#### API Availability Risks
- **SSB Maintenance Windows**: Plan around 05:00 and 11:30 metadata updates
- **Rate Limiting**: Implement exponential backoff for SSB API
- **Service Dependencies**: Monitor API health and implement fallback mechanisms

#### Data Quality Risks
- **Historical Data Accuracy**: Kommunedatabasen conversion coefficients may have margins of error
- **Municipal Boundary Changes**: Handle boundary change logic carefully
- **Data Currency**: Implement refresh strategies for different data types

### Conclusion

The 3dje Boligsektor project can achieve comprehensive coverage using primarily free government APIs, with estimated costs of **0 NOK annually** for core functionality. Commercial APIs like Eiendomsverdi can be added later for enhanced property valuation features at an estimated 10,000-50,000 NOK annually.

**Recommended approach**: Start with the free tier (SSB + Kartverket + Kommunedatabasen) and evaluate commercial API integration based on user feedback and budget availability.

**Next Steps:**
1. Implement proof-of-concept with SSB PxWebApi v2
2. Add Kartverket WFS integration for property data
3. Integrate Kommunedatabasen for historical context
4. Evaluate commercial API needs based on user requirements