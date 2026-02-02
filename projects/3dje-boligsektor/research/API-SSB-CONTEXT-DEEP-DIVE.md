# SSB PxWebApi v2 Context Data Deep Dive

## Executive Summary

This document provides a comprehensive reference for using Statistics Norway (SSB) PxWebApi v2 to enrich the 3dje Boligsektor tomte-sourcing system with contextual data. The API provides access to approximately 6,000+ statistical tables covering population, housing, income, employment, and political data across multiple geographic granularities.

---

## 1. API Technical Overview

### 1.1 Base Endpoint
```
https://data.ssb.no/api/pxwebapi/v2
```

### 1.2 Key Technical Specifications

| Aspect | Specification |
|--------|---------------|
| Rate Limit | 30 requests per minute per IP address |
| Max Data Cells | 800,000 per extract |
| Default Format | JSON-Stat2 (JSON-Stat version 2) |
| Supported Languages | Norwegian (no), English (en) |
| Metadata Updates | 05:00 and 11:30 daily (API unavailable during updates) |
| Peak Load Period | Avoid 07:55-08:15 (new figures published at 08:00) |
| License | Creative Commons Attribution 4.0 International (CC BY 4.0) |

### 1.3 Core API Resources

| Resource | URL Pattern | Purpose |
|----------|-------------|---------|
| List Tables | `/tables?lang=no` | Browse all available tables |
| Table Info | `/tables/{tableId}?lang=no` | Basic table metadata |
| Full Metadata | `/tables/{tableId}/metadata?lang=no` | Complete variable/value definitions |
| Data (Default) | `/tables/{tableId}/data?lang=no` | Extract data with default selections |
| Data (Custom) | `/tables/{tableId}/data?lang=no&valueCodes[variable]=value1,value2` | Custom extract |

---

## 2. Geography Granularity Reference

### 2.1 Regional Levels Available

| Level | Code Pattern | Count (approx) | Best For |
|-------|--------------|----------------|----------|
| **Grunnkrets** (Basic Statistical Unit) | 8-digit codes (e.g., `10010101`) | ~13,000 | Fine-grained lot scoring, population density at micro-level |
| **Bydel** (City District) | 6-digit codes | ~100-200 | Urban area analysis |
| **Kommune** (Municipality) | 4-digit codes (e.g., `0301`) | 356 (2024) | Municipality-level filtering, policy context |
| **Fylke** (County) | 2-digit codes (e.g., `03`) | 15 | Regional analysis |
| **Hele landet** (Whole Country) | `0` | 1 | National benchmarks |
| **Tettsted** (Urban Settlement) | Variable codes | ~1,000 | Centrality scoring |

### 2.2 Grunnkrets: The Key to Lot-Level Scoring

Grunnkrets is the finest granularity available in SSB data, typically containing **100-2,000 residents** each. This makes them ideal for lot-level contextualization.

**Grunnkrets Code Structure:**
- 8-digit numeric code
- First 4 digits = Municipality code (kommunenummer)
- Last 4 digits = Local unit identifier

**Example:** `03010201` = Grunnkrets 0201 in Oslo municipality (0301)

**Important Table IDs for Grunnkrets Data:**
| Table ID | Description | Granularity | Variables |
|----------|-------------|-------------|-----------|
| **04317** | Grunnkretsenes befolkning | Grunnkrets (G) | Population count by basic statistical unit |
| **??** | Grunnkrets med alder/kjønn (new) | Grunnkrets (G) | Detailed demographics |

**Note:** The letter after table name indicates granularity: (G)=Grunnkrets, (K)=Kommune, (F)=Fylke, (B)=Bydel, (T)=Tettsted

### 2.3 Municipality Codes (356 kommuner)

Municipality codes are 4 digits (e.g., `0301` for Oslo). The table `06913` provides population data for all municipalities.

---

## 3. Critical Table Reference for 3dje Boligsektor

### 3.1 LOT-LEVEL Scoring Tables

#### Population Density & Demographics

| Table ID | Name | Granularity | Update Frequency | Key Variables |
|----------|------|-------------|------------------|---------------|
| **04317** | Grunnkretsenes befolkning | Grunnkrets (G) | Annual (February) | Population count per basic statistical unit |
| **06913** | Endringer i kommuners befolkning | Kommune (K) | Annual (March) | Population changes, births, deaths, migration |

**For Centrality Scoring:**
- Use **tettsted** (urban settlement) data from table **???** (Tettsteders befolkning og areal)
- Combine with population density from grunnkrets data

#### Housing Construction Activity

| Table ID | Name | Granularity | Update Frequency | Key Variables |
|----------|------|-------------|------------------|---------------|
| **06512** | Byggeareal. Boliger og leiligheter | National | Annual (January) | Igangsettingstillatelser, fullførte boliger |
| **06952** | Byggeareal. Fritidsbygninger | Kommune (K) | Annual (January) | Holiday home construction |
| **03723** | Byggeareal. Boliger og bruksareal | Fylke (F) | Monthly | Monthly building permits, floor area |
| **08843** | Byggeareal. Boliger (hittil i år) | Fylke (F) | Monthly | Year-to-date building activity |

**Important:** For kommune-level building permits, look for tables ending with (K) in the byggeareal category.

#### Income Levels

| Table ID | Name | Granularity | Update Frequency | Key Variables |
|----------|------|-------------|------------------|---------------|
| **12558** | Inntekt for husholdninger (desiler) | Kommune (K) | Annual (January) | Income by decile, median income |
| **12563** | Inntekt for husholdninger m/husholdningstype | Fylke (F) | Annual (January) | Income by household type |
| **09855** | Pensjonsgivende inntekt | National | Annual (January) | Average/median pensionable income |

**Key Insight:** Table 12558 provides income data at kommune level by deciles (1-10), useful for identifying affordable housing need.

#### Employment Data

| Table ID | Name | Granularity | Update Frequency | Key Variables |
|----------|------|-------------|------------------|---------------|
| **13760** | Arbeidsstyrken, sysselsatte (M) | National | Monthly | Employment, unemployment (LFS) |
| **14483** | Personer etter arbeidsstyrkestatus (K) | National | Quarterly | Labor force status |
| **13618** | Personer etter arbeidsstyrkestatus (K) | National | Annual | Labor force status |
| **09174** | Lønn, sysselsetting og produktivitet | Næring | Annual | Wages, employment by industry |

**Note:** Detailed employment data at kommune level may require KOSTRA tables (see kommune-level services below).

### 3.2 MUNICIPALITY FILTERING Tables

#### Population Trends

| Table ID | Name | Variables | Use Case |
|----------|------|-----------|----------|
| **06913** | Endringer i kommuner/fylkers befolkning | Population, births, deaths, immigration, emigration | Growth/decline trends |
| **???** | Folkemengde etter kommune | Total population | Baseline population |
| **???** | Befolkningsframskrivninger | Projected population | Future growth planning |

#### Economic Indicators

| Table ID | Name | Variables | Use Case |
|----------|------|-----------|----------|
| **12558** | Inntekt for husholdninger (desiler) | Median income, decile distribution | Affordability analysis |
| **???** | Kommunefakta inntekt | Various income metrics | Comprehensive income view |

#### Political Composition (Election Results)

| Table ID | Name | Granularity | Variables |
|----------|------|-------------|-----------|
| **01182** | Kommunestyrevalget. Representanter | Kommune (K) | Representatives by party/gender |
| **09475** | Kommunestyrevalget. Stemmer og valgdeltakelse | Kommune (K) | Votes cast, turnout |
| **13099** | Ordførere og varaordførere | Kommune (K) | Mayor/party affiliation |
| **11666** | Stortingsvalget. Hvor gikk velgerne | National | Voter mobility |
| **11659** | Stortingsvalget. Hvor kom velgerne fra | National | Voter origins |

**Note:** Table 01182 is crucial for understanding political climate for social housing - shows which parties hold power in each municipality.

### 3.3 Additional Context Tables

| Table ID | Category | Purpose |
|----------|----------|---------|
| **12943** | Arealtall til kommunefakta | Land area per municipality |
| **12280** | Kommunefakta barnevern | Child welfare indicators |
| **???** | KOSTRA tables | Comprehensive municipal service data |

---

## 4. Data Dictionary: Key Variables

### 4.1 Common Variable Names

| Norwegian Variable | English Translation | Typical Values | Found In |
|-------------------|---------------------|----------------|----------|
| `region` | Region | Municipality/county codes | Most tables |
| `Grunnkretser` | Basic statistical units | 8-digit grunnkrets codes | 04317 |
| `kjønn` | Gender | 0=Both, 1=Male, 2=Female | Many tables |
| `alder` | Age | Single year or ranges | Population tables |
| `år` / `Tid` | Year / Time | YYYY | Most tables |
| `statistikkvariabel` | Statistical variable | See below | All tables |
| `politisk parti` | Political party | Party codes | Election tables |

### 4.2 Statistical Variable Values (statistikkvariabel)

**For Population Tables:**
| Code | Description |
|------|-------------|
| `Personer` | Persons/Population count |
| `Fodte` | Births |
| `Dode` | Deaths |
| `Innflytting` | Immigration (to municipality) |
| `Utflytting` | Emigration (from municipality) |

**For Building Tables:**
| Code | Description |
|------|-------------|
| `Antall1` | Igangsettingstillatelser boliger (Building permits started - homes) |
| `Antall2` | Fullførte boliger (Completed homes) |
| `Antall3` | Igangsettingstillatelser leiligheter (Building permits - apartments) |
| `Antall4` | Fullførte leiligheter (Completed apartments) |

**For Income Tables:**
| Code | Description |
|------|-------------|
| `Inntekt` | Average income (kr) |
| `InntektMedian` | Median income (kr) |
| `Samlet` | Total income |
| `InntektEtterSkatt` | Income after tax |

**For Election Tables:**
| Code | Description |
|------|-------------|
| `Representanter` | Number of representatives |
| `ValgOrdforer` | Elected mayor |
| `Stemmeberettigede` | Eligible voters |
| `AvgitteStemmer` | Votes cast |

### 4.3 Political Party Codes (valg tables)

Common party codes in `politisk parti` variable:
- `A` - Arbeiderpartiet (Labor)
- `H` - Høyre (Conservative)
- `SP` - Senterpartiet (Center Party)
- `FRP` - Fremskrittspartiet (Progress)
- `SV` - Sosialistisk Venstreparti (Socialist Left)
- `KRF` - Kristelig Folkeparti (Christian Democratic)
- `V` - Venstre (Liberal)
- `MDG` - Miljøpartiet De Grønne (Greens)
- `R` - Rødt (Red)

---

## 5. Query Examples

### 5.1 Basic Query Structure

All queries use HTTP GET with parameters:

```
https://data.ssb.no/api/pxwebapi/v2/tables/{TABLE_ID}/data?lang=no&outputFormat={FORMAT}&valueCodes[{VARIABLE}]={VALUE1},{VALUE2}
```

### 5.2 Example: Get Population for Specific Grunnkrets

```bash
# Get population for a single grunnkrets in 2024
curl "https://data.ssb.no/api/pxwebapi/v2/tables/04317/data?lang=no&valueCodes[Grunnkretser]=10010101&valueCodes[Tid]=2024"
```

Response (JSON-Stat2 format):
```json
{
  "version": "2.0",
  "class": "dataset",
  "value": [1247],
  "dimension": {
    "Grunnkretser": {
      "category": {
        "index": {"10010101": 0},
        "label": {"10010101": "Østbygd 1"}
      }
    },
    "Tid": {
      "category": {
        "index": {"2024": 0},
        "label": {"2024": "2024"}
      }
    }
  }
}
```

### 5.3 Example: Get All Municipalities Population Changes

```bash
# Get population data for all municipalities for latest year
curl "https://data.ssb.no/api/pxwebapi/v2/tables/06913/data?lang=no&valueCodes[Tid]=2024" \
  -H "Accept: application/json"
```

### 5.4 Example: Get Building Permits for Multiple Municipalities

```bash
# Get building permits for Oslo, Bergen, and Trondheim (2024)
curl "https://data.ssb.no/api/pxwebapi/v2/tables/06952/data?lang=no&valueCodes[region]=0301,4601,5001&valueCodes[år]=2024"
```

### 5.5 Example: Get Income Distribution by Municipality

```bash
# Get median income for all municipalities (decile 5-6 boundary = median)
curl "https://data.ssb.no/api/pxwebapi/v2/tables/12558/data?lang=no&valueCodes[desil]=05&valueCodes[år]=2023"
```

### 5.6 Example: Get Election Results for Municipality

```bash
# Get representatives by party for Oslo municipality (2023)
curl "https://data.ssb.no/api/pxwebapi/v2/tables/01182/data?lang=no&valueCodes[Region]=0301&valueCodes[Tid]=2023"
```

### 5.7 Output Format Options

| Format Parameter | Description |
|------------------|-------------|
| `json-stat2` (default) | JSON-Stat version 2 |
| `csv` | Comma-separated values |
| `xlsx` | Excel format |
| `px` | PC-Axis format |

Example with CSV:
```bash
curl "https://data.ssb.no/api/pxwebapi/v2/tables/04317/data?lang=no&outputFormat=csv&valueCodes[Tid]=2024"
```

---

## 6. Code Snippets for Bulk Retrieval

### 6.1 Python: Fetch Population for All Grunnkrets in a Municipality

```python
import requests
import json

BASE_URL = "https://data.ssb.no/api/pxwebapi/v2"

def get_grunnkrets_for_municipality(kommunekode):
    """
    Fetch all grunnkrets population data for a given municipality.
    Kommunekode is 4 digits (e.g., '0301' for Oslo)
    """
    # First, get metadata to find available grunnkrets
    meta_url = f"{BASE_URL}/tables/04317/metadata?lang=no"
    response = requests.get(meta_url)
    metadata = response.json()
    
    # Extract all grunnkrets codes that start with municipality code
    all_grunnkrets = metadata['dimension']['Grunnkretser']['category']['index'].keys()
    municipality_grunnkrets = [gk for gk in all_grunnkrets if gk.startswith(kommunekode)]
    
    print(f"Found {len(municipality_grunnkrets)} grunnkrets in municipality {kommunekode}")
    
    # Build query URL (may need to batch if many grunnkrets)
    grunnkrets_str = ','.join(municipality_grunnkrets[:100])  # Limit for demo
    data_url = f"{BASE_URL}/tables/04317/data?lang=no&valueCodes[Grunnkretser]={grunnkrets_str}&valueCodes[Tid]=2024"
    
    response = requests.get(data_url)
    return response.json()

# Example usage
oslo_data = get_grunnkrets_for_municipality('0301')
```

### 6.2 Python: Calculate Population Density for Lot Scoring

```python
def calculate_grunnkrets_density(grunnkrets_code, grunnkrets_area_m2):
    """
    Calculate population density for a grunnkrets.
    Note: Area data may need to come from GIS sources or Statens Kartverk.
    """
    BASE_URL = "https://data.ssb.no/api/pxwebapi/v2"
    
    # Get population
    url = f"{BASE_URL}/tables/04317/data?lang=no&valueCodes[Grunnkretser]={grunnkrets_code}&valueCodes[Tid]=2024"
    response = requests.get(url)
    data = response.json()
    
    if data.get('value'):
        population = data['value'][0]
        # Convert m2 to km2
        area_km2 = grunnkrets_area_m2 / 1_000_000
        density = population / area_km2 if area_km2 > 0 else 0
        return {
            'grunnkrets': grunnkrets_code,
            'population': population,
            'area_km2': area_km2,
            'density_per_km2': density
        }
    return None
```

### 6.3 Python: Batch Fetch Municipality Data

```python
import time
import requests

def batch_fetch_municipality_data(table_id, kommune_list, year='2024'):
    """
    Fetch data for multiple municipalities efficiently.
    Respects rate limit of 30 requests/minute.
    """
    BASE_URL = "https://data.ssb.no/api/pxwebapi/v2"
    results = []
    
    # Process in batches to minimize API calls
    # Can request up to ~800,000 cells per call
    kommune_str = ','.join(kommune_list)
    
    url = f"{BASE_URL}/tables/{table_id}/data?lang=no&valueCodes[region]={kommune_str}&valueCodes[år]={year}"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None
    
    # Rate limiting - sleep if needed
    time.sleep(2)  # Ensure we stay under 30 req/min

# Example: Get income data for all municipalities
all_kommuner = [f"{i:04d}" for i in range(301, 5500)]  # Generate all kommune codes
# Note: Need to filter to only valid codes - many numbers are unused
income_data = batch_fetch_municipality_data('12558', ['0301', '1101', '4601', '5001'])
```

### 6.4 Python: Municipality Scoring Pipeline

```python
class MunicipalityScorer:
    """
    Score municipalities for social housing suitability.
    """
    BASE_URL = "https://data.ssb.no/api/pxwebapi/v2"
    
    def __init__(self):
        self.cache = {}
    
    def get_population_growth(self, kommunekode, years=5):
        """Calculate population growth rate over N years."""
        end_year = 2024
        start_year = end_year - years
        
        url = f"{self.BASE_URL}/tables/06913/data?lang=no&valueCodes[Region]={kommunekode}&valueCodes[Tid]={start_year},{end_year}"
        response = requests.get(url)
        data = response.json()
        
        # Parse response and calculate growth
        # Implementation depends on exact response structure
        return self._parse_growth(data)
    
    def get_median_income(self, kommunekode):
        """Get median income for municipality."""
        # Table 12558 - desil 05 represents median
        url = f"{self.BASE_URL}/tables/12558/data?lang=no&valueCodes[region]={kommunekode}&valueCodes[desil]=05&valueCodes[år]=2023"
        response = requests.get(url)
        return self._parse_income(response.json())
    
    def get_political_majority(self, kommunekode):
        """Determine ruling party coalition."""
        url = f"{self.BASE_URL}/tables/01182/data?lang=no&valueCodes[Region]={kommunekode}&valueCodes[Tid]=2023"
        response = requests.get(url)
        return self._parse_representatives(response.json())
    
    def score_municipality(self, kommunekode):
        """
        Calculate composite score for social housing potential.
        Returns dict with scores and raw data.
        """
        score = {
            'kommunekode': kommunekode,
            'growth_rate': self.get_population_growth(kommunekode),
            'median_income': self.get_median_income(kommunekode),
            'political_context': self.get_political_majority(kommunekode),
            # Add more metrics...
        }
        
        # Calculate composite score
        score['suitability_score'] = self._calculate_composite(score)
        return score
```

---

## 7. Integration with GIS Data

### 7.1 Spatial Join Strategy: Grunnkrets

The recommended approach for joining SSB data with GIS lot polygons:

```
GIS Workflow:
1. Download grunnkrets polygons from Statens Kartverk or Geonorge
2. Perform spatial join: lot centroid → grunnkrets polygon
3. Extract grunnkrets code (8-digit) from join
4. Query SSB API for that grunnkrets code
5. Enrich lot data with SSB context
```

**Data Source for Grunnkrets Boundaries:**
- **Kartverket/Geonorge**: `https://www.geonorge.no/`
- Look for "Grunnkrets" in administrative units
- Format: GeoJSON, Shapefile, or WFS service

### 7.2 Example: PostGIS Integration

```sql
-- Assuming tables:
-- lots (id, geom) - your lot polygons
-- grunnkrets_geom (grunnkrets_code, geom) - from Kartverket

-- Create enriched lot table
CREATE TABLE lots_with_context AS
SELECT 
    l.id,
    l.geom,
    g.grunnkrets_code,
    -- Join SSB data via grunnkrets_code
FROM lots l
LEFT JOIN grunnkrets_geom g 
    ON ST_Contains(g.geom, ST_Centroid(l.geom));

-- Create index for API lookups
CREATE INDEX idx_lots_grunnkrets ON lots_with_context(grunnkrets_code);
```

### 7.3 Coordinate to Grunnkrets Lookup

For a lot at specific coordinates (WGS84):

```python
from shapely.geometry import Point
import geopandas as gpd

# Load grunnkrets polygons
grunnkrets = gpd.read_file('grunnkrets.geojson')

def get_grunnkrets_for_coordinate(lon, lat):
    """
    Find grunnkrets code for a given coordinate.
    """
    point = Point(lon, lat)
    
    # Find containing grunnkrets
    containing = grunnkrets[grunnkrets.contains(point)]
    
    if len(containing) > 0:
        return containing.iloc[0]['grunnkrets_code']
    return None

# Example
code = get_grunnkrets_for_coordinate(10.7522, 59.9139)  # Oslo
print(f"Grunnkrets: {code}")
```

---

## 8. Data Quality & Update Frequencies

### 8.1 Update Schedule Summary

| Table Category | Update Frequency | Typical Release Date |
|----------------|------------------|---------------------|
| Population (befolkning) | Annual | February (1st quarter) |
| Building permits | Monthly | 15th of each month |
| Building (annual) | Annual | January |
| Income | Annual | January |
| Employment (LFS) | Monthly | 22nd of each month |
| Elections | Every 4 years | Following election year |
| KOSTRA (municipal) | Annual | Varies by indicator |

### 8.2 Known Data Gaps & Limitations

| Issue | Impact | Workaround |
|-------|--------|------------|
| Income data not at grunnkrets | Can't score lot-level income | Use kommune-level + tettsted classification |
| Employment only national/regional | No kommune-level unemployment | Use KOSTRA municipal data or proxies |
| Grunnkrets boundaries change annually | Historical comparisons difficult | Use crosswalks from SSB |
| 2015-2020 pension income error | Slight income overestimation | Adjust or use other years |
| Building permits only to fylke | No kommune-level monthly data | Use annual kommune tables |

### 8.3 Reliability Indicators

All SSB tables include metadata:
- `official-statistics`: true/false
- `adjustment`: Seasonal adjustment status
- `measuringType`: Stock, Flow, Average, Other
- `priceType`: Current, Fixed, NotApplicable

Check these in the metadata response:
```json
{
  "extension": {
    "px": {
      "official-statistics": true,
      "decimals": 0
    }
  }
}
```

---

## 9. Best Practices

### 9.1 API Usage Best Practices

1. **Cache aggressively**: SSB data updates infrequently - cache responses
2. **Batch requests**: Request multiple values in single call
3. **Avoid 07:55-08:15**: Peak load when new data is published
4. **Respect rate limits**: 30 req/min - implement backoff
5. **Use metadata**: Always check table metadata before querying
6. **Handle errors**: Tables may be unavailable during metadata updates

### 9.2 Data Integration Best Practices

1. **Version your extracts**: SSB data may be revised
2. **Store raw responses**: For audit trail and reprocessing
3. **Join on stable IDs**: Grunnkrets codes change - use reference year
4. **Validate coordinates**: Ensure points fall within Norway
5. **Handle missing data**: Some grunnkrets may be uninhabited

### 9.3 Recommended Data Pipeline

```
1. Daily: Check for updated tables (pastdays=1)
2. Weekly: Refresh municipality-level data
3. Monthly: Refresh building permit data
4. Annually: Full refresh of population/income data
5. On-demand: Fetch grunnkrets data for new lots
```

---

## 10. Quick Reference Card

### Essential Tables for 3dje Boligsektor

| Use Case | Table ID | Level | Frequency |
|----------|----------|-------|-----------|
| Lot population density | 04317 | Grunnkrets (G) | Annual |
| Municipality growth | 06913 | Kommune (K) | Annual |
| Building permits | 03723 | Fylke (F) | Monthly |
| Housing construction | 06512 | National | Annual |
| Income distribution | 12558 | Kommune (K) | Annual |
| Political composition | 01182 | Kommune (K) | 4-yearly |
| Land area | 12943 | Kommune (K) | Annual |

### Essential API Calls

```bash
# List all tables
curl "https://data.ssb.no/api/pxwebapi/v2/tables?lang=no"

# Get table metadata
curl "https://data.ssb.no/api/pxwebapi/v2/tables/04317/metadata?lang=no"

# Get data (single grunnkrets)
curl "https://data.ssb.no/api/pxwebapi/v2/tables/04317/data?lang=no&valueCodes[Grunnkretser]=10010101&valueCodes[Tid]=2024"

# Get data (CSV format)
curl "https://data.ssb.no/api/pxwebapi/v2/tables/06913/data?lang=no&outputFormat=csv&valueCodes[Tid]=2024"

# Search tables
curl "https://data.ssb.no/api/pxwebapi/v2/tables?lang=no&query=befolkning"

# Recent updates
curl "https://data.ssb.no/api/pxwebapi/v2/tables?lang=no&pastdays=7"
```

---

## 11. Contact & Support

- **API Support**: statistikkbanken@ssb.no
- **Documentation**: https://www.ssb.no/en/api/pxwebapiv2
- **GitHub Examples**: https://github.com/janbrus/ssb-api-v2-examples
- **OpenAPI Spec**: https://data.ssb.no/api/pxwebapi/v2/index.html

---

## Appendix A: Full Table List by Category

### Population & Demographics (Befolkning)
- 04317: Grunnkretsenes befolkning (G)
- 06913: Endringer i kommuners befolkning (K)
- 06912: Folkemengde etter kommune (K)
- 05802: Befolkning etter alder og kjønn (K)

### Housing & Construction (Bygg og bolig)
- 03723: Byggeareal. Boliger (F) - Monthly
- 06952: Byggeareal. Fritidsbygninger (K) - Annual
- 06512: Byggeareal. Boliger og leiligheter - National

### Income & Economy (Inntekt)
- 12558: Inntekt for husholdninger, desiler (K)
- 09855: Pensjonsgivende inntekt - National
- 07751: Sammensetning av husholdningsinntekt

### Employment (Arbeid)
- 13760: Arbeidsstyrken, sysselsatte (M)
- 14483: Personer etter arbeidsstyrkestatus (K)

### Elections (Valg)
- 01182: Kommunestyrevalget. Representanter (K)
- 09475: Kommunestyrevalget. Stemmer (K)
- 13099: Ordførere og varaordførere (K)

---

*Document Version: 1.0*
*Last Updated: 2026-02-01*
*Research for: 3dje Boligsektor Project*
