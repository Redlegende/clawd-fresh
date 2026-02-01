# Tech Stack Recommendation - Phase 2

**Status:** Based on API research  
**Date:** 2026-01-28  
**Goal:** Optimal technology choices for tomte-sourcing system

---

## 🎯 Decision Framework

| Criteria | Weight | Why |
|----------|--------|-----|
| Cost | 25% | Startup budget constraints |
| Integration | 20% | Must work with Norwegian APIs |
| Scalability | 20% | 10,000+ lots target |
| Maintenance | 15% | Small team, low overhead |
| Performance | 10% | GIS operations |
| Ease of use | 10% | Rapid development |

---

## 🏗️ Recommended Stack

### 1. Database: PostGIS (PostgreSQL + Spatial)

**Why:**
- ✅ Native spatial queries (ST_Intersects, ST_Area)
- ✅ Free and open source
- ✅ Integrates with all GIS tools
- ✅ Handles 10,000+ polygons easily
- ✅ SQL-based, familiar to developers

**Alternatives considered:**
- MongoDB (no native spatial joins)
- Supabase (good for app, not heavy GIS)
- Airtable (too simple, limited spatial)

**Setup:**
```bash
# Docker
docker run --name tbs-postgis \
  -e POSTGRES_PASSWORD=*** \
  -p 5432:5432 \
  postgis/postgis:15-3.3
```

**Tables:**
```sql
CREATE TABLE lots (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(POLYGON, 25833),
    kommune_nr VARCHAR(4),
    area_m2 FLOAT,
    score INT,
    status VARCHAR(50),
    created_at TIMESTAMP
);

CREATE INDEX idx_lots_geom ON lots USING GIST(geom);
```

---

### 2. Backend: Python + FastAPI

**Why:**
- ✅ Excellent GIS libraries (GeoPandas, Shapely)
- ✅ Great API client ecosystem (requests, httpx)
- ✅ Async support for I/O bound operations
- ✅ Fast development
- ✅ Jakob is comfortable with Python

**Key Libraries:**
```python
# requirements.txt
fastapi==0.104.0
uvicorn==0.24.0
sqlalchemy==2.0.0
geoalchemy2==0.14.0
geopandas==0.14.0
shapely==2.0.0
owslib==0.29.0
httpx==0.25.0
pandas==2.1.0
psycopg2-binary==2.9.0
```

**Architecture:**
```
┌─────────────────────────────────────┐
│           FastAPI App               │
├─────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐          │
│  │  WFS    │  │  REST   │          │
│  │ Service │  │  APIs   │          │
│  └────┬────┘  └────┬────┘          │
│       └─────────────┘               │
│              │                      │
│  ┌───────────▼───────────┐          │
│  │    ETL Pipeline       │          │
│  │  (Airflow/Prefect)    │          │
│  └───────────┬───────────┘          │
│              │                      │
│  ┌───────────▼───────────┐          │
│  │     PostGIS DB        │          │
│  └───────────────────────┘          │
└─────────────────────────────────────┘
```

---

### 3. ETL/Orchestration: Apache Airflow

**Why:**
- ✅ Industry standard for data pipelines
- ✅ Python-native
- ✅ Great for scheduled jobs (daily/weekly syncs)
- ✅ Monitoring and alerting built-in
- ✅ Handles API rate limiting gracefully

**DAGs:**
```python
# dags/sync_geonorge.py
from airflow import DAG
from airflow.operators.python import PythonOperator

def sync_kommuneplan():
    # Query Geonorge WFS
    # Update PostGIS
    pass

def sync_reguleringsplaner():
    # Query Geonorge WFS
    # Update PostGIS
    pass

def calculate_differanse():
    # PostGIS spatial join
    pass

dag = DAG(
    'sync_plan_data',
    schedule='0 2 * * *',  # Daily at 2 AM
    # ...
)
```

**Alternative:** Prefect (simpler, modern) - consider for v2

---

### 4. GIS Analysis: GeoPandas + PostGIS

**Why:**
- ✅ GeoPandas: Easy Python geospatial operations
- ✅ PostGIS: Fast spatial queries at scale
- ✅ Work together seamlessly

**Pattern:**
```python
import geopandas as gpd
from sqlalchemy import create_engine

# Load from PostGIS
engine = create_engine('postgresql://...')
gdf = gpd.read_postgis('SELECT * FROM lots', engine)

# Analysis
gdf['area_daa'] = gdf.area / 1000  # Convert to daa

# Save back
gdf.to_postgis('lots_analyzed', engine, if_exists='replace')
```

---

### 5. CRM: Airtable

**Why:**
- ✅ Fast setup (hours not weeks)
- ✅ Flexible data model
- ✅ Good automations
- ✅ Integration with Clay
- ✅ Mobile app for field use
- ✅ Cost: ~$20-45/user/month

**Alternative:** Monday.com (similar, more project-focused)

**Tables:**
- Lots (linked to GIS data)
- Owners
- Contacts
- Activities
- Documents

**Integration:**
```python
# Sync PostGIS → Airtable
import requests

def sync_to_airtable(lots):
    url = 'https://api.airtable.com/v0/appXXX/Lots'
    headers = {'Authorization': 'Bearer keyXXX'}
    
    for lot in lots:
        data = {
            'fields': {
                'Property ID': lot.id,
                'Kommune': lot.kommune,
                'Score': lot.score,
                'Status': lot.status,
                'Owner': lot.owner_name
            }
        }
        requests.post(url, headers=headers, json=data)
```

---

### 6. Frontend: React + MapLibre GL

**Why:**
- ✅ MapLibre: Open source, fast vector maps
- ✅ React: Component-based, maintainable
- ✅ GeoJSON support native

**Features:**
- Map visualization of lots
- Score-based coloring
- Click for details
- Filter by kommune/score

**Alternative:** Use QGIS for MVP (desktop only, free)

---

### 7. Infrastructure: DigitalOcean / Hetzner

**Why:**
- ✅ Cost-effective
- ✅ Good for PostgreSQL hosting
- ✅ Jakob is familiar with VPS

**Stack:**
- VPS: 4GB RAM, 2 vCPU (~$20/month)
- PostgreSQL + PostGIS
- Docker + Docker Compose
- Nginx reverse proxy

**Docker Compose:**
```yaml
version: '3.8'
services:
  db:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  api:
    build: ./api
    environment:
      DATABASE_URL: postgresql://...
    depends_on:
      - db
  
  airflow:
    image: apache/airflow:2.7
    # ...
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
```

---

### 8. API Integrations

**Geonorge WFS:**
- Library: OWSLib
- Pattern: Query → Cache → Process

**SSB PxWebAPI:**
- Library: requests + pyjstat
- Pattern: JSON-stat → Pandas → PostGIS

**Kartverket Matrikkel:**
- Library: Zeep (SOAP) or requests (REST)
- Pattern: Authenticate → Query → Parse

**Husbanken:**
- Library: requests + JWT
- Pattern: Maskinporten auth → REST API

---

## 💰 Cost Estimate

### Development (One-time)
| Item | Hours | Rate | Cost |
|------|-------|------|------|
| Database setup | 16 | - | - |
| ETL pipelines | 40 | - | - |
| API integrations | 60 | - | - |
| Scoring engine | 24 | - | - |
| CRM integration | 16 | - | - |
| Frontend (basic) | 40 | - | - |
| **Total** | **196** | **NOK 1,500** | **~NOK 294,000** |

*Note: Using internal/contractor rates*

### Monthly Operating Costs
| Service | Cost/month |
|---------|------------|
| VPS (DigitalOcean) | $20 |
| Airtable (2 users) | $40 |
| Domain + SSL | $10 |
| Backup storage | $10 |
| API costs (Kartverket free tier) | $0 |
| **Total** | **~$80/month** |

### API Costs (Usage-based)
| API | Expected Cost |
|-----|---------------|
| Kartverket | Free (within limits) |
| SSB | Free |
| GeoNorge | Free |
| Husbanken | Free |
| Ambita (if added later) | NOK 15,000+/year |
| Byggfakta (if added later) | Custom pricing |

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-2)
- PostGIS setup
- FastAPI scaffold
- Geonorge WFS connection
- Basic lot storage

### Phase 2: ETL + Scoring (Weeks 3-4)
- Airflow setup
- Daily sync jobs
- Scoring engine
- SSB integration

### Phase 3: Matrikkel + CRM (Weeks 5-6)
- Kartverket API registration
- Owner lookup
- Airtable integration
- Outreach tools

### Phase 4: UI + Polish (Weeks 7-8)
- Map visualization
- Filtering/search
- Reporting
- Documentation

---

## 🔄 Alternative: Clay + Airtable (No-Code/Low-Code)

**For rapid MVP:**
- **Clay:** Web scraping + API calls + enrichment
- **Airtable:** Database + CRM + automations
- **Make.com:** Workflow automation

**Pros:**
- ✅ Faster setup (days not weeks)
- ✅ No coding required
- ✅ Built-in integrations

**Cons:**
- ❌ Higher monthly cost ($100-200/month)
- ❌ Less flexible
- ❌ Volume limitations
- ❌ Harder to scale

**Recommendation:** Start with code-based stack for control, consider Clay for specific enrichment tasks.

---

## ✅ Final Recommendation

**Core Stack:**
1. **Database:** PostGIS
2. **Backend:** Python + FastAPI
3. **ETL:** Apache Airflow
4. **GIS:** GeoPandas + PostGIS
5. **CRM:** Airtable
6. **Frontend:** React + MapLibre (or QGIS for MVP)
7. **Hosting:** VPS (DigitalOcean/Hetzner)

**Budget:**
- Development: ~NOK 300,000
- Monthly: ~$80
- API usage: Mostly free

---

*Based on research of 7 Norwegian data APIs and project requirements*  
*Created: 2026-01-28*
