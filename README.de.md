<h1 align="center">CoSI</h1>
<h1 align="center">Cockpit Städtische Infrastrukturen</h1>
<h4 align="center">GIS + Daten basierte Analyse- & Planungstools in der Hamburger Stadtverwaltung</h4>
<br></br>

## Nutzerhandbuch

<h7>2. Phase (Weiterentwicklung)</h2>
<h7>Version 2.0</h2>
<h7>Zur internen Nutzung</h2>

### Autoren
Daniel Schulz, HafenCity Universität Hamburg,
Sebastian Duden, Landesbetrieb für Geoinformation und Vermessung Hamburg
Ogeigha Koroyin, HafenCity Universität Hamburg
Nicola Stradtmann, HafenCity Universität Hamburg
Johanna Fleischer, Hafen City Universität
Yuxiang Zhang, HafenCity Universität Hamburg

### Stand
06/17/2021

### Keywords
GIS, Dashboard, Data Driven Urban Planning, Social Infrastructure, Urban Data Platform, Data Visualization, Planning Support Tools, Demand Driven Decision Making

### Zusammenfassung
Bei der Planung städtischer und sozialer Infrastruktur sind Entscheidungsprozesse in der öffentlichen Verwaltung häufig durch langwierige Verfahren und eine fragmentierte Datengrundlage charakterisiert. D.h. Bedarfe werden zu spät erkannt, oder die Konkretisierung der Planung verzögert sich durch das aufwendige Beschaffen von Informationen. 
<br></br>
Das vorliegende Handbuch  beschreibt  das *Cockpit Städtische Infrastrukturen* für Hamburg als digitales Analyse- und Planungswerkzeug, welches mithilfe eines leicht zugänglichen User-Interface statistische und georeferenzierte Daten bündelt, visualisiert und integriert, um Planungsbedarfe zu identifizieren und Planungsprozesse zu beschleunigen. 
<br></br>
Dazu wurden die durch die *Urban Data Platform* der Stadt Hamburg aufgebauten Datenbankstrukturen genutzt, um eine kartenbasierte Webapplikation zu etablieren, welche den Sozialraumplanern der Stadt eine Reihe von Analysefunktionen zur Verfügung stellt, um auf der Verwaltungsebene der statistischen Gebiete soziodemographische Zusammenhänge zu identifizieren, Trends zu erkennen sowie Verhältnisse zwischen dem existierenden Infrastrukturangebot und den relevanten Zielgruppen zu ermitteln. Das Werkzeug soll im Folgenden helfen Standorte und Potentiale für die Entwicklung von Infrastruktur zu finden. Die Ergebnisse dieser Analysen können direkt aus CoSI heraus visualisiert und als Entscheidungs- und Diskussionsgrundlage verwendet werden. Der Workflow folgt dabei einer dreistufigen Logik von der *Visualisierung* von Daten, über die Analyse, also der kontextuellen Verknüpfung von Information, bis zur *Simulation* der Auswirkungen potentieller Maßnahmen.
<br></br>
Um die technischen und inhaltlichen Anforderungen des Initialisierungs-Projekts aufzustellen wurden im Vorfeld ab Sommer 2018 eine Reihe von Stakeholder- und Userstory-Workshops mit den Mitgliedern der Hamburger Verwaltung auf verschiedenen Ebenen durchgeführt. CoSI wurde dann ab August 2019 in einem agilen Verfahren, basierend auf der SCRUM-Methode, durch ein interdisziplinäres Team der HCU Hamburg und des LGV Hamburg entwickelt und stand den Sozialraumplanern des Bezirks Hamburg Nord seit dem 28.01.2020 bis Mai 2020 als Pilot im internen Verwaltungsnetzwerk zur Verfügung. Mitte 2020 wurde das Verfahren nach erfolgreicher Evaluation in den Produktivbetrieb überführt und steht seitdem bereits mehreren tausend Mitarbeiterinnen und Mitarbeitern zur Verfügung. Das seit dem 01.02.2021 gestartete Weiterentwicklungsprojekt hat das Ziel, bestehende Funktionen zu verbessern und neue Funktionen zu integrieren. Hierzu zählt insbesondere der „Blick nach vorne“ durch die Entwicklung einer Simulationsfunktion.

 # Inhalt
- [Datenmodell & -Infrastruktur](#datenmodell---infrastruktur)
  - [Regionalstatistische Daten](#regionalstatistische-daten)
    - [Fachdaten](#fachdaten)
    - [Analyse](#analyse)
    - [Darstellung](#darstellung)
    - [Geodienste](#geodienste)
    - [WMS](#wms)
    - [WFS](#wfs)
- [Module](#module)
  - [Überblick](#überblick)
  - [Themen (Layer)](#themen-layer)
  - [Barrierefreiheit](#barrierefreiheit)
  - [Analyse](#analyse-1)
    - [Einwohnerabfrage](#einwohnerabfrage)
    - [Erreichbarkeitsanalyse](#erreichbarkeitsanalyse)
    - [Filter](#filter)
  - [Versorgungsanalyse](#versorgungsanalyse)
    - [Vergleichbare Gebiete](#vergleichbare-gebiete)
  - [Simulation](#simulation)
  - [Dienste](#dienste)
    - [Zweites Fenster](#zweites-fenster)
  - [Gebietsauswahl](#gebietsauswahl)
  - [Kartenanalyse regionalstatistischer Daten](#kartenanalyse-regionalstatistischer-daten)
  - [Dashboard](#dashboard)
    - [Struktur (Technik)](#struktur-technik)
    - [InfoScreen](#infoscreen)
    - [Widgets](#widgets)
    - [Das Kontextmenü](#das-kontextmenü)
    - [Die Übersichtstabelle](#die-übersichtstabelle)
    - [Kontextfunktionen](#kontextfunktionen)
    - [XLSX herunterladen](#xlsx-herunterladen)
    - [Diagramme](#diagramme)
    - [Zeitstrahl](#zeitstrahl)
    - [Verhältnisse berechnen](#verhältnisse-berechnen)
    - [Korrelationsdiagramm](#korrelationsdiagramm)
    - [Ergebnisse](#ergebnisse)
# Datenmodell & -Infrastruktur
CoSI basiert im Kern aus der Überlagerung regelmäßig aktualisierter regionalstatistischer Kenndaten der einzelnen Gebietsebenen, welche vom Statistikamt Nord für Hamburg und Schleswig-Holstein (StaNord ) geliefert werden, und verschiedenster Fachdaten der unterschiedlichen Behörden, wie z.B. dem digitalen Grünplan (BUKEA) oder den Öffentlichen Schulen (BUE). Dabei versucht CoSI mehr als nur die Darstellung der Datensätze in Karte und Tabelle neben- und übereinander zu gewährleisten. Der Anspruch ist es, eine Integration der Daten und eine Interaktion mit den Daten zu erreichen. Also einerseits Zusammenhänge und Wechselwirkungen zwischen verschiedenen Datensätzen für die Nutzerinnen und Nutzer erfahrbar zu machen und andererseits diesen zu erlauben in die Datensätze „einzugreifen“, sie zu filtern, zu durchsuchen oder zu „manipulieren“. Letzteres, die Echtzeit-Veränderung von Datensätzen im laufenden Programm (s. Simulation) wird aktuell im laufenden Weiterentwicklungsprojekt konzipiert bzw. umgesetzt.
## Regionalstatistische Daten
Die Daten des StaNord liegen für alle Verwaltungsebenen der FHH (statistische Gebieten, Stadtteile, Bezirke und die Gesamtstadt) vor. Sie umfassen je nach Ebene über 60 Indikatoren, welche sich in die Kategorien
-	Bevölkerung
-	Fläche
-	Haushalte
-	Sozialversicherungspflichte
-	Arbeitslose
-	SGB II Leistungen
-	Grundsicherung im Alter
-	Wohnen
-	Verkehr

gliedern (für eine genaue Aufstellung s. Anhang). Diese Datensätze beinhalten je Zeitreihen, welche von (je nach Datensatz) ca. 2012 an erfasst sind und jährlich erweitert werden.

*Hinweis: Aus datenschutzrechtlichen Gründen werden bereits vom Datenbereitsteller solche Datensätze herausgefiltert, welche bei sensiblen Daten auf einzelne Individuen zurück verfolgbar wären. Diese Datensätze sind im „–“ oder mit „Keine Daten“ ausgewiesen.*

**Datensatz (Bsp.)**
| `Verwaltungseinheit`        | `Stadtteil`
------------ | -------------
`Bezirk` | `Hamburg-Nord`
`Stadtteil` | `Groß-Borstel`
`Kategorie` | `soz_sozverpflichtig_beschaeftigte_maenner_15_bis_u65_ant`
`2011` | `53,4`
`2012` | `53,6`
`...` | `...`
`2017` | `56,2`
`2018` | `55,6`

**Features Loader**
>Sämtliche StaNord-Daten werden, wie alle anderen Fachdaten, per Geodienst bereitgestellt. Die Datenstruktur der Daten hält jedoch nicht nur, wie im obigen Beispiel gezeigt, für jedes geografische Gebiet, auf jeder Verwaltungsebene, jeden Datensatz als eigenes Datenobjekt (Feature) vor. Auch ist jedes Feature mitsamt seiner geografischen Geometrie verknüpft. D.h. es kann nicht ein einzelnes Feature mit alles Datensätzen geladen werden, sondern die Anfrage muss für jeden Indikator einzeln erfolgen. Der Features Loader ist das CoSI-spezifische Modul, welches bei der Gebietsauswahl die gesammelten Datensätze unter Ausschluss der Geometrie (aus Performancegründen) vom Server anfragt und diese dann innerhalb der Anwendung mit dem in der Karte dargestellten Gebiet verknüpft.
### Fachdaten
Die Fachdatensätze, welche in CoSI eingebunden sind und werden können, werden als Geodienste von unterschiedlichsten Dateneignern (v.a. Behörden, aber prinzipiell auch Privatunternehmen, Echtzeitsensoren, etc.) bereitgestellt und in CoSI, wie im FHH-Atlas, über die URL des jeweiligen Dienstes abgerufen. Viele der Datensätze in ihrer aufbereiteten Form sind aus  den Verhandlungs- und Koordinationsprozessen des Urban Data Hub hervorgegangen, über den sich die Behörden und Datenhalter der FHH auf gemeinsame Standards und regelmäßige Veröffentlichungen verständigen.
### Analyse
Analysedaten sind all jene (als WFS, s. Geodienste) eingebundenen Datensätze, welche für die Verwendung mit den CoSI-Analyse- (und in Zukunft Simulations-) Werkzeugen konfiguriert wurden. D.h. jedes Objekt (Feature, z.B. Kita oder Grünfläche) ist dabei einzeln hinterlegt und kann mit seiner geografischen Position und Ausdehnung betrachtet werden.
### Darstellung
Darstellungsdaten sind auf Absprache mit den Fachplanern ausgewählte Datensätze aus dem FHH-Netz, welche durch das zugrundeliegende Geoportal (Masterportal) in der Karte visualisiert und mit einer Legende versehen werden. Per Klick kann der Datensatz für die jeweilige Koordinate aus dem Datensatz abgerufen werden. Im Gegensatz zu den Analysedaten liegen die Darstellungsdaten gegenwärtig nicht als einzelne Objekte, sondern als gekacheltes/gerastertes Bild vor (WMS, s. Geodienste).
### Geodienste
Alle in CoSI und dem FHH-Atlas dargestellten Daten werden von den Bereitstellern als Dienst vorgehalten. Der Dienst liefert über eine URL Datensätze der jeweiligen Datenbank in einem maschinenlesbaren Format. Über zusätzliche Parameter kann die Anfrage (Request) spezifiziert oder (z.B. auf einen geografischen Ausschnitt) eingegrenzt werden. 
### WMS
Ein WMS (Web Map Service) liefert Geodaten / Karten als Rasterbilder (PNG), welche zunächst einmal ohne Hintergrundinformation in der Karte angezeigt werden. Gleichzeitig können die Legende des Datensatzes oder Informationen zu einer bestimmten Koordinate über weitere Requests abgerufen werden.
### WFS
Der WFS (Web Feature Service) liefert im Gegensatz zum WMS keine fertige Kartenansicht, sondern ein rohes Datenobjekt, bei dem der Datensatz jedes geografischen Objekts (Punkt, Linie, Fläche, etc.) inkl. seiner Attribute (z.B. eine Schule mitsamt ihrem Schultyp, ihrer Schülerzahl, Mailadresse und Nachmittagsangebot) einzeln übermittelt. Die Visualisierung (das Styling) der Daten erfolgt dann anhand vorgegebener oder mitgelieferter Konfigurationen innerhalb der Applikation. Dies ist rechenintensiver für den Anwendenden und weniger kontrollierbar von Seiten des Datenbereitstellers, bietet jedoch die Möglichkeit mit den Objekten innerhalb des Portals direkt zu interagieren oder sie zu verändern.

# Module
Wie im zeitgenössischen (Web-) Development üblich, und wie im Kapitel Aufbau beschrieben, setzt sich CoSI als Instanz des Masterportals aus einer Reihe von themen- und datenspezifischen Modulen zusammen. 

CoSI bietet verschiedene Module an, einige davon sind aus dem Master Portal übernommen, die anderen sind CoSI-spezifisch. Nachfolgend finden Sie eine Übersicht der Tools in zwei Kategorien: 

**1. CoSI-Spezifisch**
1. Analyse:
   1. Kartenvisualisierung regionalstatistischer Daten
   2. Dashboard
   3. Einrichtungsübersicht (in Entwicklung)
   4. Erreichbarkeitsanalyse
   5. Gebiet auswählen
   6. Vergleichbare Gebiete ermitteln
   7. Versorgungsanalyse
1. Simulation: (In Entwicklung)
   1. Scenario Manager
   2. Scenario Builder
   3. Neighborhood-Builder
1. Dienste: 
   1. Mousehover ein-/ausschalten
   2. Zweites Fenster öffnen

**2.	Aus dem Master Portal übernommene Tools**
1. Analyse:
   1. Einwohnerabfrage
   2. Filter
   3. Datei Import Zeichnungen
   4. Strecke / Fläche messen
   5. Zeichnen und Schreiben
1. Dienste:
   1. Karte drucken
   2. Sitzung speichern
   3. WMS Hinzufügen

**Anpassungen**
>Die Tools aus dem Masterportal mussten in manchen Fällen für CoSI etwas angepasst werden, um die Stabilität innerhalb CoSI zu gewährleisten und den Nutzen zu erhöhen. So werden zum Beispiel beim Tool “Karte drucken” anders als im Masterportal individuell gestylte Kartenelemente mit ausgegeben, wofür es im Masterportal keine Notwendigkeit gab. Weitere Tools wie “Filter” und “Einwohnerabfrage” wurden angepasst bzw.  erweitert, um ihre Nutzbarkeit in CoSI zu erhöhen. Beim Filter wird so eine Ergebnisliste generiert und kann in das Dashboard übertragen werden (pushen). Die Einwohnerabfrage wurde in die Erreichbarkeitsanalyse integriert und ermöglicht so eine adressgenaue Abfrage der Einwohnerzahlen für ein generiertes Einzugsgebiet. Verschiedene weitere (z.T. auch rein kosmetische) Anpassungen des UI fließen aus CoSI heraus auch in die Kernarchitektur des Mastportals zurück.

## Überblick

![Abbildung 1 Das CoSI-UI](https://user-images.githubusercontent.com/79461871/127782477-b3cdc101-21cb-4b23-8d59-9c8a2a6ecc6d.JPG)

*Abbildung 1: Das CoSI-UI*

1. **Themenbaum/Themenlayer** (s. Themen)
2. **Analysefunktionen** (s. Analyse)
3. **Simulationsfunktionen** (noch nicht verfügbar)
4. **Dienste** (s. Dienste)
5. **Legende** (s. Legende)
6. **Dashboard** (s. Dashboard)
7. **Gebietsauswahl** (s. Gebietsauswahl)
8. **Kontaktformular** - Wünsche, Anmerkungen, Kommentare, Fehlerreports können direkt an das Projektteam bzw. die Fachliche Leitstelle übersandt werden
9. **Suchleiste** - Sie können nach Orten, Adressen, B-Plänen, sowie aktiven Features (KiTas, Sportstätten, etc.) in der Karte suchen
10. **Werkzeugfenster** - Aktive Werkzeuge werden im verschiebbaren Fenster angezeigt
11. **Sidebar** - Das Dashboard und der Filter werden in der Sidebar angezeigt, welche auch bei der Nutzung anderer Werkzeuge geöffnet bleibt. Die Sidebar kann in ihrer Breite angepasst werden. (s. Dashboard)
12. **Hereinzoomen**
13. **Herauszoomen**
14. **Ausgewähltes Gebiet fokussieren**
15. **Kartenvisualisierung regionalstatistischer Daten/Kontrollelement**
16. **Tooltip (Mousehover)** - Zeigt das Gebiet und andere Elemente unter dem Mauszeiger an. Kann unter „Dienste“ via „Mousehover ein-/ausschalten“ deaktiviert werden.
17. **Ausgewählte Gebiete** - Ausgewählte Gebiete werden dargestellt mit einer blauen Umrandung.

*Hinweis: Gegenwärtig ist die Simulationsfunktion noch nicht freigeschaltet.*

*Allgemeiner Hinweis: Jedes (CoSI-spezifische) Modul bietet ein Hilfebutton (Fragezeichen-Symbol) mit Hinweisen und Erläuterungen. Wo immer möglich und nötig sind alle Elemente mit erläuternden Tooltips versehen, welche erscheinen, wenn der Mauszeiger kurzzeitig über dem Element verharrt.*

## Themen (Layer)
Layer können aus dem Reiter “Themen” jederzeit zugeschaltet oder abgeschaltet werden. Jedoch muss bei Zuschaltung bedacht werden, dass die Ladezeiten entsprechend länger sein können, wenn vorher kein Planungsgebiet festgelegt wurde, da die Daten dann für das gesamte Hamburger Gebiet geladen werden müssen. Die Themen sind unter Fachdaten sortiert.

Der Themenbaum ist gegliedert in Hintergrundkarten, einen Katalog an Fachdaten und die aktuelle Auswahl an Kartenebenen.

![Abbildung 2 - Der Themenbaum](https://user-images.githubusercontent.com/79461871/127782473-044189ce-5df6-4e97-b77d-688b9d7f363a.JPG)

*Abbildung 2 - Der Themenbaum*

1. **Hintergrundkarten** - Layer wie „Stadtkarte Hamburg“, die als Standard automatisch aktiv sind. Bei Bedarf kann der Layer „Luftkarten DOP 2“ auch aktiviert werden. Sie können auch deaktiviert werden.
2. **Fachdaten** - 
	 - **Analyse/Simulation** - Die aufbereiteten Layer für CoSI-spezifische Werkzeuge (bereitgestellt als WFS, s. Glossar). Die einzelnen Datenlayer sind in Kategorien eingeteilt, die regelmäßig angepasst bzw. aktualisiert werden.
	 - **Darstellung** - Daten zur reinen „Anzeige“ in der Karte, v.a. entnommen aus dem FHH Atlas (bereitgestellt als WMS).
3. **Ausgewählte Themen** - Die aktiven Layer können in ihrer Reihenfolge verschoben und transparent gestellt werden
4. **Layer Info** - Über den Infobutton können die Legende und Metadaten des Fachdatenlayers angezeigt werden. Darunter finden sich u.a. eine Themenbeschreibung, das Publikationsdatum und die URL des betreffenden Dienstes. Die Funktion ist für alle Geoportale der FHH gleich.

Die Themen enthalten Informationen, die symbolisch oder durch Flächen auf der Karte dargestellt werden. In Abbildung 4 zum Beispiel stellen die roten Punkte die vorhandenen Kindertagesstätten im Gebiet dar, während die lilafarbenen Linien Flächen darstellen, die zum Layer Bebauungspläne gehören.

Eine Legende zu den aktiven Themen kann durch einen Klick auf den Reiter „Legende“ eingeblendet werden. Unabhängig davon können weitere Informationen zu dem jeweiligen Thema aufgerufen werden, per Klick auf dem Info-Button rechts neben dem Layer. Es werden Informationen wie eine Kurzbeschreibung des Themas inkl. Datenstand und eine Legende zu dem Thema angezeigt. Auch befinden sich hinter dem Info-Button Links zu Downloadquellen und eine WFS- bzw. WMF-Adresse.

Ein Klick auf ein Objekt auf der Karte öffnet eine Infotafel für die aktuelle Auswahl (Sportstätte, Kita, etc.). Auf der Infotafel werden Informationen über das Objekt angezeigt. Datenschutzrelevante (personenbezogene) Daten werden nicht angezeigt.

Es besteht die Möglichkeit die Reihenfolge und die Transparenz der aktiven Layer anzupassen: Unter „Ausgewählte Themen“ gibt es zu jedem ausgewählten Thema ein Info-Button und ein Einstellungsrädchen. Ein Klick auf das Rädchen öffnet die Einstellungsmöglichkeiten bzgl. Reihenfolge und Transparenz. 

## Barrierefreiheit 

Für eine leichtere Lesbarkeit sind in CoSI verschiedene Hilfestellungen angelegt. 

![Abbildung 3 – Hilfestellungen zur Barrierefreiheit](https://user-images.githubusercontent.com/79461871/127782471-695b5387-6924-42c8-b4ce-8753c9dc2693.JPG)

*Abbildung 3 – Hilfestellungen zur Barrierefreiheit*

1. **Integration einer neuen Chartbibliothek** - U. a. abrufbar über die Kartenvisualisierung regionalstatistischer Daten. Greift grundsätzlich für alle Funktionen/Dienste, die Chart-Darstellungen anbieten.
2. **Verbesserung der Lesbarkeit der Chart-Diagramme/-Auswertungen** - Auswahl zwischen Bar- und Chartdiagrammen 
3. **Ansicht ändern** - Zwei Optionen wählbar: dicke oder dünne Gebietsgrenzen
4. **Tooltipps** - Bei allen neuen Tools wurden Tooltipps integriert. Die Tipps sind Abrufbar über die Fragezeichen, die beim Fahren mit der Maus über die Fenster sichtbar werden.
5. **Hervorhebung von geclusterten Einrichtungen** - Mehrere Einrichtungen, die nah beieinander liegen werden als „Cluster“ mit einem einzigen Symbol und der Anzahl der Einrichtungen an dem Ort angezeigt (s.u.).

![Abbildung 4 - geclusterte Einrichtungen](https://user-images.githubusercontent.com/79461871/127782468-2fb1cff8-bfd1-4c21-af25-bd80449c719e.JPG)

*Abbildung 4 - geclusterte Einrichtungen*

## Analyse

![Abbildung 5 – Analyse](https://user-images.githubusercontent.com/79461871/127782464-ad061cff-1eb6-4eec-8cc5-99b8e7e960c9.JPG)

*Abbildung 5 – Analyse*

1. **Einrichtungsübersicht** - Ruft eine Tabellenübersicht der ausgewählten Einrichtungen auf und ermöglicht individuelle Sortierungen/Filterungen sowie einen Export.
2. **Einwohnerabfrage** - Adressgenaue Abfrage der Bevölkerungszahlen vom StaNord
3. **Erreichbarkeitsanalyse** - Erreichbarkeiten auf Basis des Straßennetzes ermitteln 
   - Erreichbarkeit ab einem Referenzpunkt
   - Erreichbarkeit in einem Gebiet
4. **Filter** - Fachdaten (Schulen, Grünflächen, etc.) nach Parametern filtern
5. **KML Import** - Erstellte und gespeicherte Zeichnungen importieren
6. **Strecke / Fläche messen**
7. **Vergleichbare Gebiete ermitteln** - Gebiete in Hamburg nach Parametern auswählen
8. **Versorgungsanalyse**  - Verhältnis zwischen Einrichtungen (Fachdaten) und Zielgruppen (StaNord-Daten) im Gebiet ermitteln
9. **Zeichnen / Schreiben** - Eigene Zeichnungen der Karte hinzufügen und exportieren

*Hinweis: Gegenwärtig ist die Einrichtungsübersicht noch nicht für die Produktion freigeschaltet.*

### Einwohnerabfrage
Grundsätzlich bietet diese Funktion die Möglichkeit an, via das Ziehen eines Rechtecks oder Kreises bzw. via das Zeichnen einer Fläche die adressgenaue Einwohneranzahl zu bestimmen. Dieses Werkzeug stammt aus dem Masterportal und wurde u.a. in dem Modul „Erreichbarkeitsanalyse“ integriert.

Beim direkten Aufruf unter dem Reiter „Analyse“ muss das Gebiet, über das man die Abfrage durchführen möchte, händisch festgelegt werden (via Rechteck oder Kreis ziehen bzw. via Zeichnen einer Fläche). 

Bei der Nutzung innerhalb des Kontexts der Erreichbarkeitsanalyse muss das Gebiet nicht händisch festgelegt werden, sondern es wird als Gebiet das errechnete Einzugsgebiet übernommen.

### Erreichbarkeitsanalyse
Eine Erreichbarkeitsanalyse kann durchgeführt werden auf zwei Arten: 1) Ab einem Referenzpunkt und 2) im Planungsgebiet. Der Modus der Analyse kann im Dropdown Menü ausgewählt werden.

**Wichtige Informationen:**
Dieses Werkzeug wurde realisiert unter Verwendung von OpenRouteService, einem Dienst, der von der Heidelberg Institute for Geoinformation Technology entwickelt und bereitgestellt wird.
Die Verwendung ist gedeckt durch die Creative Commons Lizenz CC BY 4.0.
Weitere Informationen finden Sie unter:
https://heigit.org/de/ortsbasierte-dienste-und-navigation/
https://openrouteservice.org/services/

**1) Erreichbarkeit ab einem Referenzpunkt**
Zeigt ein Gebiet an, welches von einem vom Nutzer gewählten Punkt auf der Karte innerhalb einer vom Nutzer festgelegten Entfernung erreichbar ist. Die Entfernung kann in Zeit oder in Metern angegeben werden. Die Erreichbarkeit wird berechnet abhängig von dem vom Nutzer festgelegten Verkehrsmittel. Die Polygone werden automatisch angepasst, wenn das Verkehrsmittel  oder andere Parameter geändert werden.

Das Modul kann verwendet werden, ohne vorher ein Planungsgebiet auszuwählen und zu bestätigen.

![Abbildung 6 – Erreichbarkeit ab einem Referenzpunkt](https://user-images.githubusercontent.com/79461871/127782460-1df4f30f-a717-441a-8385-387c2b3724c2.JPG)

*Abbildung 6 – Erreichbarkeit ab einem Referenzpunkt*

1. **Referenzpunkt** - Ein beliebiger Referenzpunkt wird auf der Karte gesetzt.
2. **Verkehrsmittel festlegen** - Das Verkehrsmittel wird ausgewählt aus einer Liste. Folgende Verkehrsmittel stehen aktuell zur Verfügung: Auto, Rad, Rad (elektrisch), Gehen, Rollstuhl.
3. **Maßeinheit der Entfernung festlegen** - Festlegen, ob die Entfernung in Minuten oder in Metern angegeben wird
4. **Entfernung** - Entfernung in zuvor festgelegter Maßeinheit (Minuten oder Metern) angeben
5. **Info, Zurück zur Auswahl, Polygon löschen** - Der Info Button enthält weitere Informationen über das Modul.  Mit dem Pfeil nach links navigiert man zurück zur Auswahl zwischen Erreichbarkeit ab einem Referenzpunkt und Erreichbarkeit im Gebiet. Per Klick auf den Mülleimer kann das Polygon gelöscht werden.
6. **Legende** -Eine Legende wird eingeblendet. Sie wird dynamisch für die Heatmap generiert und zeigt drei gleichmäßig verteilte Entfernungswerte. Höchstwert ist der zuvor eingegebene Wert für die Entfernung.
7. **Einrichtungsabdeckung** - Liefert alle Einrichtungen der aktiven Layer, die sich innerhalb des Einzugsbereichs (Heatmap) befinden in einer aufklappbaren Liste.
Bei Klick auf eine Einrichtung in der Liste bewegt sich der Positionsmarker auf die Einrichtung. Weitere Informationen über die Einrichtung können abgerufen werden, wenn die Einrichtung angeklickt wird.
8. **Zoom** - Die Heatmap wird ins Zentrum fokussiert.
9. **Einwohnerabfrage für den Bereich** -Führt eine adressgenaue Einwohnerabfrage für das Einzugsgebiet, welches durch das Polygon dargestellt ist, aus.
10. **Polygon** - Zeigt das, vom Referenzpunkt aus, erreichbare Gebiet abhängig von den zuvor eingegebenen Parametern als Heatmap.

**2) Erreichbarkeit im Gebiet**
Zeigt die Abdeckung und Erreichbarkeit von einer zuvor festgelegten Einrichtungsart (z.B. Kindergärten) in dem festgelegten Einzugsbereich (Planungsgebiet). Der Einzugsbereich ist die Entfernung von der jeweiligen Einrichtung und kann angegeben werden in Zeit oder in Metern. Die Erreichbarkeit ist abhängig von dem festgelegten Verkehrsmittel.

![Abbildung 7 - Erreichbarkeit im Gebiet](https://user-images.githubusercontent.com/79461871/127782458-38dc3400-23a5-4bb6-8949-406ea6b10f97.JPG)

*Abbildung 7 - Erreichbarkeit im Gebiet*

1. **Layer auswählen** - Damit dieses Modul verwendet werden kann muss mindestens ein Layer aktiv sein.
2. **Verkehrsmittel festlegen** - Das Verkehrsmittel wird ausgewählt aus einer Liste. Folgende Verkehrsmittel stehen aktuell zur Verfügung: Auto, Rad, Rad (elektrisch), Gehen, Rollstuhl.
3. **Maßeinheit der Entfernung festlegen** - Festlegen, ob die Entfernung in Minuten oder in Metern angegeben wird
4. **Entfernung** - Entfernung in zuvor festgelegter Maßeinheit (Minuten oder Metern) angeben
5. **Legende** - Eine Legende wird eingeblendet. Sie wird dynamisch für den Heatmap generiert und zeigt drei gleichmäßig verteilte Entfernungswerte. Höchstwert ist der zuvor eingegebene Wert für die Entfernung.
6. **Polygone** - Zeigen die, von der jeweiligen Einrichtung aus, erreichbare Gebieten abhängig von den zuvor eingegebenen Parametern als Heatmap. Die so errechneten Einzugsgebiete können sich überschneiden. Mit diesem Modul kann sichtbar gemacht werden wo Lücken bzgl. der Einrichtungsabdeckung im Gebiet entstehen.

### Filter
Die aktiven, ausgewählten Themen können durch Klick auf den Reiter „Filter“ nach den Kategorien ihrer Datensätze durchsucht und gefiltert werden. Die Karte zoomt automatisch auf die Filterergebnisse. Es werden nur Ergebnisse in den ausgewählten Gebieten einbezogen. Der Filter ist für alle Fachdatensätze verfügbar, welche sinnvolle filterbare Attribute (wie Fläche, Nutzung, Träger, etc.) aufweisen.

![Abbildung 8 – Filter](https://user-images.githubusercontent.com/79461871/127782451-5b9bb809-a61e-40cd-a51f-6a03ef9bc4b5.JPG)

*Abbildung 8 – Filter*

1. **Ein Thema im Filter wählen** - Angezeigt werden die ausgewählten Themen. Themen können jederzeit hinzugefügt werden. Dazu Themenbau anklicken und Thema auswählen.
2. **Filteroptionen:**
   - es können mehrere Filteroptionen gewählt werden. Kennzeichnung der Auswahl erfolgt automatisch durch Haken. 
   - Schieberegler (von / bis): es kann z.B. eine gewünschte Flächengröße eingegeben werden.
3. **Ergebnis wird sofort mit Wahl der Filteroption angezeigt:**
   - Ergebnis wird in der Karte durch Symbol oder Flächenfarbe angezeigt. Durch Anklicken des Reiters “Legende” wird diese eingeblendet. Mousehover blendet Infofeld zu Einrichtung / Fläche ein.
   - Im Ergebnisfeld der Suche werden Namen der Gebiete / Einrichtungen angezeigt. Durch Anklicken der Namen wird die Auswahl in der Karte markiert. 
4. **Filter löschen:** einzelne Auswahl durch Anklicken des roten „X“ oder gesamte Auswahl löschen durch Anklicken des Buttons „Alle löschen”.

## Versorgungsanalyse
Das Werkzeug "Versorgungsanalyse" berechnet das Verhältnis zweier Datensätze zueinander. Die Datensätze können entweder regionalstatistische Daten oder Einrichtungsdaten aus dem Menü "Themen/ Fachdaten" sein. Damit die Versorgungsanalyse verwendet werden kann, müssen mindestens zwei Datensätze geladen worden sein.

![Abbildung 9 – Versorgungsanalyse, Einstellungen](https://user-images.githubusercontent.com/79461871/127782445-258de067-443c-4f02-99ca-b3617d62272f.JPG)

*Abbildung 9 – Versorgungsanalyse, Einstellungen*

Im Folgenden finden Sie die einzelnen Funktionen des Werkzeugs im Detail erklärt:
1. Über den Button öffnen Sie dieses Hilfsfenster.
2. Über den Button können Sie zwischen Einrichtungs- und regionalstatistischen Datensätzen umschalten.
3. Mit dem Select-Feld wählen Sie einen der geladenen Datensätze aus.
4. Bei Einrichtungsdatensätzen können Sie einen Faktor (F) angeben, der bestimmt, wie viele Einheiten der ausgewählten Einrichtung für den Referenzdatensatz benötigt werden. Wollen Sie beispielsweise die Anzahl der Öffentlichen Schulen gegen die Anzahl der Bevölkerung unter 18 rechnen und geben einen Faktor von 0,001 an, würde das bedeuten, dass eine Schule pro 1000 Mitglieder der Referenzgruppe benötigt wird. Ist ein Faktor (F) angegeben, werden die Spalten "Kapazität" und "Bedarf" in der Berechnungstabelle mit angegeben.
5. Manche Einrichtungsdatensätze haben andere Parameter, als nur ihre Anzahl in den ausgewählten Gebieten. So kann man bei Öffentlichen Schulen beispielsweise den Datensatz "Schülerzahl" abfragen oder bei Krankenhäusern die Anzahl der stationären Plätze. Nicht jeder Einrichtungsdatensatz bietet zusätzliche Parameter.

![Abbildung 10 – Versorgungsanalyse, Ergebnisse](https://user-images.githubusercontent.com/79461871/127782439-378ee12b-8acf-41fd-be3e-15a63a5638ac.JPG)

*Abbildung 10 – Versorgungsanalyse, Ergebnisse*

1. **Ergebnis** - Ergebnisse werden tabellarisch inkl. Gesamtwert, sowie in der Karte, farblich nach Wert gekennzeichnet dargestellt.
Tabellenspalten:
   - Gebiet
   - Einrichtung: Die Gesamtzahl der Einrichtungen bzw. des gewählten Parameters der Einrichtungen im Gebiet (z.B. m² Spielplatz)
   - Zielgruppe: Die Zahl der Personen der (kombinierten) Zielgruppe im Gebiet
   - Kapazität: Die Zahl der Personen, die die Einrichtungen versorgen können, gemäß Faktor F
   - Bedarf: Der Wert des Parameters der Einrichtungen, die für die Zahl an Personen im Gebiet notwendig wäre, gemäß Faktor F
   - Verhältnis: Das einfache Verhältnis zwischen Einrichtungen (Zahl oder Parameter) und (kombinierter) Zielgruppe im Gebiet
   - Unter- / Überversorgung: Die Versorgungsabdeckung in Prozent, d.h. das Verhältnis zwischen Kapazität und (kombinierter) Zielgruppe im Gebiet. Wurde kein Faktor F ausgewählt, zeigt die Spalte das direkte Verhältnis zwischen Einrichtung und Zielgruppe.
2. **Gesamt / Durchschnitt** - Für die ausgewählten Gebiete werden Gesamt- und Durchschnittswerte ermittelt. Der Gesamtwert errechnet sich hierbei aus der Summe aller Einrichtungs- und Zielgruppenwerte. Der Durchschnittswert ist das arithmetische Mittel der ausgewählten Gebiete.
3. **Als XLSX oder GeoJson herunterladen** - Die obige Tabelle kann als XLSX-Datei oder als GeoJson zur weiteren Verarbeitung in z.B. MS Excel oder QGIS heruntergeladen werden.
4. **Im Dashboard anzeigen** - Die Ergebnistabelle kann direkt ins Dashboard für spätere Verwendung übertragen werden

### Vergleichbare Gebiete
Das Werkzeug erlaubt die Ermittlung aller Gebiete (Stadtteile oder stat. Gebiete) in denen die ausgewählten Parameter vorherrschen, bzw. solcher, die dem gewählten Referenzgebiet in diesen Parametern ähneln.

![Abbildung 11 – Vergleichbare Gebiete](https://user-images.githubusercontent.com/79461871/127782431-3a4da740-8042-42c3-84f0-9a86dfcae4d4.JPG)

*Abbildung 11 – Vergleichbare Gebiete*

1. **Statistische Datenfilter** - Gewünschten Parameter für den Vergleich auswählen. Es können beliebig viele Parameter hinzugefügt werden. Alle StaNord-Datensätze sind hierfür verfügbar. Anteilige Werte eignen sich jedoch besser für die Vergleichbarkeit. Gegenwärtig können eigene Berechnungen aus dem Dashboard nicht herangezogen werden.
2. **Referenzgebiet** - Optional kann eins der ausgewählten Gebiete als Referenzgebiet angegeben werden.
3. **Parametereinstellungen** - Die Parametereinstellungen zeigen den aktuellen Datensatz (Jahr Min.- und Max.-Wert aller Hamburger Gebiete, den Referenzwert (frei wählbar oder des Referenzgebiets), sowie die Toleranz nach oben und unten. Das Toleranzintervall ist entweder in absoluten Zahlen oder in Prozent für anteilige Werte angegeben.
4. **Ergebnisse** - Die zutreffenden Gebiete werden in der Karte markiert.

![Abbildung 12 - Vergleichbarkeit, Ergebnisse](https://user-images.githubusercontent.com/79461871/127782419-768833f8-87b5-4a63-a70a-df1fe1caa7cc.JPG)

*Abbildung 12 - Vergleichbarkeit, Ergebnisse*

1. **Ergebnisse** - Alle Gebiete, auf die die gewählten Kriterien zutreffen, werden hier aufgelistet. Ein Klick auf ein Gebiet legt den Kartenausschnitt auf dieses fest.
2. **Als Gebietsauswahl setzen** - Über Auswahl setzen kann die aktuelle Gebietsauswahl für weitere Analysen auf die Ergebnis-Gebiete gesetzt werden.
3. **Im Dashboard anzeigen** - Die Ergebnisliste kann ins Dashboard übertragen werden, ohne die Gebietsauswahl zu verändern.

## Simulation
Eine erste Simulationsfunktion wurde entwickelt. Sobald diese in die Produktion überführt wurde, folgt eine schrittweise Anleitung an dieser Stelle.
**Anleitung Einbinden**

## Dienste

![Abbildung 13 - Dienste](https://user-images.githubusercontent.com/79461871/127782413-8e34fc4d-d388-4638-806b-26645db709f6.JPG)

*Abbildung 13 - Dienste*

1. **Karte drucken** - Den aktuellen Kartenausschnitt inkl. aktiver Layer drucken
2. **Mousehover ein-/ausschalten** - Den Tooltip, der am Mauszeiger in der Karte eingeblendet wird (de-)aktivieren
3. **Sitzung speichern** - Die aktuelle Sitzung mit aktiven Daten, gewählten Gebieten und Filtern als URL speichern.
Über die URL kann der Kartenzustand reproduziert werden.
*Hinweis: Manuell hinzugefügte Kartendienste (WMS) und erstellte Berechnungen bleiben nicht erhalten. Das Speichern aller Arbeitsergebnisse ist Teil des aktuell laufenden Weiterentwicklugnsprojekts.*
4. **WMS hinzufügen** - Beliebige andere Kartendienste können aus dem FHH-Atlas oder anderen Quellen über die Webadresse (URL) des Dienstes eingebunden werden. Die URLs entnehmen Sie z.B. dem Metadatenkatalog der FHH oder dem Geoportal unter dem Info-Button im Themenbaum (s. Themenbaum).
5. **Zweites Fenster öffnen** - s. Zweites Fenster

### Zweites Fenster
Über den Reiter "Dienste"/"Zweites Fenster öffnen" können Sie einen zweiten Browser-Tab mit dem Dashboard öffnen. Ihnen stehen dort alle Funktionen wie im ursprünglichen Fenster zur Verfügung. Sie können das zweite Fenster von Ihrem Browser durch Ziehen des Tabs (der Registerkarte) ablösen, um es auf einen zweiten Bildschirm zu bewegen. Wenn der InfoScreen (zweites Fenster) geöffnet ist, können Sie das Dashboard im Hauptfenster nicht mehr öffnen. Schließen Sie das Fenster, kehrt das Dashboard ins Hauptfenster zurück.

## Gebietsauswahl
Beim Starten von CoSI wird zunächst ein Bezugsrahmen festgelegt sowie ein Planungsgebiet zusammengestellt und bestätigt.

![Abbildung 14 - Das Werkzeug Gebiet auswählen](https://user-images.githubusercontent.com/79461871/127782409-e6ad33d9-0d6a-42bc-a572-92c3dfbfb198.JPG)

*Abbildung 14 - Das Werkzeug "Gebiet auswählen"*

1. **Bezugsrahmen wählen** - Über ein Dropdown Menü können „Bezirke“,„Stadtteile“ oder „statistische Gebiete“ ausgewählt werden - die Verwaltungseinheit, für die die statistischen Daten angezeigt und Auswertungen erstellt werden sollen. Alle Funktionen sind auf den jeweiligen Gebietsebenen verfügbar. Die Zahl der verfügbaren Indikatoren kann jedoch variieren. Der Bezugsrahmen bestimmt auch die zu ladenden übergeordneten Referenzgebiete: Stadtteile für stat. Gebiete, Bezirke für Stadtteile.
2. **Puffer festlegen** - Es kann einen Pufferradius festgelegt werden, für den ausgewählte Fachdaten um das Planungsgebiet herum angezeigt werden. Dies berücksichtigt die Tatsache, dass das Einzugsgebiet von einer Einrichtung nicht unbedingt übereinstimmt mit den Gebietsgrenzen der Verwaltungseinheit innerhalb derer sich die Einrichtung befindet. Die Analysefunktionen werden davon nicht beeinflusst.
3. **Auswahl bestätigen** - Lädt die Daten für das ausgewählte Planungsgebiet vom Server und legt den Bereich für die anzuzeigenden Fachdaten fest. Auch eine leere Auswahl kann bestätigt werden. Dann werden keine Daten geladen und Fachdaten für den gesamten Stadtbereich angezeigt. (s. unten)
4. **Auswahl zurücksetzen** - Setzt das aktuelle Planungsgebiet zurück. Im direkten Anschluss kann ein neues Planungsgebiet zusammengestellt und bestätigt werden.
5. **Auswahlrechteck zeichnen** - Ein Startpunkt wird gesetzt und ein Rechteck bis zum Endpunkt über das relevante Gebiet gezogen. Alle Verwaltungseinheiten, die innerhalb des Rechtecks oder an den Linien des Rechtecks liegen, werden in das Planungsgebiet aufgenommen.
6. **Werkzeug Info**
7. **Zusätzliche Hilfsebenen ein- und ausblenden** - Mithilfe der Checkbox können zusätzliche Layer zur Orientierung ein- und ausgeblendet werden. Der Layer kann ebenfalls über den Themenbaum ein- und ausgeschaltet werden. Zu den Hilfsebenen gehören aktuell die „Sozialräume“ und die „RISE Fördergebiete“.
8. **Gebiete aus- und abwählen:**
	 - Die einzelnen Verwaltungseinheiten (statistisches Gebiet oder Stadtteil) anklicken (nochmaliges Klicken deaktiviert die Auswahl wieder), die Grenzen werden blau markiert. 
	 - Auf dem Stift rechts neben “Auswahl zurücksetzen” klicken. Es wird ein Zeichentool aktiviert; damit kann der Nutzende ein Rechteck über das Auswahlgebiet ziehen um dieses auszuwählen.
	 - Beide vorher beschriebenen Möglichkeiten sind auch miteinander kombinierbar, wobei die Reihenfolge unerheblich ist. Die Nutzenden können also zuerst einzelne Verwaltungseinheiten auswählen und dann das Zeichentool aktivieren, um damit weitere Verwaltungseinheiten dazuzuschalten oder auch andersherum vorgehen.

Das festgelegte Planungsgebiet kann jederzeit angepasst werden; das Gebiet kann erweitert (sowohl per Klick als auch per Zeichentool), verkleinert (per Klick können markierte Verwaltungseinheiten wieder abgewählt werden) oder auch komplett zurückgesetzt (per Klick auf “Auswahl zurücksetzen”) werden.

Es muss nicht in jedem Nutzungskontext immer ein Planungsgebiet als erstes festgelegt werden; bestimmte Analysetools wie z.B. die „Erreichbarkeitsanalyse“ und „Vergleichbare Gebiete“ können verwendet werden ohne dass vorher ein Gebiet festgelegt wird. 

Für solche Fälle gelten folgende Hinweise:
1.	Es werden keine Datensätze geladen, d.h. eine Anzeige der regionalstatistischen Daten ist nicht möglich. Auch werden keine regionalstatistischen Daten im Dashboard angezeigt.
2.	Beim Zuschalten von Themen aus den Fachdaten könnte der Ladevorgang länger dauern
3.	Möglicherweise funktioniert die Erreichbarkeitsanalyse für eine sehr große Zahl von Einrichtungen nicht zuverlässig.

## Kartenanalyse regionalstatistischer Daten
Grundlage aller CoSI-Analysefunktionen sind neben den Fachdaten-Layern die Datensätze der StaNord-Datenbank, welche für die verschiedenen Verwaltungseinheiten als Zeitreihen vorliegen (s. Regionalstatistische Daten). Diese können für das ausgewählte Planungsgebiet direkt und dynamisch in der Karte visualisiert werden. Die Farbskalierung und Legende werden hierbei dynamisch aus der Auswahl generiert. Es wird immer der aktuellste Datensatz dargestellt. 
Das Werkzeug zur Visualisierung regionalstatistischer Daten ermöglicht die Auswahl von regionalstatistischen Datensätzen, die für die ausgewählten Bezirke verfügbar sind. Es kann nur verwendet werden, wenn bereits Gebiete über das Gebietsauswahlwerkzeug ausgewählt wurden. Das Werkzeug kann die ausgewählten Datensätze auf der Karte visualisieren und generiert eine dynamische Legende. Des Weiteren können Datensätze für mehrere Jahre ausgewählt und auf Wunsch in hintereinander laufender Folge animiert werden.

![Abbildung 15 - Fenster zur Kartenanalyse statistischer Daten](https://user-images.githubusercontent.com/79461871/127782404-2bd7098d-5d90-47f5-baa4-5d4f17aeb0d9.JPG)

*Abbildung 15 - Fenster zur Kartenanalyse statistischer Daten*

Im Folgenden finden Sie die einzelnen Funktionen des Werkzeugs im Detail erklärt:
1.	Über den Button kann das Fenster des Werkzeugs minimiert werden.
2.	Über den Button kann die Kartenvisualisierung ein- und wieder ausgeblendet werden.
3.	Mit den Vor- und Zurückbuttons können die regionalstatistischen Datensätze fließend durchgeschaltet werden.
4.	Das Jahr, für den der regionalstatistische Datensatz visualisiert wird. Standardmäßig ist das aktuellste, verfügbare Jahr ausgewählt.
5.	Hier können Sie ein Vergleichsjahr auswählen. Die prozentuale Differenz zum ersten, ausgewählten Jahr wird dann ebenfalls auf der Karte eingeblendet.
6.	Das Auswahlfeld für die verfügbaren regionalstatistischen Datensätze. StaNord-Datensätze
Erlaubt es, die relevanten regionalstatistischen Datensätze für die ausgewählten Gebiete und den Bezugsmaßstab durchzuschalten und diese mit Farbskala auf der Karte darzustellen. Die Auswahl zeigt immer die neuesten verfügbaren Daten.
7.	Die Legende für die farbliche Visualisierung der Karte. Wenn Sie mit der Maus über einen der Marker hovern, wird der Wert des zugehörigen, ausgewählten Gebiets angezeigt. Rechts und links werden der niedrigste und der höchste Wert noch einmal zusätzlich dargestellt.
8.	Über den Button öffnen Sie dieses Hilfsfenster.
9.	Mit dem Play-Button starten Sie die Animation der Datensätze über alle verfügbaren Jahre. In dem danebenstehenden Feld können Sie einen Wert eintragen, der angibt, wie schnell die einzelnen Animationsschritte durchlaufen werden (in Sekunden).
10.	Lädt die aktuellen Daten in das Visualisierungs-Werkzeug und erzeugt dort einen Graphen.
11.	Über den Button können Sie die Namen der ausgewählten Gebiete auf der Karte ein- und wieder ausblenden.

## Dashboard

Das Dashboard bildet das „Herzstück“ der Analysefunktionen in CoSI. Sämtliche Auswertungen der kartenbasierten Tools sowie die zugrundeliegenden Datensätze laufen hier zusammen. Es bildet stets die Gesamtstadt, die ausgewählten statistischen Gebiete sowie die dazugehörigen Referenzgebiete (der übergeordneten Verwaltungseinheit) mit sämtlichen StaNord-Kenndaten tabellarisch ab und beherbergt eine Reihe von statistischen Analysewerkzeugen wie Diagrammen, Korrelationen oder Verhältnisbildung. Darüber hinaus können die Auswertungsergebnisse aller anderen Module von CoSI im Dashboard angezeigt und hier für weitere Auswertungen oder Darstellungen genutzt werden.

![Abbildung 16 - Dashboard Übersicht](https://user-images.githubusercontent.com/79461871/127782403-1d93e036-35c4-4c85-a94b-cb9232804e77.JPG)

*Abbildung 16 - Dashboard Übersicht*

1. **Dashboard**
2. **Widget** (s. Widgets)
3. **Vergrößern / Verkleinern**
4. **Schließen**

### Struktur (Technik)
Seiner Grundfunktion nach ist das Dashboard eine frei konfigurierbare Arbeitsumgebung, die sowohl für die eigene Arbeit als auch für die Visualisierung und Präsentation der Ergebnisse möglichst frei konfiguriert werden kann (mehr dazu unter InfoScreen und Ausblick). Seinem Aufbau nach ist das Dashboard völlig ignorant gegenüber den Inhalten, die in ihm dargestellt werden. So ist es denkbar, es in zukünftigen Entwicklungsschritten beliebig zu erweitern.

Über eine einfache, vorkonfigurierte Funktion können Inhalte aus anderen Modulen ins Dashboard übertragen und dort als neues Widget dargestellt werden.

### InfoScreen
Über den Reiter "Dienste"/"Zweites Fenster öffnen" können Sie einen zweiten Browser-Tab mit dem Dashboard öffnen. Ihnen stehen dort alle Funktionen wie im ursprünglichen Fenster zur Verfügung. Sie können das zweite Fenster von Ihrem Browser durch Ziehen des Tabs (der Registerkarte) ablösen, um es auf einen zweiten Bildschirm zu bewegen. Wenn der InfoScreen geöffnet ist, können Sie das Dashboard im Hauptfenster nicht mehr öffnen. Schließen Sie das Fenster kehrt das Dashboard ins Hauptfenster zurück.

### Widgets
Ein Widget ist ein isoliertes Fenster/Feld innerhalb des Dashboards, das beliebige Inhalte und Funktionen beherbergen kann. Widgets können (wenn nicht anders konfiguriert) skaliert, verschoben, minimiert und gelöscht werden. Sie bleiben erhalten (persistent), auch wenn der Nutzende das Dashboard schließt oder die Gebietsauswahl ändert. Auch können Sie (codeseitig) dezentral von überall aus CoSI heraus verwaltet werden.

Über den Button „Dashboard zurücksetzen“ ganz unten im Dashboard können alle Widgets (außer der Übersichtstabelle) wieder gelöscht werden.

*Hinweis: Gegenwärtig werden bereits geöffnete Widgets mit Ausnahme der Übersichtstabelle nicht beim Öffnen des InfoScreens automatisch übertragen.Hinweis: Gegenwärtig werden bereits geöffnete Widgets mit Ausnahme der Übersichtstabelle nicht beim Öffnen des InfoScreens automatisch übertragen.*

![Abbildung 15 - Widget + Kontextmenü (z B  Diagramm)](https://user-images.githubusercontent.com/79461871/127782398-3998ee87-b2a2-46f4-a3fa-5dafadf20101.JPG)

*Abbildung 15 - Widget + Kontextmenü (z.B. Diagramm)*

1. **Titel (Verschieben)** - Durch Klicken und ziehen kann das Widget an eine andere Stelle im Dashboard gezogen und die Reihenfolge der Widgets verändert werden.
2. **Minimieren** - Das Widget kann minimiert werden und so für eine spätere Nutzung zur Verfügung stehen.
3. **Löschen** - Das Widget kann jederzeit gelöscht werden. Die Daten gehen dann verloren. Nur die Übersichtstabelle wird beim nächsten Öffnen des Dashboards erneut aufgebaut.
4. **Vergrößern / Verkleinern** - Widgets können vergrößert und verkleinert werden; in welchem Rahmen das möglich ist, ist abhängig vom Inhalt.
5. **Kontextmenü**

### Das Kontextmenü
Alle tiefergehenden Interaktionen mit den Inhalten des Dashboards bzw. der Widgets findet über ein Kontextmenü statt, welches per Rechtsklick auf ein Element aufgerufen wird. Welche Funktionen dabei zur Verfügung stehen hängt vom jeweiligen Element ab. Sind auf einem Element keine Funktionen verfügbar, öffnet sich das Kontextmenü nicht. Gegenwärtig sind Kontextfunktionen in der Übersichtstabelle und den Diagrammen implementiert.

### Die Übersichtstabelle
Per Voreinstellung ist die Tabelle beim Öffnen des Dashboards das erste Widget, welches automatisch angezeigt wird. Die Tabelle zeigt alle Indikatoren der StaNord-Daten für die ausgewählten Gebiete sowie die dazugehörigen Referenzgebiete der nächst größeren Verwaltungseinheit. D.h. der jeweiligen Stadtteile bei stat. Gebieten und den Bezirken bei Stadtteilen. Alle Datensätze sind gruppiert nach Themenblock und beinhalten fortlaufende Zeitreihen, welche jährlich erweitert werden (s. regionalstatistischen Daten). Zusätzlich werden berechnete Durchschnitts- und Gesamtwerte für die ursprüngliche Auswahl dargestellt. 

**Berechnungen**
>Die Referenzgebiete werden dabei nicht mit eingerechnet. Auch werden nur Gesamt- und Durchschnittswerte für absolute und nicht für anteilige Werte berechnet, da die Bezugsgrößen nicht eindeutig sind und somit zu fehlerhaften Berechnungen führen können. Bspw. bezieht sich „Anteil der Bevölkerung mit Migrationshintergrund“ auf die „Bevölkerung insgesamt“, „Anteil der Sozialversicherungspflichtig beschäftigten Frauen 15 bis unter 65 Jahren“ jedoch auf die absolute Zahl der Frauen zwischen 15 und 65, welche in dieser Form bei den StaNord-Daten nicht als Datensatz vorliegt. Theoretisch ist eine Referenzierung des Bezugsdatensatzes in der Datenbank denkbar. Dies ist jedoch ein Datenthema, welches in Koordination zwischen UDH und StaNord in zukünftigen Entwicklungsschritten beschlossen werden muss. 

Die Tabelle zeigt alle Indikatoren der StaNord-Daten für Ihre ausgewählten Gebiete. Zusätzlich sehen Sie die dazugehörigen Referenzgebiete der nächstgrößeren Verwaltungseinheit sowie berechnete Durchschnitts- und Gesamtwerte für Ihre Auswahl (die Referenzgebiete werden nicht mit eingerechnet).

Per Klick auf einen Gebietsnamen können Sie zu diesem in der Karte hin zoomen. Sie können Tabellenspalten verschieben oder ausblenden. Ausgeblendete Spalten werden nicht bei der Diagrammerstellung berücksichtigt.

Im Kontextmenü können Sie 1) Diagramme aus Tabellenspalten erstellen oder 2) Tabellenzeilen miteinander verrechnen (Quotienten bilden). Die Berechnungsergebnisse werden für alle Jahre und Gebiete als neue Zeile der Tabelle angefügt. Per Kontrollkästchen oder gedrückte STRG-Taste können Sie mehrere Zeilen der Tabelle für gruppierte Diagramme auswählen.

Die Tabelle kann über das Auswahlfeld (oben rechts) gefiltert werden. Die ursprüngliche und die gefilterte Tabelle können als XLSX-Datei heruntergeladen werden.

Bitte beachten Sie: In regionalstatistischen Gebieten mit unter 100 Einwohnern oder einer Kategorie mit weniger als 10 individuellen Personen wird aus Datenschutzgründen kein Wert angegeben.

Dies kann bei der Erstellung von Diagrammen zu ungewollten Ausreißern und Fehldarstellungen führen.

Die Tabelle kann über das Auswahlfeld (oben rechts) gefiltert werden. Die ursprüngliche und die gefilterte Tabelle können als XLSX heruntergeladen werden (s. XLSX herunterladen). Per Klick auf einen Gebietsnamen zoomt die Karte zu diesem hin.

Tabellenspalten können zudem verschoben oder ausgeblendet werden. Bei der Diagrammerstellung richtet sich die Reihenfolge der dargestellten Gebiete (bei Balkendiagrammen) nach der gewählten Spaltenreihenfolge. Ausgeblendete Spalten wiederum werden nicht bei der Diagrammerstellung berücksichtigt.

*Hinweis: Gegenwärtig können Spalten mit numerischen Namen (stat. Gebiete) nicht verschoben werden, sondern werden immer in aufsteigender Reihenfolge ihrer Nummern links in der Tabelle dargestellt.*

### Kontextfunktionen
Im Kontextmenü können Sie 1) Diagramme aus Tabellenspalten erstellen oder 2) Tabellenzeilen miteinander verrechnen (Quotienten bilden). Die Berechnungsergebnisse werden für alle Jahre und Gebiete als neue Zeile der Tabelle angefügt. Per Kontrollkästchen oder gedrückte STRG-Taste können Sie mehrere Zeilen der Tabelle für gruppierte Diagramme auswählen.

Bitte beachten Sie: In regionalstatistischen Gebieten mit unter 100 Einwohnern oder einer Kategorie mit weniger als 10 individuellen Personen wird aus Datenschutzgründen kein Wert angegeben.

Dies kann bei der Erstellung von Diagrammen zu ungewollten Ausreißern und Fehldarstellungen führen.

![Abbildung 17 - Kontextfunktionen Übersichtstabelle](https://user-images.githubusercontent.com/79461871/127782392-83cb380f-89c8-419f-a1c6-8760407d687a.JPG)

*Abbildung 17 - Kontextfunktionen Übersichtstabelle*

1. **Diagramme** - Diagramme aus dem ausgewählten Datensatz erstellen. Balkendiagramme können auch für mehrere Indikatoren als gruppierte Balkendiagramme erstellt werden. Die Ergebnisse werden unten im Dashboard als Widget dargestellt.
2. **Auswahl** - Zwei Datensätze für die Bildung von Verhältnissen/Korrelationen. Die getätigte Auswahl wird über der Tabelle und bei „Eigene Berechnungen“ angezeigt.
3. **Eigene Berechnungen** - Berechnungen aus der vorangegangenen Auswahl erstellen. Bei Verhältnissen werden alle Jahre der Zähler- durch die Nenner-Werte geteilt. Bei Korrelationsdiagrammen werden die Y-Werte aller Jahre über den X-Werten aufgetragen.

### XLSX herunterladen 
Die Übersichtstabelle kann als XLS-Datei zur Weiterverarbeitung in MS Excel heruntergeladen werden. Die Erstellung der Tabelle kann über die Buttons am Ende der Tabelle erfolgen. Dabei kann zwischen ungefilterten und gefilterten XLSX gewählt werden.
1. Die Tabelle kann sowohl ungefiltert als auch gefiltert heruntergeladen werden.
2. Eigene Berechnungen werden inkludiert.
3. Die Reihenfolge der Spalten kann durch den Nutzer bereits im Dashboard verändert werden.
4. Spalten werden durch das Ausblenden ausgeschlossen.

### Diagramme
Grundsätzlich können im CoSI-Dashboard in der gegenwärtigen Version folgende Diagrammtypen dargestellt werden:

1. **Balkendiagramme** - für ein ausgewähltes Jahr, auch gruppiert für mehrere Datensätze (s. Abb. 17)
2. **Liniendiagramme** - für einen Datensatz über alle Jahre
3. **Zeitstrahl** - Animierte Balkendiagramme für alle Jahre, Farbkodierung in der Karte (s. Zeitstrahl)
4. **Korrelationsdiagramme (Punktdiagramme)** - Visualisierung eines beliebigen Datensatzes (Y-Achse, Ordinate) über einem anderen (X-Achse, Abszisse) (s. Korrelation berechnen)

![Abbildung 18 - Daten für Diagramme auswählen](https://user-images.githubusercontent.com/79461871/127782388-4cc4a8fe-d877-40b5-86a8-4e82108b38a2.JPG)

*Abbildung 18 - Daten für Diagramme auswählen*

1. **Mehrere Zeilen auswählen (gruppierte Balkendiagramme)** - Per Kontrollkästchen oder gedrückte STRG-Taste können mehrere Zeilen der Tabelle für gruppierte Balkendiagramme ausgewählt werden (s. unten). Funktioniert aus Gründen der Übersichtlichkeit nicht für Liniendiagramme. Die Reihenfolge der Auswahl bestimmt die Reihenfolge der Balken im Diagramm.
2. **Jahr für Balkendiagramm wählen** - Ist kein Datensatz verfügbar wird eine Meldung angezeigt. Voreingestellt ist stets das letzte vergangene Jahr vom aktuellen Datum aus. Bestätigen durch Klick auf „Erstellen für“.
3. **Achsenskalierung für Liniendiagramme** - 
	 - Unskalierte Achsen: Die Y-Achse beginnt bei 0
	 - Skalierte Achsen: Die Y-Achse beginnt beim nächsten sinnvoll (wenn mögl. ganzzahligen) Wert unter dem niedrigsten Wert
	 - 
*Hinweis: Die Reihenfolge der Spalten bestimmt die Reihenfolge in den (Balken-)Diagrammen. Datensätze aus ausgeblendeten Spalten werden nicht angezeigt.*

![Abbildung 19 - Diagrammtypen](https://user-images.githubusercontent.com/79461871/127782384-ab090ce8-9bed-4ae8-813d-d30c1cf35728.JPG)

*Abbildung 19 - Diagrammtypen*

1. **Einfaches Balkendiagramm** - Lineare Farbskala von weiß (niedriger Wert) zu blau (hoher Wert), passt sich den ausgewählten Spalten an. Ausgewähltes Jahr im Titel.
2. **Gruppiertes Balkendiagramm** - Spektrale Farbskala für jede ausgewählte Tabellenzeile, gruppiert nach Gebieten. Ausgewähltes Jahr im Titel.
3. **Liniendiagramm (unskalierte Y-Achse)** - Y-Achse beginnt bei 0. X-Achse zeigt alle Jahre. Spektrale Farbskala für jedes Gebiet.
4. **Liniendiagramm (skalierte Y-Achse)** - Y-Achse beginnt beim höchstmöglichen sinnvollen (wenn möglich ganzzahligen) Wert.
5. **Tooltip** - Mousehover über dem Diagramm zeigt stets den jeweiligen Wert sowie das Gebiet an.
6. **Diagramm herunterladen** - Über das Kontextmenü kann jedes Diagramm als Raster- oder Vektorgrafik heruntergeladen werden.

### Zeitstrahl

![Abbildung 20 - Zeitstrahl](https://user-images.githubusercontent.com/79461871/127782381-34f5d21b-c758-4408-9fcb-e9a15f69b0d4.JPG)

*Abbildung 20 - Zeitstrahl*

1. **Zeitstrahl** - Über den Schieberegler können die Jahre durchgeschaltet werden.
2. **Play-Button** - Über den Play-Button läuft die Animation der Jahresdatensätze in Schleife.
3. **Balkendiagramm** - Das Balkendiagramm zeigt die aktuellen Werte für das ausgewählte Jahr an; Referenzgebiete und berechnete Werte werden ignoriert.
4. **Farbkodierung** - Die aktuellen Werte werden in der Karte mit derselben Farbskala angezeigt.
5. **Zeitstrahl löschen** - Mit dem Löschen des Zeitstrahls oder der Erstellung eines Neuen wird auch die Karte bereinigt.

*Hinweis: Im gegenwärtigen Entwicklungsstand funktioniert der Zeitstrahl nur für existierende StaNord-Daten und nicht etwa für eigene Berechnungen.*

### Verhältnisse berechnen
Über das Kontextmenü können zwei beliebige Spalten zum Verrechnen bzw. Korrelieren ausgewählt werden.

![Abbildung 21 - Eigene Berechnungen in die Tabelle schreiben](https://user-images.githubusercontent.com/79461871/127782377-39b939be-306c-4888-a681-868f5e925b98.JPG)

*Abbildung 21 - Eigene Berechnungen in die Tabelle schreiben*

1. **Zähler / Y-Achse auswählen** - Der Datensatz, welcher bei Verhältnissen über dem Bruchstrich, bei Korrelationsdiagrammen als Y-Wert aufgetragen wird. Eine erneute Auswahl überschreibt den bisherigen Wert.
2. **Nenner / X-Achse auswählen** - Der Datensatz, welcher bei Verhältnissen unter dem Bruchstrich, bei Korrelationsdiagrammen als X-Wert aufgetragen wird. Eine erneute Auswahl überschreibt den bisherigen Wert.
3. **Auswahl aufheben** - Die aktuelle Auswahl zurücksetzen.
4. **Aktuelle Auswahl** - Ihre aktuelle Auswahl wird mit Geteilt-Zeichen („/“) über der Tabelle und im Kontextmenü aufgeführt.
5. **Verhältnis berechnen** - Teilt jeden Tabelleneintrag (Gebiet und Jahr) des Zähler-Datensatzes durch den jeweils dazugehörigen des Nenner-Datensatzes. Die Ergebnisse werden der Tabelle angefügt.
6. **Korrelationsdiagramm erstellen** - (s. Korrelationsdiagramm).
7. **Eigene Berechnungen** - Der neue Datensatz ist in der Tabelle unter der Gruppe „Berechnungen“ zu finden. Er kann wie alle anderen Datensätze auch für neue Diagramme verwendet werden, es kann nach ihm gefiltert werden und er kann mit der Tabelle als XLSX heruntergeladen werden. Einzige Ausnahme bildet der Zeitstrahl (s. Zeitstrahl)

*Hinweis: Gegenwärtig sind eigene Berechnungen nicht wie die ursprünglichen StaNord-Daten in der Karte darstellbar.*

### Korrelationsdiagramm

![Abbildung 22 – Korrelationsdiagramm](https://user-images.githubusercontent.com/79461871/127782374-4ac55179-ba0e-483c-ad8f-b2aed9ea6f6a.JPG)

*Abbildung 22 – Korrelationsdiagramm*

1. **Werte** - Für die ausgewählten Datensätze (X-Achse, Y-Achse) werden die Werte aller Jahre und Gebiete übereinander aufgetragen. Dabei repräsentiert jede Farbe ein Gebiet / eine Tabellenspalte und jeder Punkt ein Wertepaar eines Jahres.
2. **Tooltip** - Der Tooltip zeigt für jeden Punkt Gebiet, X-Wert, Y-Wert und Jahr an.
3. **Regressionsgerade**
4. **Korrelation (Pearson) / Kovarianz**

*Hinweis: Das Korrelationsdiagramm macht keine Aussage über Kausalität und berücksichtigt keine anderen Variablen. Des Weiteren werden die Werte nicht weiter gewichtet und Ausreißer können das Bild verzerren. Um die Aussagekraft des Diagramms zu stärken wird empfohlen, eine große Zahl von Gebieten auszuwählen bzw. die Gebietsauswahl durch „Vergleichbare Gebiete“ anhand bestimmter Parameter einzuschränken.*

### Ergebnisse
Alle Ergebnisse anderer Werkzeuge können ins Dashboard übertragen werden. Sie werden dort als Widgets dargestellt und bleiben auch nach Wechsel der Gebietsauswahl erhalten. Enthalten sie Namen von Einrichtungen oder Gebieten, kann per Klick auf diesen zu dem Objekt in der Karte gezoomt werden.
