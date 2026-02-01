**Norske datakilder for kommunekartlegging og boliganalyse**  
**Norge har et rikt økosystem av offentlige og kommersielle datakilder** som gjør det mulig å systematisk  
kartlegge kommuner for sosial boligutvikling. Den viktigste innsikten er at **ingen sentral database aggregerer**  
**boligsosiale handlingsplaner** – disse må hentes fra hver enkelt av landets 357 kommuner. Derimot finnes  
utmerkede kilder for røde flagg-indikatorer via SSBs API-er, og tomtedata gjennom Kartverkets gratistjenester.  
For en aktør som Tredje Boligsektor AS er kombinasjonen av **Husbankens Boligsosial Monitor**, **SSBs**  
**KOSTRA-data** og **Arealplaner.no** et sterkt utgangspunkt for systematisk kommunescreening.  
**Del 1: Signaler i boligsosiale handlingsplaner**  
Boligsosiale handlingsplaner publiseres primært på kommunenes egne nettsider, typisk under faner som «Planer  
og strategier» eller «Samfunnsutvikling». Det finnes ingen nasjonal database som samler disse, men flere kilder  
gir delvis tilgang.  
**Husbankens ressurser – den viktigste offentlige aktøren**  
**Boligsosial Monitor** (boligsosial-monitor.husbanken.no) er den mest verdifulle enkeltstående kilden for å  
vurdere kommuners boligsosiale situasjon. Den dekker alle **357 kommuner** med indikatorer for boligsosiale  
utfordringer, selv om den ikke inneholder selve plandokumentene. Dataene kan lastes ned og brukes til  
screening av kommuner med størst behov. Tilgangen er gratis og krever ingen avtale.  
**Husbankens bibliotek** (biblioteket.husbanken.no) fungerer som et arkiv med eldre boligsosiale  
handlingsplaner, nyttig for historiske analyser og sammenligning over tid. Husbanken tilbyr også veiledning på  
husbanken.no/boligsosialt-arbeid om strategier, metoder og virkemidler.

| Kilde  | URL  | API  | Kostnad  | Relevans |
| :---- | :---- | :---- | :---- | :---- |
| Boligsosial Monitor  | boligsosial-monitor.husbanken.no  | Nei (nedlastbar)  | Gratis  | ⭐⭐⭐⭐⭐ |
| Husbanken bibliotek  | biblioteket.husbanken.no  | Nei  | Gratis  | ⭐⭐⭐⭐ |
| Husbanken rapporter  | husbanken.no/rapporter  | Nei  | Gratis  | ⭐⭐⭐⭐ |
| Kobo (kommunale utleieboliger)  | husbanken.no/kobo  | Nei  | Gratis  | ⭐⭐⭐ |

**Planregistre og kommunale dokumenter**  
Fra **1\. juli 2025** er digitalt planregister påbudt i alle kommuner. **Arealplaner.no** og **Kommunekart.com**  
(Norkart) gir tilgang til kommunale planregistre, men det er viktig å merke seg at boligsosiale handlingsplaner  
er *temaplaner*, ikke arealplaner – de finnes derfor ofte i kommunens dokumentarkiv heller enn i planregisteret.**FIKS Plan** fra KS (developers.fiks.ks.no) er under utvikling og vil støtte meldinger for oppdatering og spørring  
av kommunale planregistre. Dette representerer fremtidens infrastruktur for programmatisk tilgang til  
plandokumenter, men krever avtale med KS og at kommunen har aktivert tjenesten.  
**API-er for plandokumenter og offentlige data**  
**GeoNorge** (geonorge.no) tilbyr flere åpne API-er for geodata, inkludert NedlastingsAPI for kartdata og  
metadata-API for datasett. Relevansen for boligsosiale planer er begrenset, men nyttig for arealplaner og  
kartdata.  
**Felles datakatalog** (data.norge.no) er den nasjonale portalen for offentlige datasett og API-er. Den katalogiserer  
tilgjengelige data, men inneholder ikke spesifikt boligsosiale plandokumenter.

| Kilde  | URL  | API  | Kostnad  | Hovedbruk |
| :---- | :---- | :---- | :---- | :---- |
| GeoNorge  | geonorge.no  | Ja (REST)  | Gratis  | Geodata, kartkatalogen |
| Felles datakatalog  | data.norge.no  | Ja  | Gratis  | Datasett-katalog |
| FIKS Plan  | developers.fiks.ks.no  | Ja (avtale)  | Kommuner  | Planregistre |
| Kommunekart  | kommunekart.com  | Begrenset  | Gratis  | Arealplaner, bestemmelser |

**Verktøy for tekstanalyse av kommunale planer**  
For systematisk analyse av plantekster finnes flere norske språkressurser. **Oslo-Bergen-taggeren** fra  
Tekstlaboratoriet ved UiO gir grammatisk analyse for norsk tekst. **Nasjonalbiblioteket DH-lab** tilbyr  
korpusverktøy for analyse av offentlige dokumenter. For mer avansert analyse støtter **Azure AI Language**  
norsk tekst med oppsummering og entitetsuttrekking (betalt abonnement).  
**BOSAM** fra Sosial Fagkompetanse AS (sosialtjenesten.no/bosam) er et fagsystem for operativ oppfølging av  
boligsosiale handlingsplaner i kommuner, relevant dersom man ønsker dialog med kommuner om deres arbeid.  
**Del 2: Røde flagg – varselsindikatorer for kommunevalg**  
Norge har et eksepsjonelt godt datagrunnlag for å vurdere kommuners egnethet for boligutvikling. SSBs åpne  
API-er gir tilgang til det meste av relevante data.  
**Kommuneøkonomi – KOSTRA, ROBEK og barometere**  
**KOSTRA-data fra SSB** (ssb.no/statbank/list/kostrahoved) er grunnsteinen for kommuneøkonomisk analyse.  
Her finnes netto driftsresultat, gjeldsnivå, driftsinntekter og \-utgifter per tjenesteområde, med tidsserier tilbake  
mange år. SSBs **PxWebApi v2** gir gratis programmatisk tilgang til alle data i JSON-stat eller CSV-format.**ROBEK-listen** (regjeringen.no/no/tema/kommuner-og-regioner/kommuneokonomi/robek-2/) viser kommuner  
under statlig økonomisk kontroll – per januar 2026 er **28 kommuner** på listen. KLP har varslet at opptil 100  
kommuner kan havne på ROBEK innen 2027\. ROBEK-status betyr restriksjon på låneopptak og forsinkede  
byggeprosjekter. Listen er tilgjengelig som Excel-nedlasting.  
**Kommunebarometeret** (kb.kommunal-rapport.no) rangerer alle 357 kommuner basert på 157 nøkkeltall fra 12  
sektorer. Tilgang krever abonnement på Kommunal Rapport, men gir verdifull benchmarking mellom like  
kommuner.  
**Kilde URL API Kostnad Nøkkelindikatorer**  
KOSTRA (SSB) ssb.no/statbank/list/kostrahoved Ja (gratis) Gratis Driftsresultat, gjeld, inntekter  
ROBEK-listen regjeringen.no Nei (Excel) Gratis Statlig kontroll-status  
Kommunebarometeret kb.kommunal-rapport.no Nei Abonnement Samlet rangering  
Kommuneindeksen Via Storebrand/Agenda Kaupang Nei (PDF) Gratis Kostnadseffektivitet  
**Røde flagg-terskler for økonomi**: Netto driftsresultat under **1,75%** indikerer svak økonomi. Negativt  
driftsresultat over flere år \= høy ROBEK-risiko. Gjeldsvekst over **10% årlig** krever oppmerksomhet.  
**Saksbehandlingstid og innsigelseshistorikk**  
SSB publiserer detaljert statistikk på plan- og byggesaksbehandling (ssb.no/natur-og-miljo/areal/statistikk/plan-  
og-byggesaksbehandling). Landsgjennomsnittlig behandlingstid for reguleringsplaner er **865 kalenderdager** fra  
oppstartsmøte til vedtak ssb  
– kommuner med over 1000 dager representerer betydelig forsinkelsesrisiko.  
**Innsigelsesstatistikk** viser at **39% av reguleringsplaner** møtes med innsigelse (2024-tall). Tabell 12690 i  
Statistikkbanken gir antall innsigelser per kommune og begrunnelsestype (jordvern, miljø, kulturminner).  
Regjeringen publiserer alle avgjørelser i innsigelsessaker på regjeringen.no/no/tema/plan-bygg-og-  
eiendom/plan\_bygningsloven/planlegging/innsigelsessaker.  
**Tabell URL Innhold**  
12690 ssb.no/statbank/table/12690 Innsigelser per kommune  
13008 ssb.no/statbank/table/13008 Miljørettede innsigelser  
13016 ssb.no/statbank/table/13016 Saksbehandlingstid regulering  
12671 ssb.no/statbank/table/12671 Byggesaksbehandlingstid**Befolkningsutvikling og demografi**  
SSBs **regionale befolkningsframskrivinger** (ssb.no/befolkning/befolkningsframskrivinger) dekker alle 357  
kommuner med prognoser til 2050 i tre alternativer. **226 av 357 kommuner** forventes å vokse. Dataene  
inkluderer alderssammensetning, forsørgerbyrde og fødselsoverskudd vs. nettoinnvandring. Et interaktivt  
kartsøk er tilgjengelig.  
**Røde flagg-terskler for demografi**: Negativ befolkningsutvikling til 2050 \= fallende boligetterspørsel.  
Forsørgerbyrde eldre over **50%** \= press på kommuneøkonomi.  
**Boligmarkedsdata – sykepleierindeks og prisstatistikk**  
**Sykepleierindeksen** (eiendomnorge.no/aktuelt/blogg/sykepleierindeksen-2022) måler andelen boliger en singel  
sykepleier kan kjøpe, og dekker 98 kommuner/bydeler. I 2025 er landsgjennomsnittet **30,1%**, mens Oslo ligger  
på kun **2,9%**. Indeksen publiseres årlig og er gratis tilgjengelig.  
**Eiendom Norge Boligprisstatistikk** (eiendomnorge.no/boligprisstatistikk/) gir månedlige prisindekser per  
region, med statistikkbank og Excel-nedlasting. Full API-tilgang krever betalt abonnement. SSBs **prisindeks**  
**for brukte boliger** gir gratis kvartalsvis data med historiske serier fra 1991\.  
Statistisk sentralbyrå  
**Kilde URL API Kostnad Dekning**  
Sykepleierindeksen eiendomnorge.no Nei Gratis 98 kommuner  
Eiendom Norge eiendomnorge.no/boligprisstatistikk Ja Abonnement Regioner  
SSB Boligprisindeks ssb.no Ja (gratis) Gratis Landsdekkende  
Prognosesenteret prognosesenteret.no Ja Abonnement Alle kommuner  
**Del 3: Tomtemuligheter og tilgjengelig areal**  
Kartlegging av tilgjengelige arealer for boligbygging hviler på tre hovedkilder: Kartverkets matrikkel,  
kommunale planregistre, og SSBs arealstatistikk.  
**Eiendomsdata og matrikkel – Kartverket som grunnmur**  
**Kartverkets Matrikkel** (kartverket.no/eiendom) er autoritativ kilde for eiendomsgrenser, areal, bygninger,  
eierforhold og grunnboksdata. Kartverket  
Fra 1\. januar 2021 er dataene **gratis** for virksomheter som søker  
tilgang. API-et er SOAP-basert, og tilgang krever at virksomheten dokumenterer «berettiget interesse».  
**Seeiendom.no** (eiendomsregisteret.kartverket.no) er publikumsløsningen for enkeltoppslag og uten innlogging for grunnleggende data som grenser, areal og hjemmelshavers navn.  
Kartverket  
– gratis**GeoNorge** (geonorge.no) samler åpne geodatasett inkludert eiendomskart, bygningspunkt, adresser og  
arealbruk. NedlastingsAPI-et (nedlasting.geonorge.no/Help) og Adresse-API-et (ws.geonorge.no/adresser/v1/)  
er gratis og åpne.  
**Kilde URL API Kostnad Tilgangskrav**  
Kartverket Matrikkel kartverket.no/eiendom Ja (SOAP) Gratis Søknad  
Seeiendom/Eiendomsregisteret eiendomsregisteret.kartverket.no Nei Gratis Ingen  
GeoNorge datasett geonorge.no Ja (REST) Gratis Ingen  
**Reguleringsplaner og planreserver**  
**Arealplaner.no** er den sentrale kilden for digitale plankart, reguleringsplaner og kommuneplanens arealdel.  
Tjenesten dekker alle kommuner og gir tilgang via Norge digitalt arealplankartløsning (NAP). Dette er **den**  
**kritiske kilden** for å finne regulerte boligområder, utnyttelsesgrad og planstatus.  
**SSBs arealbruksstatistikk** (ssb.no/statbank/list/arealstat) er **eneste nasjonale kilde** for kvantifisering av  
boligreserver. Her finnes beregnet arealreserve til boligbebyggelse per kommune, nåværende arealbruk og  
vedtatte arealformål.  
En fersk regjeringsrapport (2025) viser at byregioner med høyt boligpress har **158.100 boenheter** i kortsiktig  
reserve (ferdigregulert) og totalt **575.000 boenheter** i samlet planreserve. Eksempler på kommunale oversikter:  
**Oslo**: 13.162 boliger i boligreserve \+ 38.566 i områdereserve (sept. 2025\)  
**Kristiansand**: Ca. 19.500 boliger i planreserve  
**Drammen**: Ca. 15.000 boliger total planreserve  
**Offentlig eid grunn**  
**Statsbygg** (statsbygg.no/prosjekter-og-eiendommer) forvalter over 2.000 bygninger/eiendommer og selger  
overflødige statlige eiendommer – i 2021 ble eiendommer for over 2 milliarder kroner solgt. Ingen offentlig  
database, men direkte kontakt kan avdekke muligheter.  
**Statskog** (statskog.no/eiendom) forvalter 1/5 av Fastlands-Norge (59 millioner dekar), primært skog og utmark,  
men med noen arealer egnet for utvikling. Ca. 37.000 festekontrakter er registrert.  
**Kommunale tomteoversikter** varierer i tilgjengelighet. Oslo kommune publiserer oversikt på  
oslo.kommune.no/plan-bygg-og-eiendom/kart-og-eiendomsinformasjon/kommunal-eiendom. Dette er den mest  
direkte veien til offentlig eid grunn tilgjengelig for sosial boligbygging.**Kommersielle tjenester og forskningsinstitusjoner**  
**Viktigste kommersielle aktører**  
**Prognosesenteret** (prognosesenteret.no) er **særlig relevant** for Tredje Boligsektor AS med sin  
Kommunemonitor og kommunerapporter. De tilbyr demografiske og boligrelaterte data for alle kommuner,  
flyttestrømanalyser basert på 7+ millioner flyttinger, Prognosesenteret  
og omsetningsdata via API.  
Abonnementspriser på forespørsel.  
**Ambita/Infoland** (ambita.com / infoland.ambita.com) er markedsleder på profesjonell eiendomsinformasjon  
med tilgang til grunnbok, matrikkel, tinglysningstjenester, meglerpakker og digital planvarsling (Propfinder).  
Omfattende REST-API-er tilgjengelig, og gratis API-tilgang tilbys til startups for testing.  
**Byggfakta** (byggfakta.no) driver Nordens største prosjektdatabase med over 20.000 aktive prosjekter, fra idé til  
ferdigstillelse. Nyttig for å identifisere konkurrerende prosjekter og markedsmuligheter. Skreddersydd  
abonnementspris.  
**Eiendomsverdi AS** (home.eiendomsverdi.no) tilbyr automatiserte verdivurderinger for alle eiendommer i  
Norge, sanntidsbilde av boligpriser, og produserer Sykepleierindeksen. Abonnementsbasert for profesjonelle.

| Tjeneste  | URL  | API  | Prismodell  | Hovedbruk |
| :---- | :---- | :---- | :---- | :---- |
| Prognosesenteret  | prognosesenteret.no  | Ja  | Abonnement  | Kommuneanalyse |
| Ambita/Infoland  | ambita.com  | Ja  | Per transaksjon  | Eiendomsdata |
| Byggfakta  | byggfakta.no  | Integrert  | Abonnement  | Prosjektovervåking |
| Eiendomsverdi  | home.eiendomsverdi.no  | Ja  | Abonnement  | Verdivurdering |
| Norkart  | norkart.no  | Ja  | Betalt  | Eiendom/tinglysing |

**Forskningsinstitusjoner med boligfokus**  
**NIBR ved OsloMet** (oslomet.no/om/nibr) er en hovedleverandør av boligforskning i Norge, med forskning på  
boligpolitikk, boforhold og boligpreferanser. De utfører kommuneoppdrag og publiserer i Tidsskrift for  
boligforskning. Rapporter er ofte gratis via Open Digital Archive.  
**BOVEL – Senter for bolig- og velferdsforskning** (uni.oslomet.no/bovel) fokuserer spesifikt på  
lavinntektsgrupper, kommunal boligsektor og effekter av offentlig boligpolitikk – **direkte relevant** for tredje  
boligsektor-perspektivet. Partnere inkluderer Frischsenteret, ISF, Fafo og flere.  
OsloMet BOVEL  
**Housing Lab ved OsloMet** (housinglab.oslomet.no) publiserer **Bubble Index** (måler over-/undervurdering av  
boligpriser), Bidding War Index og Norwegian Housing Market Watch. Finansiert av bl.a. Finansdepartementet,  
Selvaag og OBOS. Indekser og rapporter er gratis tilgjengelige.**Bransjeorganisasjoner**  
**NBBL – Norske Boligbyggelag** (nbbl.no) er **direkte relevant** for kooperativ/tredje boligsektor med kvartalsvis  
boligprisstatistikk for borettslag, byggestatistikk og Boligmarkedsbarometeret. 36 boligbyggelag representerer  
1,33 millioner medlemmer og 650.000 boliger.  
Nbbl  
**Boligprodusentenes Forening** (boligprodusentene.no) publiserer månedlig statistikk over salg og igangsetting  
av nye boliger, produsert av Prognosesenteret. Ca. 800 medlemsbedrifter står for over 50% av boligbyggingen.  
LinkedIn  
**Eiendom Norge** (eiendomnorge.no) er den autoritative kilden for boligprisstatistikk med månedlige data  
publisert 3 dager etter månedslutt. Samarbeid med Eiendomsverdi AS og FINN.no. Eiendom Norge  
API krever  
abonnement.  
**Konklusjon og anbefalinger**  
For systematisk kommunekartlegging anbefales en tretrinnstilnærming:  
**Første screening** bør bruke gratiskilder for å filtrere kommuner. Kombiner **Boligsosial Monitor** for  
behovsindikatorer, **SSB befolkningsframskrivinger** for demografisk utvikling, **KOSTRA-data** for økonomisk  
helse, og **SSB innsigelsesstatistikk** for reguleringsrisiko. Alle disse har gratis API-tilgang.  
**Detaljanalyse** av shortlistede kommuner krever manuell innhenting av boligsosiale handlingsplaner fra  
kommunale nettsider, analyse av planreserver via **Arealplaner.no**, og vurdering av konkrete tomtemuligheter  
gjennom **Kartverkets matrikkel** og kommunale tomteoversikter.  
**Kommersielle supplement** fra **Prognosesenteret** (Kommunemonitor) og **Ambita** (eiendomsdata) kan  
effektivisere prosessen betydelig for aktører med budsjett, mens **NIBR/BOVEL-forskning** gir strategisk innsikt  
i boligsosiale virkemidler.  
Den største utfordringen forblir fraværet av en nasjonal database for boligsosiale handlingsplaner. En sosial  
boligaktør bør vurdere å bygge et internt arkiv gjennom systematisk innhenting fra kommunenes nettsider,  
eventuelt kombinert med tekstanalyse for å identifisere kommuner som prioriterer rimelige boliger, t  
