# Deep Dive: Kartverket/Geonorge APIs for 3dje Boligsektor

**Research Date:** February 2026  
**Purpose:** Identify developable land (tomter) for social housing in Norway  
**Researcher:** Fred (OpenClaw)

---

## Executive Summary

Kartverket provides comprehensive APIs for accessing Norwegian property data. For the 3dje Boligsektor tomte-sourcing system, we need to combine:

1. **Open data (no authentication):** WFS/WMS for property boundaries, addresses
2. **Restricted data (requires agreement):** Matrikkel API for owner information (hjemmelshaver)

**Critical Finding:** Owner data (hjemmelshaver) requires a formal agreement with Kartverket under the "Utleveringsforskriften". Organizations with "berettiget interesse" (legitimate interest) can access this data.

---

## 1. WFS/WMS Endpoints Overview

### 1.1 Property Boundaries (Eiendomsgrenser/Teiger)

| Service | Endpoint | Type | Auth Required |
|---------|----------|------|---------------|
| **Matrikkelen WFS - Eiendomskart Teig** | `https://wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig` | WFS 2.0 | No |
| **Matrikkelen Enkel WMS** | `https://wms.geonorge.no/skwms1/wms.matrikkel.seeiendom2` | WMS | No |
| **Matrikkelen WMS** | `https://wms.geonorge.no/skwms1/wms.matrikkel.v1` | WMS | Yes (IP-based) |

#### Available Feature Types (WFS)
- `app:Teig` - Property parcels with geometry
- `app:Eiendomsgrense` - Property boundary lines
- `app:Anleggsprojeksjonsflate` - Construction projection surfaces
- `app:Anleggsprojeksjonsgrense` - Construction boundary lines
- `app:Hjelpelinje` - Auxiliary lines

#### Key Attributes (Teig)
```xml
- matrikkelnummertekst (gnr/bnr/fnr)
- kommunenummer
- teigId
- areal (area in m²)
- punktfeste (point-based boundary)
```

### 1.2 Addresses (Adresser)

| Service | Endpoint | Type | Auth Required |
|---------|----------|------|---------------|
| **Adresse REST API** | `https://ws.geonorge.no/adresser/v1/` | REST/JSON | No |
| **Matrikkelen-Adresse WFS** | `https://wfs.geonorge.no/skwms1/wfs.matrikkelen-adresse` | WFS 2.0 | No |

#### REST API Query Examples

```bash
# General address search
GET https://ws.geonorge.no/adresser/v1/sok?sok=munkegata+1+trondheim

# Specific field search
GET https://ws.geonorge.no/adresser/v1/sok?adressenavn=Munkegata&nummer=1&kommunenummer=5001

# Point/radius search (100m radius)
GET https://ws.geonorge.no/adresser/v1/punktsok?radius=100&lat=61.2461&lon=8.9203

# Filtered response (only specific fields)
GET https://ws.geonorge.no/adresser/v1/sok?adressenavn=Øvrevegen&nummer=14&filtrer=adresser.kommunenummer,adresser.representasjonspunkt
```

#### Query Parameters (REST API)

| Parameter | Type | Description |
|-----------|------|-------------|
| `sok` | string | General search across all fields, supports wildcard `*` |
| `fuzzy` | boolean | Fuzzy matching (approximate search) |
| `adressenavn` | string | Street name |
| `nummer` | integer | House number |
| `bokstav` | string | House letter (e.g., "A", "B") |
| `kommunenummer` | string | 4-digit municipality code |
| `gardsnummer` | integer | Farm number (gnr) |
| `bruksnummer` | integer | Unit number (bnr) |
| `postnummer` | string | 4-digit postal code |
| `treffPerSide` | integer | Results per page (max 1000) |
| `side` | integer | Page number (0-indexed) |
| `utkoordsys` | integer | Output CRS (e.g., 25833, 4326) |

### 1.3 Planning Data (Kommuneplan/Arealplan)

| Service | Endpoint | Type | Auth Required |
|---------|----------|------|---------------|
| **Planområde WMS** | `https://wms.geonorge.no/skwms1/wms.planomraade` | WMS | No |

#### Available Layers
- `Nasjonale_forventninger` - National expectations
- `Statlig_arealplan` - State-level plans
- `Regional_plan` - Regional plans
- `Kommune-_og_kommunedelplan` - Municipal plans
- `Eldre_reguleringsplan` - Older regulation plans

---

## 2. Matrikkel API for Owner Lookup

### 2.1 API Type
- **Protocol:** SOAP (not REST)
- **Access:** Requires formal agreement with Kartverket
- **Base URL:** `https://matrikkel.no/matrikkelapi/wsapi/v1/`

### 2.2 Services Available

| Service | Purpose |
|---------|---------|
| `MatrikkelenhetService` | Query property units by gnr/bnr/fnr |
| `PersonService` | Get person/owner information |
| `TeigService` | Query property parcels |
| `BygningService` | Building information |
| `AdresseService` | Address lookups |
| `RapportService` | Generate PDF/XML reports |
| `MatrikkelsokService` | Search service |

### 2.3 Key Method for Owner Lookup

```csharp
// Example: Get property unit by matrikkel number
MatrikkelenhetService.findMatrikkelenhetByMatrikkelnummer(
    kommunenummer: "0301",
    gaardsnummer: 1,
    bruksnummer: 2,
    festenummer: 0
)
```

### 2.4 Authentication Process

1. **Apply for access:** Submit form at https://kartverket.no/api-og-data/eiendomsdata/soknad-api-tilgang
2. **Legal basis required:** Organization must have "berettiget interesse" per Utleveringsforskriften §4
3. **Agreement signing:** Kartverket reviews and sends agreement
4. **IP whitelisting:** Access typically restricted by IP address
5. **Credentials:** Username/password for SOAP authentication

### 2.5 Data Access Levels

| Level | Access | Requirements |
|-------|--------|--------------|
| **Full access** | All matrikkel/grunnbok data | Stat/kommune, banks, lawyers, real estate agents (§4.3) |
| **Berettiget interesse** | Owner name, no personnummer/heftelser | Business/educational purpose (§4.4-5) |
| **Open data** | Addresses, boundaries, no owner info | None |

### 2.6 GDPR Considerations

- **Personal data:** Owner names are personal data
- **Legal basis:** Required for all access to owner information
- **Processing agreement:** Required if acting as data processor
- **Storage limitations:** Must comply with data minimization principles
- **Audit:** Kartverket can revoke access for violations

---

## 3. Spatial Queries

### 3.1 WFS Spatial Filter Capabilities

The WFS services support OGC Filter Encoding 2.0 with these spatial operators:

| Operator | Description |
|----------|-------------|
| `BBOX` | Bounding box intersection |
| `Intersects` | Geometry intersection |
| `Within` | Completely within geometry |
| `Contains` | Contains geometry |
| `Overlaps` | Spatial overlap |
| `Disjoint` | No spatial relation |
| `Equals` | Exact geometry match |

### 3.2 BBOX Query Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<wfs:GetFeature 
    xmlns:wfs="http://www.opengis.net/wfs/2.0"
    xmlns:fes="http://www.opengis.net/fes/2.0"
    xmlns:gml="http://www.opengis.net/gml/3.2"
    service="WFS"
    version="2.0.0"
    outputFormat="application/gml+xml; version=3.2">
    <wfs:Query typeNames="app:Teig" srsName="urn:ogc:def:crs:EPSG::25833">
        <fes:Filter>
            <fes:BBOX>
                <fes:ValueReference>teig</fes:ValueReference>
                <gml:Envelope srsName="urn:ogc:def:crs:EPSG::25833">
                    <gml:lowerCorner>263000 6650000</gml:lowerCorner>
                    <gml:upperCorner>264000 6651000</gml:upperCorner>
                </gml:Envelope>
            </fes:BBOX>
        </fes:Filter>
    </wfs:Query>
</wfs:GetFeature>
```

### 3.3 Polygon Intersection Query

```xml
<?xml version="1.0" encoding="UTF-8"?>
<wfs:GetFeature 
    xmlns:wfs="http://www.opengis.net/wfs/2.0"
    xmlns:fes="http://www.opengis.net/fes/2.0"
    xmlns:gml="http://www.opengis.net/gml/3.2"
    service="WFS"
    version="2.0.0">
    <wfs:Query typeNames="app:Teig">
        <fes:Filter>
            <fes:Intersects>
                <fes:ValueReference>teig</fes:ValueReference>
                <gml:Polygon srsName="urn:ogc:def:crs:EPSG::25833">
                    <gml:exterior>
                        <gml:LinearRing>
                            <gml:posList>
                                263000 6650000 
                                264000 6650000 
                                264000 6651000 
                                263000 6651000 
                                263000 6650000
                            </gml:posList>
                        </gml:LinearRing>
                    </gml:exterior>
                </gml:Polygon>
            </fes:Intersects>
        </fes:Filter>
    </wfs:Query>
</wfs:GetFeature>
```

### 3.4 CQL Filter (Simpler Alternative)

```bash
# Using CQL_FILTER for spatial queries
GET https://wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig?
    service=WFS&
    version=2.0.0&
    request=GetFeature&
    typeName=app:Teig&
    CQL_FILTER=INTERSECTS(teig,POLYGON((263000 6650000,264000 6650000,264000 6651000,263000 6651000,263000 6650000)))
```

---

## 4. Technical Specifications

### 4.1 Supported Coordinate Reference Systems

| EPSG Code | Name | Usage |
|-----------|------|-------|
| 25832 | ETRS89 / UTM zone 32N | Southern Norway |
| 25833 | ETRS89 / UTM zone 33N | Central Norway |
| 25834 | ETRS89 / UTM zone 34N | Northern Norway |
| 25835 | ETRS89 / UTM zone 35N | Finnmark |
| 4326 | WGS 84 | Global GPS |
| 4258 | ETRS89 | European reference |
| 3857 | Web Mercator | Web mapping |

### 4.2 Response Formats

| Format | Content-Type | Notes |
|--------|--------------|-------|
| GML 3.2.1 | `application/gml+xml; version=3.2` | Default WFS format |
| GeoJSON | Not directly supported | Use GML → GeoJSON conversion |

### 4.3 Rate Limits

| Service | Limit | Notes |
|---------|-------|-------|
| Adresse REST API | 10,000 results max | For larger datasets, download files from Geonorge |
| Matrikkel SOAP API | No explicit limit | Subject to fair use |
| WFS | 1,000,000 features | Default count constraint |
| WMS | No explicit limit | Subject to fair use |

### 4.4 Update Frequency

| Dataset | Update Frequency | Delay |
|---------|------------------|-------|
| Matrikkel WFS/WMS | Daily | ~24 hours |
| Adresse REST API | Near real-time | ~30 minutes |
| Matrikkel SOAP API | Real-time | Live data |

---

## 5. SDKs and Libraries

### 5.1 .NET / C#

**GeoNorgeAPI** - For CSW/catalog operations
```bash
PM> Install-Package GeoNorgeAPI
```

**Matrikkel API Client** - Kartverket provides example clients
- Java example: Available from matrikkel.no
- .NET/C# example: Available from matrikkel.no

### 5.2 Python

```python
# OWSLib for WFS/WMS
from owslib.wfs import WebFeatureService

wfs = WebFeatureService(
    url='https://wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig',
    version='2.0.0'
)

# Get capabilities
print(wfs.contents)

# Get features with BBOX filter
response = wfs.getfeature(
    typename='app:Teig',
    bbox=(263000, 6650000, 264000, 6651000),
    srsname='urn:ogc:def:crs:EPSG::25833'
)
```

### 5.3 JavaScript/Node.js

```javascript
// Using fetch for REST API
const response = await fetch(
    'https://ws.geonorge.no/adresser/v1/sok?' + 
    new URLSearchParams({
        sok: 'Storgata 1 Oslo',
        treffPerSide: '10'
    })
);
const data = await response.json();
```

---

## 6. Implementation Recommendations

### 6.1 Architecture for 3dje Boligsektor

```
┌─────────────────────────────────────────────────────────────┐
│                    3dje Boligsektor System                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Frontend  │  │   Backend   │  │   Data Processor    │ │
│  │  (Map UI)   │  │   (API)     │  │  (Batch/Analysis)   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                    │            │
│         └────────────────┼────────────────────┘            │
│                          │                                  │
│                    ┌─────┴─────┐                           │
│                    │  Cache/   │                           │
│                    │  Database │                           │
│                    └─────┬─────┘                           │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
     ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
     │  Address  │  │ Property  │  │   Owner   │
     │    API    │  │   WFS     │  │   SOAP    │
     │  (Open)   │  │  (Open)   │  │ (Agreement│
     └───────────┘  └───────────┘  └───────────┘
      ws.geonorge   wfs.geonorge    matrikkel.no
```

### 6.2 Workflow for Tomte-Sourcing

1. **Define Search Area**
   - User draws polygon on map or selects kommune
   - Convert to appropriate CRS (EPSG:25833)

2. **Query Properties**
   - Use WFS BBOX or INTERSECTS filter to get all Teig within area
   - Extract gnr/bnr/fnr/kommunenummer for each property

3. **Get Addresses**
   - Cross-reference with Adresse REST API
   - Link properties to physical addresses

4. **Get Owner Information** (if agreement in place)
   - Query Matrikkel SOAP API for each property
   - Retrieve hjemmelshaver (registered owner)
   - Store securely with GDPR compliance

5. **Analyze Development Potential**
   - Cross-reference with kommuneplan WMS
   - Check zoning (arealformål)
   - Calculate differanse (gap analysis)

### 6.3 Data Storage Considerations

- **Cache property boundaries:** Daily updates sufficient
- **Address data:** Can be cached, update periodically
- **Owner data:** Treat as personal data, minimal storage, audit logging

### 6.4 GDPR Compliance Checklist

- [ ] Sign data processing agreement with Kartverket
- [ ] Document legal basis for processing (berettiget interesse)
- [ ] Implement access controls for owner data
- [ ] Set data retention limits
- [ ] Enable audit logging for owner data access
- [ ] Provide data subject access request procedures

---

## 7. Code Examples

### 7.1 Fetch Properties Within Polygon

```python
import requests
import xml.etree.ElementTree as ET

def get_properties_in_polygon(polygon_coords, crs='25833'):
    """
    Query properties within a polygon using WFS.
    
    Args:
        polygon_coords: List of (x, y) tuples
        crs: EPSG code as string
    """
    wfs_url = 'https://wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig'
    
    # Build GML polygon
    pos_list = ' '.join([f"{x} {y}" for x, y in polygon_coords])
    
    xml_filter = f'''<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:gml="http://www.opengis.net/gml/3.2">
        <fes:Intersects>
            <fes:ValueReference>teig</fes:ValueReference>
            <gml:Polygon srsName="urn:ogc:def:crs:EPSG::{crs}">
                <gml:exterior>
                    <gml:LinearRing>
                        <gml:posList>{pos_list}</gml:posList>
                    </gml:LinearRing>
                </gml:exterior>
            </gml:Polygon>
        </fes:Intersects>
    </fes:Filter>'''
    
    params = {
        'service': 'WFS',
        'version': '2.0.0',
        'request': 'GetFeature',
        'typeName': 'app:Teig',
        'filter': xml_filter,
        'outputFormat': 'application/gml+xml; version=3.2'
    }
    
    response = requests.get(wfs_url, params=params)
    return response.content
```

### 7.2 Search Address by Property ID

```javascript
async function getAddressByProperty(kommunenummer, gardsnummer, bruksnummer) {
    const params = new URLSearchParams({
        kommunenummer,
        gardsnummer: gardsnummer.toString(),
        bruksnummer: bruksnummer.toString(),
        treffPerSide: '1'
    });
    
    const response = await fetch(`https://ws.geonorge.no/adresser/v1/sok?${params}`);
    const data = await response.json();
    
    if (data.adresser && data.adresser.length > 0) {
        return {
            address: data.adresser[0].adressetekst,
            coordinates: data.adresser[0].representasjonspunkt
        };
    }
    return null;
}
```

### 7.3 Query Matrikkel SOAP (Python with Zeep)

```python
from zeep import Client
from zeep.wsse.username import UsernameToken

def get_property_owner(kommunenummer, gnr, bnr, fnr=0):
    """
    Query property owner via Matrikkel SOAP API.
    Requires valid agreement with Kartverket.
    """
    wsdl_url = 'https://matrikkel.no/matrikkelapi/wsapi/v1/MatrikkelenhetService?wsdl'
    
    client = Client(wsdl_url, wsse=UsernameToken('username', 'password'))
    
    # Create matrikkelnummer object
    matrikkelnummer = {
        'kommunenummer': kommunenummer,
        'gaardsnummer': gnr,
        'bruksnummer': bnr,
        'festenummer': fnr
    }
    
    try:
        result = client.service.findMatrikkelenhetByMatrikkelnummer(
            matrikkelnummer=matrikkelnummer
        )
        return result
    except Exception as e:
        print(f"Error querying owner: {e}")
        return None
```

---

## 8. Limitations and Workarounds

### 8.1 Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| WFS returns GML only | Requires parsing/conversion | Use libraries like `owslib` or `pygml` |
| No bulk owner lookup | Individual SOAP calls needed | Implement batching with rate limiting |
| 10k result limit (REST) | Large areas fail | Use WFS or paginate |
| Matrikkel API requires agreement | Cannot test without access | Use test environment: `test.matrikkel.no` |
| Plan data is WMS only | Cannot query attributes | Use GetFeatureInfo or find plan register WFS |

### 8.2 Test Environment

- **Matrikkel Test:** https://test.matrikkel.no/
- **Grunnbok Test:** https://test.grunnbok.no/
- Contact Kartverket for test credentials

---

## 9. Contact Information

- **General inquiries:** post@kartverket.no
- **Technical support:** tjenestedrift@kartverket.no
- **API access applications:** https://kartverket.no/api-og-data/eiendomsdata/soknad-api-tilgang

---

## 10. References

1. [Kartverket API Documentation](https://www.kartverket.no/api-og-data)
2. [Geonorge Service Registry](https://register.geonorge.no/)
3. [Matrikkel API Documentation](https://matrikkel.no/matrikkelapi/wsapi/v1/dokumentasjon/index.html)
4. [Adresse REST API Swagger](https://ws.geonorge.no/adresser/v1/)
5. [Utleveringsforskriften](https://lovdata.no/dokument/SF/forskrift/2013-12-18-1599)
6. [WFS Standard (OGC)](http://docs.opengeospatial.org/is/09-026r2/09-026r2.html)
7. [GeoNorgeAPI GitHub](https://github.com/kartverket/GeoNorgeAPI)

---

*This report was generated for the 3dje Boligsektor project to support development of a tomte-sourcing system for social housing in Norway.*
