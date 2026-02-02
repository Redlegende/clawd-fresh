# GeoNorge WFS APIs for Kommuneplaner and Reguleringsplaner
## Deep Dive Report for 3dje Boligsektor Tomte-Sourcing System

**Date:** 2026-02-01  
**Project:** 3dje Boligsektor - Tomte-Sourcing System  
**Core Logic:** KOMMUNEPLAN (bolig zones) − REGULERINGSPLAN (already developed) = OPPORTUNITY

---

## Executive Summary

This report provides comprehensive technical details for building a tomte-sourcing system that identifies housing development opportunities by calculating the geometric difference between:
1. **Kommuneplan** areas zoned for housing (BO/BL/BF zones)
2. **Reguleringsplan** areas already detailed-regulated

From 2026, national WMS services for plans have been discontinued. Each municipality must be queried individually via their WFS endpoints.

---

## 1. EXACT WFS LAYER NAMES AND ENDPOINTS

### 1.1 National WFS Endpoints (Kartverket/GeoNorge)

#### Reguleringsplaner WFS
- **Service:** Reguleringsplaner WFS
- **UUID:** `928818d7-67b4-4bad-aa0e-2475e525517a`
- **Organization:** Kartverket
- **Endpoint:** (Varies by municipality - see discovery section)

#### Legacy National Services (DISCONTINUED from 1.1.2026)
| Service | Type | Status | Notes |
|---------|------|--------|-------|
| Planområde WFS | WFS | **AVSLUTTES 1.1.2026** | National aggregation ended |
| Planområde WMS | WMS | **AVSLUTTES 1.1.2026** | No longer available |
| Kommuneplanforslag WMS | WMS | **AVSLUTTES 1.1.2026** | Use municipality endpoints |
| Planregisterstatus WMS | WMS | **AVSLUTTES 1.1.2026** | Use municipality endpoints |

### 1.2 WMS Layer Names (for reference/mapping)

From `wms.geonorge.no/skwms1/wms.kommuneplaner`:

```xml
<Layer>
  <Name>Kommuneplan</Name>
  <Title>Kommuneplan</Title>
  
  <!-- KEY LAYER FOR AREALFORMÅL -->
  <Layer>
    <Name>Arealformal_kp</Name>
    <Title>Arealformål</Title>
    <Abstract>Område med arealformål i kommuneplan</Abstract>
    <CRS>EPSG:25833</CRS>
  </Layer>
  
  <Layer>
    <Name>Hensynsoner_bestemmelsesomrader_kp</Name>
    <Title>Hensynsoner og bestemmelsesområder</Title>
  </Layer>
</Layer>
```

### 1.3 SOSI/GeoJSON Object Types

| Object Type | Description | SOSI Code |
|-------------|-------------|-----------|
| `Arealplan` | The plan document/area | - |
| `Arealformål` | Land use zone (polygon) | KpArealformål |
| `Planbehandling` | Processing history | - |
| `Planhendelse` | Plan events | - |
| `HensynOgBestemmelser` | Supplementary regulations | - |

### 1.4 Key Arealformål Codes for Housing

**Kommuneplan (KpArealformål):**

| Code | Label | Description |
|------|-------|-------------|
| 1110 | **Boligbebyggelse** | Pure residential |
| 1120 | Fritidsbebyggelse | Recreational/cabin |
| 1801 | Kombinert bolig og forretning | Mixed residential/commercial |
| 1802 | **Blanding** (Bolig, tjenesteyting m.v.) | Mixed use - RESIDENTIAL |
| 1803 | Blanding (Næring, kontor m.v.) | Mixed use - COMMERCIAL |
| 5200 | LNFR-areal for spredt bolig | Dispersed housing in LNFR |

**Reguleringsplan (RpArealformål):**

| Code | Label | Description |
|------|-------|-------------|
| 1100 | Boligbebyggelse - generalisert (utgått) | Old code (pre-2012) |
| 1110 | **Boligbebyggelse** | Residential |
| 1120 | Fritidsbebyggelse | Recreational |
| 1130 | **Flerboligbebyggelse** | Multi-family housing |
| 1140 | **Småhusbebyggelse** | Small house/single-family |
| 1150 | **Større boligbebyggelse** | Larger residential |
| 1801 | Kombinert bolig og forretning | Mixed use |

**TARGET CODES FOR 3DJE BOLIGSEKTOR:**
- **BO codes:** 1110, 1130, 1140, 1150 (pure residential)
- **BL codes:** 1801, 1802 (mixed use with residential)

---

## 2. MUNICIPALITY WFS DISCOVERY METHOD

### 2.1 The 2026 Challenge

**Critical Change:** From January 1, 2026, national WMS services for kommuneplaner and reguleringsplaner were discontinued. Each municipality must now be queried individually.

### 2.2 Discovery Approaches

#### Option A: GeoNorge Kartkatalog API
```
https://kartkatalog.geonorge.no/api/servicedirectory?text=kommuneplan&limit=100
https://kartkatalog.geonorge.no/api/servicedirectory?text=reguleringsplan&limit=100
```

Returns CSV with:
- `Title` - Service name
- `Type` - WFS-tjeneste / WMS-tjeneste
- `Organization` - Municipality name
- `Uuid` - Unique identifier
- `Url to service` - WFS endpoint URL

#### Option B: Register API
```
https://register.geonorge.no/api/sosi-kodelister/plan/kommuneplan
https://register.geonorge.no/api/inspire-statusregister
```

#### Option C: Arealplaner.no
- **Website:** https://arealplaner.no/
- **Provider:** Norkart
- **Coverage:** Many Norwegian municipalities
- **Format:** Typically WFS 2.0.0 via GeoServer
- **Example pattern:** `https://[kommune].arealplaner.no/geoserver/wfs`

### 2.3 Coverage Assessment

| Source | Coverage | Data Quality | Update Frequency |
|--------|----------|--------------|------------------|
| Individual municipality WFS | ~100% (in theory) | Varies significantly | Varies |
| Arealplaner.no | ~60-70% of municipalities | Good when available | Near real-time |
| GeoNorge registry | Partial | Varies | Delayed |
| SSB Arealreserver | National overview only | Aggregated | Annual |

### 2.4 Municipality WFS URL Patterns

Common URL patterns (examples):

```
# Direct municipality WFS
https://kart.[kommune].kommune.no/geoserver/wfs
https://gis.[kommune].kommune.no/wfs
https://wfs.[kommune].kommune.no/wfs

# Via Norkart/Arealplaner
https://[kommune].arealplaner.no/geoserver/wfs
https://wfs.norkart.no/[kommune]

# Regional/ArcGIS solutions
https://services.arcgis.com/[id]/arcgis/services/[name]/MapServer/WFSServer
```

---

## 3. DIFFERANSE CALCULATION (THE CORE ALGORITHM)

### 3.1 Concept

```
OPPORTUNITY = KOMMUNEPLAN(Bolig/Blanding zones) 
              − REGULERINGSPLAN(vedtatt plan polygons)
```

### 3.2 Recommended Tools

| Tool | Purpose | Best For |
|------|---------|----------|
| **GeoPandas** | DataFrame-based geospatial operations | Analysis, filtering |
| **Shapely** | Low-level geometry operations | Difference calculation |
| **PyProj** | CRS transformations | Coordinate system conversion |
| **OWSLib** | WFS client | Fetching WFS data |
| **PostGIS** (optional) | Database storage & queries | Large-scale operations |

### 3.3 Complete Python Implementation

```python
"""
Tomte-sourcing differanse calculation
Finds areas zoned for housing that haven't been detailed-regulated yet
"""

import geopandas as gpd
import pandas as pd
from shapely.geometry import box
from owslib.wfs import WebFeatureService
import requests
import json
from typing import List, Tuple

# Configuration
TARGET_MUNICIPALITIES = ['0301', '1103', '4601']  # Oslo, Stavanger, Bergen
HOUSING_CODES_KP = ['1110', '1802']  # Bolig, Blanding (bolig)
HOUSING_CODES_RP = ['1110', '1130', '1140', '1150', '1801']
PLANSTATUS_VEDTATT = ['3', '6']  # Endelig vedtatt, Vedtatt med utsatt rettsvirkning

def fetch_wfs_data(
    wfs_url: str, 
    typename: str, 
    bbox: Tuple[float, float, float, float] = None,
    cql_filter: str = None,
    crs: str = "EPSG:25833"
) -> gpd.GeoDataFrame:
    """
    Fetch data from WFS endpoint
    
    Args:
        wfs_url: WFS endpoint URL
        typename: Layer/feature type name
        bbox: Bounding box (minx, miny, maxx, maxy)
        cql_filter: CQL filter string
        crs: Coordinate reference system
    
    Returns:
        GeoDataFrame with fetched features
    """
    params = {
        'service': 'WFS',
        'version': '2.0.0',
        'request': 'GetFeature',
        'typeName': typename,
        'outputFormat': 'application/json',
        'srsName': crs
    }
    
    if bbox:
        params['bbox'] = f"{','.join(map(str, bbox))},{crs}"
    
    if cql_filter:
        params['cql_filter'] = cql_filter
    
    response = requests.get(wfs_url, params=params, timeout=60)
    response.raise_for_status()
    
    return gpd.read_file(response.text)


def filter_housing_zones(
    gdf: gpd.GeoDataFrame, 
    arealformal_column: str = 'arealformal',
    target_codes: List[str] = None
) -> gpd.GeoDataFrame:
    """
    Filter GeoDataFrame to only housing-related arealformål
    
    Args:
        gdf: Input GeoDataFrame
        arealformal_column: Column containing arealformål codes
        target_codes: List of target arealformål codes
    
    Returns:
        Filtered GeoDataFrame
    """
    if target_codes is None:
        target_codes = HOUSING_CODES_KP
    
    # Handle both string codes and numeric codes
    gdf_filtered = gdf[gdf[arealformal_column].astype(str).isin(target_codes)]
    
    return gdf_filtered.copy()


def filter_approved_plans(
    gdf: gpd.GeoDataFrame,
    planstatus_column: str = 'planstatus',
    approved_statuses: List[str] = None
) -> gpd.GeoDataFrame:
    """
    Filter to only approved/vedtatt plans
    
    Planstatus codes:
    3 = Endelig vedtatt arealplan
    6 = Vedtatt plan med utsatt rettsvirkning
    """
    if approved_statuses is None:
        approved_statuses = PLANSTATUS_VEDTATT
    
    return gdf[gdf[planstatus_column].astype(str).isin(approved_statuses)].copy()


def calculate_difference(
    kommuneplan_gdf: gpd.GeoDataFrame,
    reguleringsplan_gdf: gpd.GeoDataFrame,
    buffer_distance: float = 0.0
) -> gpd.GeoDataFrame:
    """
    Calculate geometric difference between kommuneplan and reguleringsplan
    
    Returns areas in kommuneplan that are NOT covered by reguleringsplan
    
    Args:
        kommuneplan_gdf: GeoDataFrame with kommuneplan housing zones
        reguleringsplan_gdf: GeoDataFrame with approved reguleringsplan areas
        buffer_distance: Optional buffer around reguleringsplan (in meters)
    
    Returns:
        GeoDataFrame with opportunity areas
    """
    # Ensure same CRS
    target_crs = kommuneplan_gdf.crs
    if reguleringsplan_gdf.crs != target_crs:
        reguleringsplan_gdf = reguleringsplan_gdf.to_crs(target_crs)
    
    # Optional: Buffer reguleringsplan to create "influence zone"
    if buffer_distance > 0:
        reguleringsplan_gdf = reguleringsplan_gdf.copy()
        reguleringsplan_gdf['geometry'] = reguleringsplan_gdf.buffer(buffer_distance)
    
    # Union all reguleringsplan polygons into one
    reguleringsplan_union = reguleringsplan_gdf.unary_union
    
    # Calculate difference for each kommuneplan polygon
    opportunities = []
    
    for idx, row in kommuneplan_gdf.iterrows():
        kommune_geom = row.geometry
        
        # Calculate difference
        diff_geom = kommune_geom.difference(reguleringsplan_union)
        
        # Only keep if there's remaining area
        if not diff_geom.is_empty and diff_geom.area > 1:  # 1 sq meter threshold
            opportunity_row = row.copy()
            opportunity_row.geometry = diff_geom
            opportunities.append(opportunity_row)
    
    if opportunities:
        return gpd.GeoDataFrame(opportunities, crs=target_crs)
    else:
        return gpd.GeoDataFrame(geometry=[], crs=target_crs)


def calculate_difference_overlay(
    kommuneplan_gdf: gpd.GeoDataFrame,
    reguleringsplan_gdf: gpd.GeoDataFrame
) -> gpd.GeoDataFrame:
    """
    Alternative using GeoPandas overlay (preserves attributes better)
    
    Returns areas in kommuneplan that are NOT covered by reguleringsplan
    """
    # Ensure same CRS
    target_crs = kommuneplan_gdf.crs
    if reguleringsplan_gdf.crs != target_crs:
        reguleringsplan_gdf = reguleringsplan_gdf.to_crs(target_crs)
    
    # Use overlay with 'difference' mode
    # Returns geometries from left (kommuneplan) not covered by right (reguleringsplan)
    opportunity_gdf = kommuneplan_gdf.overlay(
        reguleringsplan_gdf, 
        how='difference',
        keep_geom_type=True
    )
    
    return opportunity_gdf


class TomteSourcingEngine:
    """
    Main engine for tomte-sourcing analysis
    """
    
    def __init__(self, municipality_configs: dict):
        """
        Initialize with municipality configurations
        
        Args:
            municipality_configs: Dict mapping kommunenr to WFS config
                {
                    '0301': {
                        'wfs_url': 'https://...',
                        'kp_typename': 'kommuneplan:arealformal',
                        'rp_typename': 'reguleringsplan:arealformal',
                        'crs': 'EPSG:25833'
                    }
                }
        """
        self.configs = municipality_configs
        self.results = {}
    
    def analyze_municipality(self, kommunenr: str) -> dict:
        """
        Run analysis for a single municipality
        """
        config = self.configs.get(kommunenr)
        if not config:
            raise ValueError(f"No configuration for municipality {kommunenr}")
        
        print(f"Analyzing municipality {kommunenr}...")
        
        # 1. Fetch kommuneplan data
        kp_gdf = fetch_wfs_data(
            config['wfs_url'],
            config['kp_typename'],
            cql_filter=f"arealformal IN ({','.join(HOUSING_CODES_KP)})"
        )
        
        # 2. Fetch reguleringsplan data (only approved)
        rp_cql = (
            f"planstatus IN ({','.join(PLANSTATUS_VEDTATT)}) "
            f"AND arealformal IN ({','.join(HOUSING_CODES_RP)})"
        )
        rp_gdf = fetch_wfs_data(
            config['wfs_url'],
            config['rp_typename'],
            cql_filter=rp_cql
        )
        
        # 3. Calculate difference
        opportunity_gdf = calculate_difference_overlay(kp_gdf, rp_gdf)
        
        # 4. Calculate metrics
        total_kp_area = kp_gdf.area.sum()
        total_rp_area = rp_gdf.area.sum()
        opportunity_area = opportunity_gdf.area.sum()
        
        result = {
            'kommunenr': kommunenr,
            'total_kp_housing_area_sqm': total_kp_area,
            'total_rp_approved_area_sqm': total_rp_area,
            'opportunity_area_sqm': opportunity_area,
            'opportunity_percentage': (opportunity_area / total_kp_area * 100) if total_kp_area > 0 else 0,
            'opportunity_count': len(opportunity_gdf),
            'opportunities_gdf': opportunity_gdf
        }
        
        self.results[kommunenr] = result
        return result
    
    def export_opportunities(self, output_path: str, format: str = 'geopackage'):
        """
        Export all opportunities to file
        """
        all_opportunities = []
        
        for kommunenr, result in self.results.items():
            gdf = result['opportunities_gdf'].copy()
            gdf['kommunenr'] = kommunenr
            all_opportunities.append(gdf)
        
        combined = pd.concat(all_opportunities, ignore_index=True)
        
        if format == 'geopackage':
            combined.to_file(output_path, driver='GPKG')
        elif format == 'shapefile':
            combined.to_file(output_path)
        elif format == 'geojson':
            combined.to_file(output_path, driver='GeoJSON')
        
        print(f"Exported {len(combined)} opportunities to {output_path}")


# Example usage
if __name__ == "__main__":
    # Configuration for municipalities
    configs = {
        '0301': {  # Oslo
            'wfs_url': 'https://kart.oslo.kommune.no/geoserver/wfs',
            'kp_typename': 'oslo:kommuneplan_arealformal',
            'rp_typename': 'oslo:reguleringsplan_arealformal',
            'crs': 'EPSG:25833'
        }
    }
    
    # Initialize engine
    engine = TomteSourcingEngine(configs)
    
    # Run analysis
    result = engine.analyze_municipality('0301')
    
    print(f"Opportunity area: {result['opportunity_area_sqm']:,} m²")
    print(f"Opportunity percentage: {result['opportunity_percentage']:.1f}%")
    print(f"Number of opportunity polygons: {result['opportunity_count']}")
```

### 3.4 CQL Filter Examples

```python
# Filter for housing zones in kommuneplan
cql_kp_housing = "arealformal IN ('1110', '1802')"

# Filter for approved reguleringsplan with housing
cql_rp_approved = "planstatus IN ('3', '6') AND arealformal IN ('1110', '1130', '1140')"

# Filter by municipality number
cql_by_kommune = "kommunenummer = '0301'"

# Combined filter
cql_combined = (
    "kommunenummer = '0301' AND "
    "planstatus IN ('3', '6') AND "
    "arealformal IN ('1110', '1130')"
)

# Spatial filter (bounding box)
cql_bbox = "BBOX(geom, 10.7, 59.9, 10.8, 60.0)"

# Filter by date
cql_date = "vedtaksdato >= '2020-01-01'"
```

---

## 4. DATA QUALITY ASSESSMENT

### 4.1 Municipality Data Quality Tiers

| Tier | Quality | Coverage | Notes |
|------|---------|----------|-------|
| **A** | Excellent | Oslo, Bergen, Trondheim, Stavanger | Complete, updated regularly, full WFS |
| **B** | Good | Major cities (Drammen, Kristiansand, Tromsø) | Mostly complete, occasional delays |
| **C** | Variable | Medium-sized municipalities | Varies widely, some gaps |
| **D** | Poor | Small/rural municipalities | Often incomplete, may lack WFS |

### 4.2 Known Data Quality Issues

1. **Timing Lag**
   - Plan approval → Plan register: 1-4 weeks
   - Plan register → WFS availability: 1-8 weeks
   - Total lag: 1-3 months typical

2. **Completeness**
   - Not all municipalities have digitized all historical plans
   - Some plans exist only as PDFs
   - Pre-2009 plans often missing or incomplete

3. **Accuracy**
   - Coordinate precision varies
   - Some plans digitized from scanned maps
   - Edge alignment issues between adjacent plans

4. **Attribute Consistency**
   - Different municipalities use different field names
   - Some don't populate arealformål codes consistently
   - Planstatus may not be updated promptly

### 4.3 Recommended Data Validation

```python
def validate_opportunity(opportunity_gdf: gpd.GeoDataFrame) -> dict:
    """
    Validate opportunity data quality
    """
    issues = []
    
    # Check for very small polygons (likely artifacts)
    small_polys = opportunity_gdf[opportunity_gdf.area < 100]  # < 100 m²
    if len(small_polys) > 0:
        issues.append(f"{len(small_polys)} polygons < 100 m² (possible artifacts)")
    
    # Check for invalid geometries
    invalid = opportunity_gdf[~opportunity_gdf.is_valid]
    if len(invalid) > 0:
        issues.append(f"{len(invalid)} invalid geometries found")
    
    # Check CRS
    if opportunity_gdf.crs is None:
        issues.append("Missing CRS information")
    
    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'total_polygons': len(opportunity_gdf),
        'total_area': opportunity_gdf.area.sum()
    }
```

---

## 5. ALTERNATIVE DATA SOURCES

### 5.1 Arealplaner.no (Primary Alternative)

- **Provider:** Norkart
- **Coverage:** 200+ municipalities
- **Access:** WFS 2.0.0
- **Quality:** High - near real-time updates
- **URL Pattern:** `https://{kommune}.arealplaner.no/geoserver/wfs`

**Pros:**
- Standardized format across municipalities
- Good documentation
- Reliable uptime

**Cons:**
- Not all municipalities participate
- Requires municipality-by-municipality configuration

### 5.2 SSB Arealreserver

- **Provider:** Statistisk sentralbyrå (SSB)
- **Endpoint:** `https://kart.ssb.no/api/mapserver/v1/wfs/arealreserver_i_kommuneplan`
- **Format:** WFS 2.0.0
- **Coverage:** National aggregated data

**Pros:**
- National overview in one query
- Consistent methodology
- Good for initial screening

**Cons:**
- Aggregated data only
- Annual updates
- Less detailed than municipal sources

### 5.3 Direct Municipality Contact

For municipalities without WFS:

1. Contact kommune plan- og byggesaksavdeling
2. Request SOSI or GeoJSON files
3. Often available via email or FTP
4. May require data sharing agreement

### 5.4 Other National Sources

| Source | Type | Coverage | Use Case |
|--------|------|----------|----------|
| Kartverket Planregister | WFS/REST | Partial | Official plan status |
| DiBK Planbestemmelser | API | National | Regulation text lookup |
| NVE Flood/landslide | WFS | National | Risk assessment overlay |
| Miljødirektoratet | WFS | National | Protected areas overlay |

---

## 6. TECHNICAL IMPLEMENTATION GUIDE

### 6.1 WFS Version Recommendation

**Use WFS 2.0.0** for new implementations:

```python
params = {
    'service': 'WFS',
    'version': '2.0.0',  # Recommended
    'request': 'GetFeature',
    'typeName': 'layer_name',
    'outputFormat': 'application/json'
}
```

**Why 2.0.0 over 1.1.0:**
- Better paging support (startIndex, count)
- Improved filter capabilities
- JSON output format standard
- Better CRS handling

### 6.2 Filter Syntax

**CQL (Common Query Language)** - Recommended for simple filters:
```python
# Simple and readable
cql = "arealformal IN ('1110', '1802') AND planstatus = '3'"
```

**OGC XML Filter** - For complex spatial queries:
```xml
<Filter xmlns="http://www.opengis.net/ogc">
  <And>
    <PropertyIsEqualTo>
      <PropertyName>arealformal</PropertyName>
      <Literal>1110</Literal>
    </PropertyIsEqualTo>
    <Intersects>
      <PropertyName>geom</PropertyName>
      <gml:Polygon>
        <gml:outerBoundaryIs>
          <gml:LinearRing>
            <gml:coordinates>10.7,59.9 10.8,59.9 10.8,60.0 10.7,60.0 10.7,59.9</gml:coordinates>
          </gml:LinearRing>
        </gml:outerBoundaryIs>
      </gml:Polygon>
    </Intersects>
  </And>
</Filter>
```

### 6.3 Handling Large Datasets

```python
import time

def fetch_large_wfs(
    wfs_url: str,
    typename: str,
    chunk_size: int = 10000
) -> gpd.GeoDataFrame:
    """
    Fetch large WFS datasets with paging
    """
    all_features = []
    start_index = 0
    
    while True:
        params = {
            'service': 'WFS',
            'version': '2.0.0',
            'request': 'GetFeature',
            'typeName': typename,
            'outputFormat': 'application/json',
            'count': chunk_size,
            'startIndex': start_index
        }
        
        response = requests.get(wfs_url, params=params, timeout=120)
        gdf = gpd.read_file(response.text)
        
        if len(gdf) == 0:
            break
        
        all_features.append(gdf)
        start_index += chunk_size
        
        # Be nice to the server
        time.sleep(0.5)
        
        print(f"Fetched {start_index} features...")
    
    return pd.concat(all_features, ignore_index=True)
```

### 6.4 Performance Optimization

1. **Use BBOX filtering** to limit data transfer:
   ```python
   bbox = (10.7, 59.9, 10.8, 60.0)  # minx, miny, maxx, maxy
   ```

2. **Use CQL filters** server-side to reduce data:
   ```python
   cql = "arealformal IN ('1110', '1802')"
   ```

3. **Cache results** locally:
   ```python
   gdf.to_file('cached_data.gpkg', driver='GPKG')
   ```

4. **Parallel processing** for multiple municipalities:
   ```python
   from concurrent.futures import ThreadPoolExecutor
   
   with ThreadPoolExecutor(max_workers=5) as executor:
       results = executor.map(analyze_municipality, municipalities)
   ```

5. **Spatial indexing** for local operations:
   ```python
   gdf.sindex  # Build spatial index automatically used by GeoPandas
   ```

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: MVP (Weeks 1-4)
1. Set up municipality WFS discovery pipeline
2. Implement core difference calculation for 3-5 municipalities
3. Build basic opportunity export

### Phase 2: Scale (Weeks 5-8)
1. Expand to 20-30 priority municipalities
2. Implement caching and performance optimization
3. Add data quality validation

### Phase 3: Production (Weeks 9-12)
1. Full national coverage (all municipalities)
2. Automated daily/weekly updates
3. Integration with property data (Matrikkelen)

---

## 8. KEY TAKEAWAYS

1. **From 2026, query municipalities individually** - national aggregation ended
2. **Target arealformål codes:** 1110 (Bolig), 1801/1802 (Blanding) for KP; 1110-1150 for RP
3. **Filter planstatus = 3 or 6** for approved reguleringsplaner
4. **Use GeoPandas overlay(how='difference')** for the core calculation
5. **Arealplaner.no** is the best fallback for municipalities without direct WFS
6. **Expect 1-3 month lag** between plan approval and API availability
7. **Always validate data quality** - small artifacts and invalid geometries are common

---

## 9. REFERENCES

- [GeoNorge API Documentation](https://www.geonorge.no/aktuelt/om-geonorge/slik-bruker-du-geonorge/bruke-tjenester-og-api-er/)
- [SOSI Produktspesifikasjon Reguleringsplaner Del 3.2](https://register.geonorge.no/produktspesifikasjoner/del-3.2-reguleringsplaner)
- [SOSI Kodelister - KpArealformål](https://register.geonorge.no/sosi-kodelister/plan/kommuneplan/kparealformål)
- [SOSI Kodelister - RpArealformål](https://register.geonorge.no/sosi-kodelister/plan/reguleringsplan/rparealformål)
- [SOSI Kodelister - Planstatus](https://register.geonorge.no/sosi-kodelister/plan/planregister/planstatus)
- [GeoPandas Overlay Documentation](https://geopandas.org/en/stable/docs/user_guide/set_operations.html)
- [OWSLib Documentation](https://geopython.github.io/OWSLib/)
- [Arealplaner.no](https://arealplaner.no/)

---

*Report compiled for 3dje Boligsektor - Tomte-Sourcing System development*
