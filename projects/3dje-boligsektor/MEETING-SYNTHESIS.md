# 3dje Boligsektor — Møtedokument for Henrik
**Dato:** 1. februar 2026  
**Mål:** Velge leveranser og implementeringstilnærming for salg og utvikling

---

## 1. EXECUTIVE SUMMARY

Vi skal bygge et automatisk tomte-sourcing-system for 3dje Boligsektor som identifiserer utviklingsmulige tomter i norske kommuner, finner eierne, og hjelper til med oppkjøp. Systemet kombinerer GIS-analyse (kartdata), kommunestatistikk, og automatisk eier-oppslag.

| Nivå | Tidslinje | Kostnad | Best for |
|------|-----------|---------|----------|
| **Enkel** | 4 uker | NOK 50-75k | Rask validering, manuelt arbeid |
| **Middels** | 10 uker | NOK 250-350k | Balansert hastighet & automatikk |
| **Avansert** | 20 uker | NOK 600-800k | Full automatisering & AI |

---

## 2. FASE 1: KOMMUNEANALYSE (3 tilnærminger)

### Fase 1 — Enkel (Manuell)
**Hva vi leverer:**
- Prioritert liste over 50 kommuner med høyest utviklingspotensial
- Excel/Clay-database med nøkkeltall (befolkningsvekst, boligpriser, politisk landskap)
- Manuell research av kommunale nettsider

**Datakilder:**
- SSB PxWebApi (gratis) — statistikk per kommune
- Manuell research av kommunale nettsider
- Clay enrichment for kontaktinfo

**Teknisk:**
- Ingen koding — Clay + Airtable
- Python-script for SSB-uttrekk (valgfritt)

**Timeline:** 2-3 uker  
**Kostnad:** NOK 15-25k (primært manuelt arbeid)

**Begrensninger:**
- Tungt manuelt arbeid
- Ikke skalerbart til alle 356 kommuner
- Data blir fort utdatert

---

### Fase 1 — Middels (Semi-automatisk)
**Hva vi leverer:**
- Automatisk dashboard med alle 356 kommuner
- Score basert på 7 faktorer (befolkning, økonomi, politikk, etc.)
- Automatisk oppdatering av statistikk
- Prioritert topp-50 liste

**Datakilder:**
- **SSB PxWebApi v2** (gratis) — all kommune-statistikk
  - Befolkningsvekst og prognoser
  - Boligprisindekser
  - Byggetillatelser
  - Inntektsnivå
- **Kommunedatabasen (Sikt)** (gratis) — historiske data

**Teknisk:**
```python
# scripts/fetch_kommune_data.py
import requests
import pandas as pd

def fetch_ssb_data(kommune_list):
    """Henter statistikk for kommuner fra SSB"""
    url = "https://data.ssb.no/api/pxwebapi/v2/table"
    # API-kall for befolkning, boligpriser, etc.
    return df

def calculate_kommune_score(df):
    """Beregner score 0-100 basert på vektede faktorer"""
    # Vekting: vekst 30%, prisutvikling 25%, etc.
    return scored_df
```

**Backend:**
- PostGIS-database for lagring
- FastAPI for API-endepunkter
- Automatisk daglig sync

**Timeline:** 4-6 uker  
**Kostnad:** NOK 75-125k

---

### Fase 1 — Avansert (Fullt automatisert)
**Hva vi leverer:**
- ML-basert prediksjon av kommune-utvikling
- Konkurranseanalyse (hva andre utviklere gjør)
- Sanntids-varsling av endringer
- Integrasjon med arealplaner

**Datakilder:**
- Alle fra Middels-nivå
- **GeoNorge WFS** — arealplaner per kommune
- **Husbanken Monitor** — støtteordninger
- Web-scraping av kommunale møteprotokoller

**Teknisk:**
```python
# scripts/predict_kommune_potential.py
from sklearn.ensemble import RandomForestRegressor

def train_prediction_model(historical_data):
    """Tren modell på historiske suksess-kommuner"""
    model = RandomForestRegressor()
    return model

def predict_future_growth(kommune_data):
    """Prediker 5-års vekstpotensial"""
    return predictions
```

**Timeline:** 8-10 uker  
**Kostnad:** NOK 200-300k

---

## 3. FASE 2: TOMTESOURCING (3 tilnærminger)

### Fase 2 — Enkel (Manuell identifisering)
**Hva vi leverer:**
- 200+ manuelt identifiserte tomter i topp-10 kommuner
- Airtable-database med grunnleggende info (størrelse, plassering, estimert kapasitet)
- Lenker til Arealplaner.no for hver kommune
- Standard prosedyrer (SOPs) for manuell research

**Datakilder:**
- **Arealplaner.no** — manuell gjennomgang per kommune
- **GeoNorge WMS** (gratis) — visning av kart
- Manuell analyse i QGIS eller nettleser

**Teknisk:**
- Ingen automatikk — manuell research
- Airtable for lagring
- Clay for eier-oppslag (der tilgjengelig)

**Workflow:**
1. Gå til Arealplaner.no for hver kommune
2. Identifiser områder med BO- eller BL-soner
3. Sjekk reguleringsplaner
4. Manuell vurdering av tomtepotensial
5. Lagre i Airtable

**Timeline:** 4 uker (sammen med Fase 1)  
**Kostnad:** NOK 30-50k (manuelt arbeid)

---

### Fase 2 — Middels (Automatisk kart-analyse)
**Hva vi leverer:**
- Automatisk identifisering av 5,000+ potensielle tomter
- Daglig synkronisering av plan-data
- "Differanse-algoritme" som finner arealer med byggepotensial
- Scoring av hver tomt (0-100)
- Eier-identifisering via Kartverket

**Datakilder:**
- **GeoNorge WFS** (gratis) — kommuneplaner og reguleringsplaner
- **Kartverket Matrikkel API** (gratis med avtale) — eiendomsdata
- **SSB** — demografisk kontekst

**Teknisk — Dette er kjernen:**

#### 4.2 Differanse-logikken (Finne utviklingsbare tomter)

**Konsept:**
1. **Kommuneplan** = det store bildet (hvor det er lov å bygge)
2. **Reguleringsplan** = detaljerte planer (allerede utviklet)
3. **Differanse** = områder med bygge-lov men ikke detaljert planlagt = muligheter

**Algoritme:**
```python
# scripts/calculate_differanse.py
import geopandas as gpd
from shapely.ops import unary_union

def calculate_development_opportunities(kommune_nr):
    """
    Finner arealer som ER i kommuneplanen (bygge-lov)
    men IKKE i reguleringsplanen (ikke utviklet enda)
    """
    # 1. Hent kommuneplan (areal med byggerett)
    kommuneplan = fetch_kommuneplan(kommune_nr)
    # Filter: BO (bolig), BL (blanding), etc.
    bygge_soner = kommuneplan[kommuneplan['sonetype'].isin(['BO', 'BL', 'B'])]
    
    # 2. Hent reguleringsplaner (allerede planlagte områder)
    reguleringer = fetch_reguleringsplaner(kommune_nr)
    utviklede = unary_union(reguleringer.geometry)
    
    # 3. Beregn differanse
    potensial_omrader = []
    for zone in bygge_soner.itertuples():
        # Trekk fra allerede utviklede områder
        differanse = zone.geometry.difference(utviklede)
        if differanse.area > MIN_AREA_THRESHOLD:  # f.eks. 2000 m²
            potensial_omrader.append({
                'geometry': differanse,
                'area_m2': differanse.area,
                'kommune': kommune_nr,
                'sonetype': zone.sonetype
            })
    
    return gpd.GeoDataFrame(potensial_omrader)
```

#### Python-scriptene som trengs:

**1. fetch_kommuneplaner.py**
```python
"""
Henter kommuneplaner fra GeoNorge WFS
Input: Kommunenummer (f.eks. "0301")
Output: GeoJSON med bygge-soner
"""
from owslib.wfs import WebFeatureService

def fetch_kommuneplan(kommune_nr):
    wfs = WebFeatureService('https://wfs.geonorge.no/...', version='2.0.0')
    layer = 'kommuneplaner_arealbruk'
    filter_xml = f"""
        <Filter>
            <PropertyIsEqualTo>
                <PropertyName>kommunenummer</PropertyName>
                <Literal>{kommune_nr}</Literal>
            </PropertyIsEqualTo>
        </Filter>
    """
    response = wfs.getfeature(typename=layer, filter=filter_xml)
    return parse_to_geodataframe(response)
```

**2. fetch_reguleringsplaner.py**
```python
"""
Henter reguleringsplaner fra GeoNorge
Input: Kommunenummer
Output: GeoJSON med regulerte områder
"""
# Samme mønster, annet WFS-lag
```

**3. calculate_differanse.py**
```python
"""
Beregner differanse mellom kommuneplan og regulering
Input: GeoDataFrames for kommuneplan og regulering
Output: GeoDataFrame med potensielle utviklingsområder
"""
# Se algoritme ovenfor
```

**4. extract_lots.py**
```python
"""
Deler potensielle områder inn i individuelle "tomter"
Basert på eksisterende eiendomsgrenser fra matrikkelen
Input: Differanse-polygoner
Output: Liste med potensielle tomter
"""
import geopandas as gpd

def extract_individual_lots(potential_areas, matrikkel_data):
    # Spatial join med matrikkel-enheter
    lots = gpd.sjoin(potential_areas, matrikkel_data, how='inner')
    # Filtrer: minst 1 daa, ikke vernet, etc.
    lots = lots[lots['area_m2'] >= 1000]
    return lots
```

**5. score_lots.py**
```python
"""
Beregner score 0-100 for hver tomt
Input: Tomt med attributter
Output: Scoret tomt
"""
def score_lot(lot):
    score = 0
    # Faktorer:
    score += min(lot['area_m2'] / 2000 * 20, 20)  # Størrelse
    score += lot['centrality_score'] * 15  # Nærhet til sentrum
    score += lot['infrastructure_score'] * 15  # Vei/vann/avløp
    score += lot['political_score'] * 10  # Politisk vilje
    # ... etc
    return min(score, 100)
```

**6. fetch_owners.py**
```python
"""
Henter eierinfo fra Kartverket Matrikkel API
Input: GNR/BNR + kommunenummer
Output: Eiernavn og adresse
"""
import requests

def fetch_owner(gnr, bnr, kommune_nr):
    url = f"https://api.matrikkel.no/v1/eiendom/{kommune_nr}/{gnr}/{bnr}/hjemmelshaver"
    response = requests.get(url, headers={'Authorization': f'Bearer {TOKEN}'})
    return response.json()
```

**7. sync_to_crm.py**
```python
"""
Synkroniserer tomter til Airtable/CRM
Input: Prosesserte tomter
Output: Oppdatert CRM
"""
```

#### Teknisk arkitektur:

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTOMATISK KARTSYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────┐   │
│  │  GeoNorge    │    │  Kartverket   │    │     SSB     │   │
│  │    WFS       │    │   Matrikkel   │    │   PxWebApi  │   │
│  └──────┬───────┘    └──────┬───────┘    └──────┬──────┘   │
│         │                   │                    │          │
│         └───────────────────┴────────────────────┘          │
│                         │                                   │
│              ┌──────────▼──────────┐                        │
│              │  ETL Pipeline       │                        │
│              │  (Airflow DAGs)     │                        │
│              │  • Daily at 02:00   │                        │
│              └──────────┬──────────┘                        │
│                         │                                   │
│              ┌──────────▼──────────┐                        │
│              │    PostGIS DB       │                        │
│              │  • Spatial indices  │                        │
│              │  • Polygon storage  │                        │
│              └──────────┬──────────┘                        │
│                         │                                   │
│         ┌───────────────┼───────────────┐                   │
│         │               │               │                   │
│  ┌──────▼─────┐  ┌──────▼─────┐  ┌──────▼─────┐            │
│  │ Scoring    │  │   Eier     │  │  Dashboard │            │
│  │ Engine     │  │  Oppslag   │  │    API     │            │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘            │
│         │               │               │                   │
│         └───────────────┴───────────────┘                   │
│                         │                                   │
│              ┌──────────▼──────────┐                        │
│              │   Airtable CRM      │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

#### Implementasjons-steg (kart-delen):

1. **Sett opp PostGIS** (dag 1-2)
   ```bash
   docker run -e POSTGRES_PASSWORD=*** postgis/postgis:15-3.3
   ```

2. **Registrer Kartverket API-tilgang** (dag 2-3)
   - Søk om "Norge Digitalt"-partnerskap
   - Alternativt: Bruk Åpne Data (begrenset)

3. **Skriv fetch-kommuneplaner.py** (dag 3-5)
   - Koble til GeoNorge WFS
   - Test med én kommune først
   - Lagre til PostGIS

4. **Skriv fetch-reguleringsplaner.py** (dag 5-7)
   - Samme mønster, annet lag

5. **Bygg differanse-motoren** (dag 7-10)
   - Shapely/GeoPandas for spatial operasjoner
   - Test nøye med kjente case

6. **Eier-oppslag** (dag 10-12)
   - Kartverket Matrikkel API
   - Lagre eier-info

7. **Dashboard/API** (dag 12-15)
   - FastAPI-endepunkter
   - Filtrering og søk

**Timeline:** 6-8 uker  
**Kostnad:** NOK 150-200k

---

### Fase 2 — Avansert (AI-drevet plattform)
**Hva vi leverer:**
- ML-modeller som predikerer hvilke tomter som vil lykkes
- Sanntids overvåking av alle norske kommuner
- Konkurranse-intelligens (hva andre gjør)
- Automatisk pris-estimering
- Integrasjon med megler-systemer

**Ekstra teknisk:**
```python
# scripts/predict_success.py
from sklearn.ensemble import GradientBoostingClassifier

def predict_lot_success(lot_features):
    """Prediker sannsynlighet for vellykket oppkjøp"""
    # Features: størrelse, beliggenhet, eier-type, markedsdata
    return model.predict_proba(lot_features)
```

**Timeline:** 12-16 uker  
**Kostnad:** NOK 400-500k

---

## 4. SYSTEMEGENSKAPER PER NIVÅ

| Egenskap | Enkel | Middels | Avansert |
|----------|:-----:|:-------:|:--------:|
| **Fase 1: Kommuneanalyse** ||||
| Antall kommuner analysert | 50 | 356 | 356+prediksjoner |
| Automatisk statistikk | ❌ | ✅ | ✅+ML |
| Score-algoritme | Manuell | Regelbasert | ML-basert |
| Oppdateringsfrekvens | Manuell | Daglig | Sanntid |
| **Fase 2: Tomtesourcing** ||||
| Tomte-identifisering | Manuell (200+) | Auto (5,000+) | Auto (50,000+) |
| Differanse-beregning | ❌ | ✅ | ✅+prediktiv |
| Eier-oppslag | Manuell | Auto via API | Auto + berikelse |
| Daglig data-sync | ❌ | ✅ | ✅+streaming |
| **Teknisk** ||||
| PostGIS-database | ❌ | ✅ | ✅ (HA) |
| Python-backend | ❌ | ✅ | ✅+microservices |
| Airflow ETL | ❌ | ✅ | ✅+real-time |
| ML-modeller | ❌ | ❌ | ✅ |
| **Brukergrensesnitt** ||||
| Kart-visualisering | QGIS/Nettleser | Web-kart | Avansert GIS |
| CRM | Airtable | Airtable | Custom app |
| Rapporter | Manuell | Auto-ukentlig | Auto+custom |

---

## 5. ANBEFALING

### Hva vi anbefaler for dagens møte: **Middels-nivå**

**Hvorfor:**
1. **God balanse** — solid automatikk uten å vente 5 måneder
2. **Bevisbar verdi** — automatisk kart-analyse er konkret og selgbart
3. **Bygger videre** — kan utvides til avansert senere
4. **Rimelig budsjett** — NOK 250-350k er overkommelig
5. **Jakobs fokus** — automatisk map-data er kjernen her

**Hva vi lover kunden:**
- Automatisk identifisering av utviklingsbare tomter
- 5,000+ potensielle tomter i databasen
- Eier-oppslag for alle tomter
- Scoring og prioritering
- Daglig oppdaterte data
- CRM for oppfølging

**Hva vi bygger i fase 2:**
1. PostGIS-database for alle kartdata
2. ETL-pipeline (Airflow) for daglig sync
3. Differanse-algoritme (kjerne-funksjon)
4. Eier-oppslag via Kartverket
5. Scoring-system
6. Airtable-integrasjon

**Hva vi kan tilby senere (Avansert):**
- ML-prediksjoner
- Konkurranse-overvåking
- Automatisk verdivurdering
- Megler-integrasjoner

---

## 6. LEVERANDER PER NIVÅ (Hva kunden betaler for)

### Enkel — NOK 50-75k
**Inkluderer:**
- 50 kommune-profiler (manuelt researchet)
- 200+ manuelt identifiserte tomter
- Airtable-oppsett med SOPs
- 3 måneders bruk av Clay
- Grunnleggende opplæring

**Egnet for:** Rask start, validere markedet

---

### Middels — NOK 250-350k
**Inkluderer:**
- Automatisk kart-system (PostGIS + Python)
- 5,000+ automatisk identifiserte tomter
- Differanse-algoritme
- Daglig data-sync
- Eier-oppslag for alle tomter
- Scoring-system (0-100)
- Airtable CRM
- Web-dashboard for kart
- Opplæring og dokumentasjon
- 6 måneder drift/support

**Egnet for:** Seriøs skalering, automatikk, salg til investorer

---

### Avansert — NOK 600-800k
**Inkluderer:**
- Alt fra Middels
- ML-prediksjoner
- Sanntids-overvåking
- Konkurranse-analyse
- Custom CRM-app
- API for eksterne integrasjoner
- Avansert rapportering
- 12 måneder drift/support

**Egnet for:** Enterprise, lisensiering, stor skala

---

## 7. NESTE STEG (Hva vi må bestemme i dag)

### Spørsmål til Henrik:

1. **Budsjett** — Hva er realistisk å bruke?
   - [ ] NOK 50-75k (Enkel)
   - [ ] NOK 250-350k (Middels — anbefalt)
   - [ ] NOK 600-800k (Avansert)

2. **Tidslinje** — Når må vi vise resultater?
   - [ ] 4 uker
   - [ ] 10 uker
   - [ ] 20+ uker

3. **Tekniske ressurser** — Hvem bygger?
   - [ ] Jakob selv
   - [ ] Ansette utvikler
   - [ ] Outsourcing

4. **Kundeløfte** — Hva skal vi love?
   - [ ] Rask MVP med manuelt arbeid
   - [ ] Solid automatisert system
   - [ ] Avansert AI-plattform

5. **Første salg** — Hvordan finansiere videre utvikling?
   - [ ] Selge Enkel først, reinvestere
   - [ ] Gå rett på Middels med investering
   - [ ] Søke større finansiering for Avansert

---

## 8. KOSTNADSOVERSIKT (Middels — Anbefalt)

### Utvikling (engangs)
| Komponent | Timer | Est. kostnad |
|-----------|-------|--------------|
| PostGIS + infrastruktur | 20 | NOK 30k |
| ETL-pipeline (Airflow) | 40 | NOK 60k |
| GeoNorge/Kartverket-integrasjon | 50 | NOK 75k |
| Differanse-algoritme | 30 | NOK 45k |
| Eier-oppslag | 20 | NOK 30k |
| Scoring-system | 20 | NOK 30k |
| Airtable-integrasjon | 15 | NOK 22k |
| Dashboard/API | 30 | NOK 45k |
| Testing + dok | 20 | NOK 30k |
| **TOTAL** | **245** | **~NOK 367k** |

*Kan justeres ned med NOK 50-100k ved å kutte scope*

### Drift (månedlig)
| Tjeneste | Kostnad |
|----------|---------|
| VPS (DigitalOcean) | $20 |
| Airtable (2 brukere) | $40 |
| Backup + diverse | $20 |
| **TOTAL** | **~$80/mnd** |

### API-kostnader
| API | Kostnad |
|-----|---------|
| GeoNorge WFS/WMS | Gratis |
| Kartverket Matrikkel | Gratis |
| SSB PxWebApi | Gratis |
| **TOTAL** | **NOK 0** |

---

## 9. RISIKOER OG MITIGERING

| Risiko | Sannsynlighet | Impact | Mitigering |
|--------|--------------|--------|------------|
| Kartverket API-tilgang tar tid | Middels | Høy | Søke umiddelbart, bruke Åpne Data som fallback |
| Datakvalitet varierer per kommune | Høy | Middels | Legge til data-quality scoring, flagge usikker data |
| Eier-oppslag begrenset (GDPR) | Middels | Middels | Kombinere flere kilder, manuell verifisering |
| Reguleringsplan-data ufullstendig | Høy | Middels | Tydelig kommunikasjon til kunde, "best effort" |
| SSB rate-limits (30/min) | Lav | Lav | Implementere caching, spre kall over tid |

---

## 10. KONKLUSJON

**Anbefaling:** Gå for **Middels-nivået** — automatisk kart-system med NOK 250-350k budsjett.

**Argumentasjon for salg:**
- "Vi har bygget et system som automatisk scanner alle norske kommuner for utviklingspotensial"
- "Daglig oppdatert database med tusenvis av tomter"
- "Automatisk eier-oppslag — dere slipper manuell research"
- "Scoring basert på 7 faktorer — fokuser på de beste mulighetene"

**Dette gir 3dje Boligsektor:**
- Konkurransedyktig fordel (få andre har dette)
- Skalerbarhet (kan håndtere 10,000+ tomter)
- Profesjonelt produkt å selge til investorer
- Grunnlag for videre AI-utvikling

---

*Dokument klart for gjennomgang med Henrik*
