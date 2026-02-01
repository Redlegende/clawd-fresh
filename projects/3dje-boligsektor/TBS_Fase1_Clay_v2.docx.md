**TREDJE BOLIGSEKTOR AS**

**Fase 1: Kommuneanalyse i Clay**

*Oppdatert versjon 2.0 – Januar 2026*

| Status | Klar for implementering |
| :---- | :---- |
| **Fokuskommuner** | Nesodden, **Nordre Follo**, Trondheim |
| **Eksisterende planer** | 126 kommuner |

# **Oversikt**

Dette dokumentet beskriver et pilotsystem for kommuneanalyse for TB AS. Systemet er designet for å kunne anvendes umiddelbart uten behov for API-integrasjoner eller programmeringsarbeid (fase 2).

**Systemet bruker:**

* Clay-native funksjoner (ingen eksterne API-integrasjoner \- forbeholdt fase 2\)  
* Claygent (AI web scraper) for å finne relevant data, planer og kontaktpersoner  
* Bruker AI med "Provide document context for task" for dokumentanalyse

*SSB-API, Kartverket-API, Byggfakta og andre programmatiske integrasjoner avventes til fase 2\.*

# **1\. Utgangspunkt**

## **Hva vi har**

* **126 boligpolitiske/boligsosiale planer** allerede lastet ned  
* Tre fokuskommuner: Nesodden, **Nordre Follo (hovedfokus)**, Trondheim

## **Hva fase 1 leverer**

1. Analyse av eksisterende plandokumenter  
2. Automatisk søk etter nye og oppdaterte planer  
3. Innhenting av andre relevante dokumenter (arealplaner, politiske vedtak, media)  
4. Kontaktinformasjon til relevante personer  
5. Prioritert liste med vurdering  
6. **Grunnlag for fase 2** (API-integrasjoner, GIS-analyse)

# **2\. Dokumenttyper å søke etter**

## **Kategori A: Planverk (strategisk)**

| Dokumenttype | Søkeord | Relevans |
| :---- | :---- | :---- |
| Boligsosial handlingsplan | boligsosial, boligsosialt | Direkte |
| Boligpolitisk plan | boligpolitisk, boligstrategi | Direkte |
| Kommuneplanens samfunnsdel | samfunnsdel \+ bolig | Høy |
| Kommuneplanens arealdel | arealdel, arealplan | Høy (fase 2\) |
| Planstrategi | planstrategi | Middels |

## **Kategori B: Politiske vedtak**

| Dokumenttype | Søkeord | Relevans |
| :---- | :---- | :---- |
| Kommunestyrevedtak | kommunestyret \+ bolig | Høy |
| Formannskapsvedtak | formannskapet \+ bolig | Høy |
| Høringsuttalelser | høring \+ bolig | Middels |

## **Kategori C: Lover, regler, veiledere**

| Dokumenttype | Søkeord | Relevans |
| :---- | :---- | :---- |
| Kommunale retningslinjer | retningslinjer \+ bolig | Høy |
| Utbyggingsavtaler (mal) | utbyggingsavtale | Høy |
| Husbankens veiledere | husbanken.no \+ kommune | Direkte |

## **Kategori D: Media og offentlig debatt**

| Dokumenttype | Søkeord | Relevans |
| :---- | :---- | :---- |
| Lokalavis | kommune \+ boligbygging | Middels |
| Politiske utspill | ordfører \+ bolig | Middels |
| Høringsinnspill | høringsinnspill \+ OBOS | Middels |

# **3\. Clay-tabellstruktur**

## **Oversikt over tabeller**

| Tabell | Navn | Formål |
| :---- | :---- | :---- |
| 1 | kommuner | Hovedtabell med grunndata |
| 2 | dokumentsøk | Claygent web research |
| 3 | plandokumenter | Analyse av planinnhold |
| 4 | vurdering | Syntese og prioritering |

## **Tabell 1: kommuner**

| \# | Kolonne | Type | Kilde | Beskrivelse |
| :---- | :---- | :---- | :---- | :---- |
| 1 | kommune\_navn | Tekst | Manuell | Primærnøkkel |
| 2 | kommune\_nr | Tekst | Manuell | 4-sifret nummer |
| 3 | fylke | Tekst | Manuell | Fylkestilhørighet |
| 4 | nettside\_url | URL | Manuell | Hovedside |
| 5 | fokus\_prioritet | 1-3 | Manuell | 1=Høy |
| 6 | har\_eksisterende\_plan | Ja/Nei | Manuell | Har vi plan? |

## **Tabell 2: dokumentsøk (Claygent)**

| \# | Kolonne | Type | Innhold |
| :---- | :---- | :---- | :---- |
| 1 | nyeste\_boligsosial\_plan | Claygent JSON | Ny/oppdatert plan |
| 2 | kommuneplan\_samfunnsdel | Claygent JSON | Boligkapitler |
| 3 | kommuneplan\_arealdel | Claygent JSON | Arealdel lenke |
| 4 | politiske\_vedtak\_bolig | Claygent JSON | Nylige vedtak |
| 5 | medieomtale | Claygent JSON | Lokalavis |
| 6 | husbanken\_samarbeid | Claygent JSON | Husbanken-info |
| 7 | tomteoversikt | Claygent JSON | Planreserve |
| 8 | kontaktpersoner | Claygent JSON | Plan/bolig-avd. |

# **4\. Implementering steg for steg**

## **Dag 1: Grunnstruktur**

7. Opprett Clay workspace: "TBS Kommuneanalyse"  
8. Opprett Tabell 1 (kommuner): Legg inn de 3 fokuskommunene  
9. Test: Verifiser at tabellen fungerer

## **Dag 2-3: Dokumentsøk**

10. Opprett Tabell 2 (dokumentsok): Koble til Tabell 1  
11. Konfigurer Claygent-kolonner: Start med nyeste\_boligsosial\_plan  
12. Test på Nordre Follo: Kjør og verifiser output  
13. Juster prompts basert på resultater

## **Dag 4-5: Plananalyse**

14. Opprett Tabell 3 (plandokumenter)  
15. Legg inn eksisterende planer for 3 fokuskommuner  
16. Kopier plantekst fra PDF til plan\_tekst-kolonnen (har link)  
17. Konfigurer Use AI-kolonner med "Provide document context for task"

## **Dag 6-7: Vurdering og syntese**

18. Opprett Tabell 4 (vurdering): Koble til alle tabeller  
19. Konfigurer syntese-kolonner  
20. Kjør full analyse for alle 3 fokuskommuner  
21. Kvalitetssikring og dokumenter læring

# **5\. Forberedelse til Fase 2**

## **Dataflyt Fase 1 → Fase 2**

| Fase 1 output | Fase 2 bruk |
| :---- | :---- |
| kommuneplan\_arealdel URL | Input til GIS-analyse |
| tomteoversikt | Verifisering av planreserve |
| kontaktpersoner | Outreach etter tomteidentifikasjon |
| fase2\_datapunkter | Prioritering av API-kall |
| relevans\_score | Prioritering av kommuner i GIS |

## **API-integrasjoner planlagt (fase 2\)**

| API | Kostnad | Innhold | Prioritet |
| :---- | :---- | :---- | :---- |
| SSB PxWebAPI | Gratis | Demografi, økonomi, bolig | Høy |
| Kartverket Matrikkel | Gratis | Eiendomsdata, eiere | Høy |
| GeoNorge WFS | Gratis | Plandata, geodata | Høy |
| Husbanken Monitor | Gratis | Boligsosiale indikatorer | Middels |
| Ambita/Infoland | Betalt | Grunnbok, detaljer | Middels |
| Prognosesenteret | Betalt | Kommunemonitor | Lav |

# **6\. Kostnadsestimat**

## **Clay-credits for 3 fokuskommuner**

| Operasjon | Credits/kommune | Totalt |
| :---- | :---- | :---- |
| Claygent: 9 søkekolonner | \~15 | 45 |
| Use AI: 8 analysekolonner | \~8 | 24 |
| Use AI: 6 vurderingskolonner | \~6 | 18 |
| **Sum per kommune** | **\~29** | **\~90** |

*Med Clay Starter (2.000 credits/mnd) rekker du godt for piloten og prioriterte kommuner.*

—  
*Se markdown-fil for fullstendige Claygent- og Use AI-prompts*  
*Tredje Boligsektor AS – Januar 2026*