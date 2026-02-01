**TREDJE BOLIGSEKTOR AS**

**Fase 2: Tomte-sourcing og Analyse-motor**

*Systematisk identifikasjon av utviklingstomter i stor skala*

| Versjon | 1.0 |
| :---- | :---- |
| **Dato** | Januar 2026 |
| **Mål** | Pipeline mot 10.000+ boliger |

# **1\. Executive Summary**

Fase 2 utvider kommunekartleggingen fra fase 1 til **systematisk tomte-sourcing** – å finne arealer avsatt til bolig i kommuneplaner som ennå ikke er detaljregulert.

## **Kjernelogikk**

**KOMMUNEPLAN BOLIG  −  VEDTATT REGULERINGSPLAN  \=  UTVIKLINGSMULIGHET**

## **Tre parallelle spor**

| Spor | Formål | Volum |
| :---- | :---- | :---- |
| **A. Datamotor** | GIS-analyse av plandata | Tusenvis av polygoner |
| **B. Meglermotor** | Strukturert meglerkontakt | 30+ meglere |
| **C. Grunneiermotor** | Direkte outreach til eiere | Hundrevis av eposter |
| **D. Kommunemotor** | Direkte outreach til kommuner | Hundrevis av eposter |

## **Kritisk kontekst: Datalandskapet 2026**

Fra 1\. januar 2026 er nasjonale WMS-tjenester avsluttet. Arkitekturen må derfor hente plandata direkte fra kommunenes egne WFS-tjenester.

# **2\. SPOR A: Datamotor (GIS-analyse)**

## **2.1 Datakilder**

| Kilde | Type | Tilgang | Innhold |
| :---- | :---- | :---- | :---- |
| Kommunale WFS | WFS 2.0 | Varierer | Kommuneplan, reguleringsplan |
| Arealplaner.no | WMS/WFS | Gratis | Nasjonal planvisning |
| Kartverket Matrikkel | SOAP API | Søknad | Eiendomsgrenser, eiere |
| GeoNorge | REST API | Gratis | Terreng, støy, flom |
| SSB Sentralitet | Nedlasting | Gratis | 250m×250m tilgjengelighet |

## **2.2 Algoritmisk logikk**

1\. HENT kommuneplan\_polygoner WHERE arealformål \= 'Bolig'2. HENT reguleringsplan\_polygoner WHERE planstatus \= 'Vedtatt'3. BEREGN differanse \= kommuneplan MINUS reguleringsplan4. FOR HVERT polygon: Beregn areal, estimer kapasitet, flagg konflikter5. KOBLE til matrikkelenheter og hjemmelshavere

## **2.3 Scoring-modell (0-100 poeng)**

| Variabel | Vekt | Datakilde | Beskrivelse |
| :---- | :---- | :---- | :---- |
| Størrelse | 15% | GIS | Areal i daa, normalisert |
| Kapasitet | 20% | Estimert | Antall boliger |
| Sentralitet | 15% | SSB | Avstand til kollektiv |
| Infrastruktur | 10% | Kartverket | Vei/VA-nærhet |
| Konfliktfrihet | 20% | GeoNorge | Fravær av hindringer |
| Kommunal vilje | 10% | Fase 1 | Politisk forankring |
| Eierstruktur | 10% | Matrikkel | Få eiere \= enklere |

## **2.4 Prioriterte kommuner**

| Kommune | BA-region | Langsiktig reserve | Prioritet |
| :---- | :---- | :---- | :---- |
| Nordre Follo | Oslo | \~5.000+ | 1 |
| Ås | Oslo | \~3.000 | 1 |
| Nesodden | Oslo | \~2.000 | 1 |
| Drammen | Drammen | \~15.000 | 2 |
| Stavanger | Stavanger | \~11.493 | 2 |
| Trondheim | Trondheim | \~9.800 | 2 |

# **3\. SPOR B: Meglermotor**

## **3.1 Formål**

Bygge systematisk relasjon med tomte- og næringsmeglere som kan tilføre dealflow utenom det TBS finner selv gjennom dataanalyse.

## **3.2 Arbeidsflyt**

1. **Bygg megler-database:** 30+ relevante meglere i Clay  
2. **Skriv investeringsmandat:** 1-2 sider med geografi, størrelse, betingelser  
3. **Første utsendelse:** Personlig e-post til alle  
4. **Kvartalsvis oppfølging:** Automatisert påminnelse via Clay

## **3.3 Investeringsmandat (hovedelementer)**

* Hvem TBS er (kort)  
* Geografi: Prioriterte kommuner  
* Størrelse: Minimum 20 boliger, helst 50-200  
* Boligtyper: Leiligheter, rekkehus  
* Tidslinje: Tomter som kan reguleres innen 2-10 år (som vi kan få regulert på 1-2 år)  
* Betingelser: Åpen for opsjon, JV, eller kjøp

# **4\. SPOR C: Grunneiermotor**

## **4.1 Formål**

Direkte kontakt med grunneiere i områder identifisert av datamotoren. *Her henter de store aktørene mesteparten av volumet.*

## **4.2 Arbeidsflyt**

5. **Koble polygon til matrikkel:** Spatial join → gnr/bnr-liste  
6. **Hent hjemmelshaver:** Kartverket API  
7. **Finn kontaktinfo:** Adresse, telefon  
8. **Send grunneierbrev:** Profesjonelt, personlig, konkret  
9. **Telefonoppfølging:** 14 dager etter brev  
10. **Dialog → LOI → Opsjon:** Strukturert forhandling

## **4.3 Grunneierbrev (prinsipper)**

* Profesjonelt, men **personlig**  
* Referer til konkret eiendom (gnr/bnr)  
* Forklar muligheten (kommuneplan åpner for bolig)  
* Tilby verdi (TBS tar risiko med regulering)  
* Ingen press – inviter til uforpliktende samtale

Lever eksempel-epost som del av fase 1-leveranse

# **5\. CRM/Pipeline-system**

## **5.1 Anbefalt verktøy: Airtable (Monday, ..)**

* Fleksibel datamodell for relasjoner  
* Automatiseringer via Airtable Automations  
* Integrasjon med Clay via HTTP API  
* Kostnad: \~$20-45/bruker/mnd

## **5.2 Pipeline-trakt**

| Stadium | Volum (mål) | Kilde |
| :---- | :---- | :---- |
| Identifisert | \~10.000 polygoner | Datamotor |
| Kvalifisert (score \>60) | \~2.000 polygoner | Scoring |
| Kontaktet | \~500-1000 grunneiere | Outreach |
| Dialog | \~100 grunneiere | Respons |
| LOI/Opsjon | \~30-80 eiendommer | Forhandling |
| **Prosjekt** | **10.000+ boliger** | **MÅL** |

# **6\. Implementeringsplan**

| Fase | Periode | Aktiviteter | Leveranse |
| :---- | :---- | :---- | :---- |
| 2.1 GIS | Mnd 1-2 | PostGIS setup, WFS-kartlegging, differanseanalyse | Scoret polygon-liste |
| 2.2 Megler | Mnd 2-3 | Megler-database, mandat, utsendelse | 30+ megler-relasjoner |
| 2.3 Grunneier | Mnd 3-4 | Matrikkel-kobling, brevkampanje, oppfølging | Dialoger startet |
| 2.4 CRM | Mnd 4-6 | Airtable setup, Clay-integrasjon, skalering | Fungerende pipeline |

# **7\. Ressursbehov**

## **7.1 Kostnader**

| Post | Engangs | Løpende/mnd |
| :---- | :---- | :---- |
| PostGIS/QGIS (open source) | 0 kr | \- |
| Kartverket matrikkel | 0 kr | \- |
| Airtable | 3.000 kr | 500 kr |
| Clay | 12.000 kr | 1.000 kr |
| Brevutsendelse | \- | 500 kr |
| **TOTALT** | **\~15.000 kr** | **\~3.000 kr** |

# **8\. Suksesskriterier (6 måneder)**

| Metrikk | Mål |
| :---- | :---- |
| Polygoner analysert | 5.000+ |
| Polygoner kvalifisert (score \>60) | 1.000+ |
| Grunneiere kontaktet | 300+ |
| Aktive dialoger | 50+ |
| LOI/opsjoner signert | 10+ |
| **Estimert kapasitet i pipeline** | **5.000+ boliger** |

—  
*Dokument utarbeidet for Tredje Boligsektor AS*  
*Januar 2026*