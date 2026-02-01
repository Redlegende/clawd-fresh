# Phase 2: Tomte-sourcing System - Implementation Plan

**Tredje Boligsektor AS**  
**Date:** 28. Januar 2026  
**Status:** Klar for implementering  
**Mål:** Pipeline mot 10.000+ boliger

---

## 🎯 Executive Summary

### Hva Vi Skal Bygge

Et **tomte-sourcing system** som systematisk identifiserer utviklingstomter i kommuneplaner som ennå ikke er detaljregulert.

**Kjernelogikk:**
```
KOMMUNEPLAN BOLIG − VEDTATT REGULERINGSPLAN = UTVIKLINGSMULIGHET
```

**Tre Parallelle Spor:**
- **Datamotor:** GIS-analyse av plandata (automatisert)
- **Grunneiermotor:** Direkte kontakt med eiere
- **Meglermotor:** Strukturert megler-relasjoner

### Nøkkeltall

| Metrikk | Mål (6 måneder) |
|---------|-----------------|
| Polygoner analysert | 5.000+ |
| Kvalifiserte (score >60) | 1.000+ |
| Grunneiere kontaktet | 300+ |
| Aktive dialoger | 50+ |
| LOI/Opsjoner signert | 10+ |
| **Estimert kapasitet** | **5.000+ boliger** |

---

## 🏗️ Teknisk Arkitektur

### Anbefalt Tech Stack

| Komponent | Teknologi | Kostnad | Begrunnelse |
|-----------|-----------|---------|-------------|
| **Database** | PostGIS | Gratis | Native spatial støtte, skalerbar |
| **Backend** | Python + FastAPI | Gratis | Ekspertise, GIS-bibliotek |
| **ETL** | Apache Airflow | Gratis | Automatisering, pålitelig |
| **GIS** | GeoPandas + PostGIS | Gratis | Kjent, effektiv |
| **CRM** | Airtable | ~$40/mnd | Raskt, fleksibelt |
| **Hosting** | VPS (DigitalOcean) | ~$20/mnd | Kostnadseffektivt |
| **Frontend** | QGIS (MVP) / React | Gratis/$0 | QGIS for analyse, React for produkt |

**Totalt budsjett:**
- Utvikling: ~NOK 300.000 (196 timer)
- Drift: ~$80/mnd (~NOK 850/mnd)
- API-kostnader: Gratis (innenfor grenser)

---

## 📡 Datakilder & API-er

### Kritiske Datakilder (MVP)

| Kilde | Data | Tilgang | Kostnad | Status |
|-------|------|---------|---------|--------|
| **GeoNorge WFS** | Kommuneplaner, reguleringsplaner | Åpen | Gratis | ✅ Klar |
| **SSB PxWebAPI** | Demografi, økonomi | Åpen | Gratis | ✅ Klar |
| **Kartverket Matrikkel** | Eiendomsdata, eiere | Søknad | Gratis | ⏳ 2-4 uker registrering |

### Sekundære Datakilder (Fase 2+)

| Kilde | Data | Tilgang | Kostnad | Status |
|-------|------|---------|---------|--------|
| **Husbanken Monitor** | Boligsosiale indikatorer | Maskinporten | Gratis | ⏳ Kompleks auth |
| **Arealplaner.no** | Detaljerte planer | Fragmentert | Variabel | ⚠️ Krever mapping per kommune |
| **Ambita Infoland** | Grunnbok (kommersiell) | Kontrakt | NOK 15k+/år | 💰 Vurder senere |

### API Begrensninger

**GeoNorge:**
- WFS: 10.000 features per forespørsel
- Krever paginering for store områder
- SOSI format legacy (bruk GML/GeoJSON)

**SSB:**
- JSON-stat format krever parsing
- Kommunenummer endres ved sammenslåinger
- 2-4 ukers etterslep i data

**Kartverket:**
- Maskinporten påkrevd for produksjon
- SOAP protokoll (eldre) + REST (ny)
- GDPR: Krever rettslig grunnlag for persondata

**Arealplaner.no:**
- ❌ Ingen enhetlig API
- 356 forskjellige systemer
- Start med Geonorge WFS (vedtatte planer)

---

## 🔄 Arbeidsflyt (Steg-for-Steg)

### Fase 1: Datainnsamling (Automatisert)

```
Daglig kl 02:00 (Airflow DAG)
│
├─ 1.1 Hent kommuneplaner (bolig arealformål)
│   └─ Kilde: GeoNorge WFS
│   └─ Output: Polygoner
│
├─ 1.2 Hent reguleringsplaner (vedtatte)
│   └─ Kilde: GeoNorge WFS
│   └─ Output: Polygoner
│
├─ 1.3 Beregn differanse
│   └─ PostGIS: kommuneplan - reguleringsplan
│   └─ Output: Potensielle tomter
│
└─ 1.4 Berik med SSB-data
    └─ Demografi, økonomi, befolkningsframskrivninger
    └─ Output: Scoredatasett
```

**Kode-eksempel:**
```sql
-- PostGIS spatial join
SELECT 
    kp.geom,
    kp.areal,
    ST_Area(kp.geom) / 1000 as area_daa,
    ST_Area(kp.geom) / 400 as est_boliger
FROM kommuneplan_bolig kp
LEFT JOIN reguleringsplaner rp 
    ON ST_Intersects(kp.geom, rp.geom)
WHERE rp.id IS NULL 
   OR ST_Area(ST_Intersection(kp.geom, rp.geom)) / ST_Area(kp.geom) < 0.9;
```

### Fase 2: Scoring & Prioritering

**Scoremodell (0-100 poeng):**

| Variabel | Vekt | Beregningsmetode |
|----------|------|------------------|
| Størrelse | 15% | Areal (daa), normalisert |
| Kapasitet | 20% | Antall boliger (areal/400m²) |
| Sentralitet | 15% | Avstand til kollektiv (SSB) |
| Infrastruktur | 10% | Vei/VA-nærhet (Kartverket) |
| Konfliktfrihet | 20% | Fravær av verneområder |
| Kommunal vilje | 10% | Politisk forankring (Fase 1-data) |
| Eierstruktur | 10% | Antall eiere (få = enklere) |

**Python implementasjon:**
```python
def calculate_score(lot):
    score = (
        normalize(lot.area_daa) * 0.15 +
        normalize(lot.estimated_units) * 0.20 +
        normalize(lot.centrality_score) * 0.15 +
        lot.infrastructure_score * 0.10 +
        lot.conflict_free_score * 0.20 +
        lot.political_willingness * 0.10 +
        lot.owner_structure_score * 0.10
    )
    return min(100, max(0, score * 100))
```

### Fase 3: Eieridentifisering

```
For hver kvalifisert tomt (score >60):
│
├─ 3.1 Spatial join: Polygon → Matrikkelenheter
│   └─ Kilde: Kartverket Matrikkel API
│   └─ Output: Liste av gnr/bnr
│
├─ 3.2 Oppslag: gnr/bnr → Eiere
│   └─ Kilde: Kartverket eller Ambita
│   └─ Output: Navn, adresse
│
└─ 3.3 Berik kontaktinfo
    └─ Kilder: 1881.no, Proff.no, manuell research
    └─ Output: Telefon, e-post
```

### Fase 4: Outreach

**Grunneierbrev (sekvens):**

| Dag | Aktivitet | Kanal |
|-----|-----------|-------|
| 0 | Send grunneierbrev | Post/e-post |
| 3 | Oppfølging | E-post |
| 14 | Telefonoppfølging | Telefon |
| 30 | Andre brev | Post |

**CRM-tracking (Airtable):**
- Eiendom ID
- Eier navn
- Kontakt dato
- Respons status
- Neste handling

### Fase 5: Forhandling

**Mål:** LOI (Letter of Intent) eller opsjon

**Typiske vilkår:**
- Eksklusiv forhandlingsperiode: 6-12 måneder
- Opsjon til kjøp ved godkjent regulering
- Prisramme: markedsbasert
- TBS tar reguleringsrisiko

---

## 📅 Implementeringsplan

### Uke 1-2: Infrastruktur

**Mål:** Grunnleggende system oppe

| Oppgave | Estimert | Ansvarlig |
|---------|----------|-----------|
| Sette opp PostGIS | 8t | Utvikler |
| FastAPI scaffold | 8t | Utvikler |
| Docker Compose config | 4t | Utvikler |
| Basis CI/CD | 4t | Utvikler |

**Leveranse:** Kjørende utviklingsmiljø

### Uke 3-4: ETL + Scoring

**Mål:** Data pipeline fungerer

| Oppgave | Estimert | Ansvarlig |
|---------|----------|-----------|
| Airflow setup | 8t | Utvikler |
| Geonorge WFS-integrasjon | 16t | Utvikler |
| PostGIS spatial queries | 16t | Utvikler |
| Scoring engine | 16t | Utvikler |

**Leveranse:** Automatisk dataflyt, scoredatasett

### Uke 5-6: SSB + Kartverket

**Mål:** Data beriket, eiere identifiserbare

| Oppgave | Estimert | Ansvarlig |
|---------|----------|-----------|
| SSB PxWebAPI integrasjon | 16t | Utvikler |
| Kartverket API registrering | 4t | Jakob/Henrik |
| Matrikkel-integrasjon | 24t | Utvikler |
| Eier-oppslag | 16t | Utvikler |

**Leveranse:** Komplette datasett med eiere

### Uke 7-8: CRM + Outreach

**Mål:** System klar for bruk

| Oppgave | Estimert | Ansvarlig |
|---------|----------|-----------|
| Airtable setup | 8t | Jakob |
| CRM-integrasjon | 16t | Utvikler |
| Brev-generator | 16t | Utvikler |
| QGIS visualisering | 16t | Utvikler |
| Testing | 16t | Alle |

**Leveranse:** Produksjonsklart system

### Uke 9-12: Pilot

**Mål:** Validere system med 3 fokuskommuner

| Aktivitet | Mål |
|-----------|-----|
| Kjør analyse | Nordre Follo, Ås, Nesodden |
| Identifiser tomt | Top 20 per kommune |
| Kontakt eiere | 30+ eiere |
| Følg opp | Møter, dialoger |
| Dokumenter | Læringer, forbedringer |

---

## 💰 Økonomi

### Investering (Engangs)

| Post | Kostnad |
|------|---------|
| Utvikling (196t × NOK 1.500) | NOK 294.000 |
| **TOTALT** | **~NOK 300.000** |

### Drift (Månedlig)

| Post | Kostnad |
|------|---------|
| VPS (DigitalOcean) | ~NOK 200 |
| Airtable (2 brukere) | ~NOK 400 |
| Domene + SSL | ~NOK 100 |
| Backup | ~NOK 100 |
| **TOTALT** | **~NOK 800/mnd** |

### API-kostnader (Bruksbasert)

| API | Forventet kostnad |
|-----|-------------------|
| Kartverket | Gratis (innenfor grenser) |
| SSB | Gratis |
| GeoNorge | Gratis |
| Ambita (hvis aktuelt) | NOK 15.000+/år |

**Break-even:** Ved 500 oppslag/mnd vs manuell prosess

---

## ✅ Suksesskriterier

### Tekniske KPI-er

| Indikator | Mål | Måling |
|-----------|-----|--------|
| Datakvalitet | >95% nøyaktighet | Manuell sampling |
| System oppetid | >99% | Overvåking |
| Oppdateringsfrekvens | Daglig | Airflow logger |
| API-responstid | <2 sek | Metrikk |

### Forretnings KPI-er (6 måneder)

| Indikator | Mål |
|-----------|-----|
| Polygoner analysert | 5.000+ |
| Kvalifiserte tomter (score >60) | 1.000+ |
| Grunneiere kontaktet | 300+ |
| Aktive dialoger | 50+ |
| LOI/Opsjoner signert | 10+ |
| Estimert boligkapasitet | 5.000+ |

---

## ⚠️ Risiko & Mitigering

| Risiko | Sannsynlighet | Impact | Mitigering |
|--------|---------------|--------|------------|
| Kartverket API forsinkelse | Middels | Høy | Søke tidlig, ha backup-plan |
| GDPR-komplikasjoner | Lav | Høy | Juridisk gjennomgang, konsulent |
| Kommune-data ufullstendig | Høy | Middels | Start med Geonorge, suppler manuelt |
| Teknisk kompleksitet | Middels | Middels | Fasevis implementering, MVP-fokus |
| Konkurranse fra andre utviklere | Middels | Høy | Hastighet, eksklusive avtaler |

---

## 🚀 Neste Steg

### Umiddelbart (Denne uken)

1. [ ] **Godkjenn planen** - Jakob & Henrik
2. [ ] **Start Kartverket registrering** - Søke om API-tilgang
3. [ ] **Sette opp utviklingsmiljø** - VPS, PostGIS, Docker
4. [ ] **Engasjere utvikler** - Intern eller ekstern

### Kort sikt (Neste måned)

1. [ ] Uke 1-2: Infrastruktur på plass
2. [ ] Uke 3-4: ETL pipeline kjører
3. [ ] Uke 5-6: Data beriket
4. [ ] Uke 7-8: System produksjonsklart

### Mellomlang sikt (3-6 måneder)

1. [ ] Pilot med 3 fokuskommuner
2. [ ] 10+ LOI/opsjoner signert
3. [ ] Skalere til 20+ kommuner
4. [ ] Vurdere Ambita-integrasjon

---

## 📞 Kontakt & Ansvar

| Rolle | Ansvarlig | Kontakt |
|-------|-----------|---------|
| Prosjekteier | Jakob Bakken | - |
| Forretningsutvikling | Henrik | - |
| Teknisk arkitekt | [Utvikler] | - |
| Data-analyse | [Analyst] | - |

---

## 📎 Vedlegg

1. `workflow-spec.md` - Detaljert arbeidsflyt
2. `tech-stack-recommendation.md` - Teknisk spesifikasjon
3. `references/api-docs/` - API-dokumentasjon (7 kilder)
4. `RESEARCH_SPRINT.md` - Forskningslogg

---

**Dokumentversjon:** 1.0  
**Sist oppdatert:** 28. Januar 2026  
**Status:** Klar for godkjenning og implementering

---

*Denne planen er basert på omfattende research av 7 norske datakilder, inkludert Kartverket, SSB, GeoNorge, Husbanken, Ambita, og Arealplaner.no.*
