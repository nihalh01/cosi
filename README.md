<h1 align="center">CoSI</h1>
<h1 align="center">Cockpit Urban Infrastructures</h1>
<h4 align="center">GIS + data based analysis & planning tools in the Hamburg city administration</h4>
<br></br>

## User manual

<h7>2nd phase (further development)</h2>
<h7>Version 2.0</h2>
<h7>For internal use</h2>

### Authors
Daniel Schulz, HafenCity University Hamburg, Sebastian Duden, State Office for Geoinformation and Surveying Hamburg
Ogeigha Koroyin, HafenCity University Hamburg
Nicola Stradtmann, HafenCity University Hamburg
Johanna Fleischer, Hafen City University
Yuxiang Zhang, HafenCity University Hamburg

### was standing
06/17/2021

### Keywords
GIS, Dashboard, Data-Driven Urban Planning, Social Infrastructure, Urban Data Platform, Data Visualization, Planning Support Tools, Demand Driven Decision Making

### Together-version
In urban and social infrastructure planning, decision-making processes in public administration are often characterized by lengthy procedures and a fragmented database. This implies that requirements are identified too late, or the time-consuming process of obtaining information delays the planning specification.
<br></br>
This manual describes the *Cockpit Urban Infrastructures* for Hamburg as a digital analysis and planning tool, which uses an easily accessible user interface to bundle, visualize and integrate statistical and geo-referenced data in order to identify planning needs and accelerate planning processes.
<br></br>
For this purpose, the *Urban Data Platform* of the City of Hamburg used the database structures built up by the City of Hamburg to establish a map-based web application. It provides the city's social space planners with a set of analysis functions to identify socio-demographic correlations at the administrative level of statistical areas, identify trends, and determine relationships between existing infrastructure supply and relevant target groups. In the following, the tool should help to find locations and potentials for the development of infrastructure. The results of these analyzes can be visualized directly from CoSI and used as a basis for decision-making and discussion. The workflow follows a three-stage logic from the visualization of data through analysis.
<br></br>
A series of stakeholder and user story workshops were previously held starting in summer 2018 with members of the Hamburg administration at various levels to establish the technical and content requirements of the initialization project. Later, CoSI was developed in August 2019 in an agile process, based on the SCRUM method by an interdisciplinary team from HCU Hamburg and LGV Hamburg. It was available to the socio-spatial planners of Hamburg North as a pilot in the internal administration network from January 28, 2020, to May 2020. In mid-2020, the procedure was transferred to productive operation after successful evaluation and has already been available to several thousand employees. The further development project launched on February 1, 2021, aims to improve existing functions and integrate new ones. In particular, this includes the "look ahead" through the development of a simulation function.


# Contents
- [Data model & infrastructure](#data-model--infrastructure)
  - [Regional statistical data](#regional-statistical-data)
    - [Technical data](#technical-data)
    - [Analysis](#analysis)
    - [Presentation](#presentation)
    - [Geospatial services](#geospatial-services)
    - [WMS](#wms)
    - [WFS](#wfs)
- [Modules](#modules)
  - [Overview](#overview)
  - [Themes (layers)](#themes-layers)
  - [Accessibility](#accessibility)
  - [Analysis](#analysis-1)
    - [Resident query](#resident-query)
    - [Accessibility analysis](#accessibility-analysis)
    - [Filter](#filter)
    - [Supply analysis](#supply-analysis)
    - [Comparable areas](#comparable-areas)
  - [Simulation](#simulation)
  - [Services](#services)
    - [Second window](#second-window)
  - [Area selection](#area-selection)
  - [Map analysis of regional statistical data](#map-analysis-of-regional-statistical-data)
  - [Dashboard](#dashboard)
    - [Structure (technology)](#structure-technology)
    - [InfoScreen](#infoscreen)
    - [Widgets](#widgets)
    - [The Context menu](#the-context-menu)
    - [The Overview table](#the-overview-table)
    - [Context functions](#context-functions)
    - [Diagrams](#diagrams)
    - [Time beam](#time-beam)
    - [Calculate ratios](#calculate-ratios)
    - [Correlation diagram](#correlation-diagram)
    - [Results](#results)
# Data model & infrastructure
CoSI is essentially based on the superimposition of regularly updated regional statistical characteristics of individual area levels, which are supplied by the Statistikamt Nord (Statistical Office North) for Hamburg and Schleswig-Holstein (StaNord) and various specialist data from the various authorities such as the digital green plan (BUKEA) or the public schools (BUE). It intends to do more than just ensure that the data records are displayed next to and on top of each other on the map and table. The aim is to integrate and interact with the data while making connections and interactions between different datasets tangible for the users. On the other hand, CoSI allows users to "intervene" in the data sets, i.e., filter, search, or "manipulate" them. The real-time change of data records in the running program (see simulation) is currently being developed and implemented in the ongoing project.
## Regional statistical data
The StaNord data is available for all administrative levels of the FHH (statistical area, city districts, boroughs, and the entire city). Depending on the level, they include over 60 indicators, which are divided into the categories
-	Population
-	Surface
-	Households
-	Social security obligations
-	Unemployed
-	SGB II benefits
-	Basic security in old age
-	Living
-	Traffic

structure (for a precise list, see appendix). These data sets contain time series, which are recorded from approx. 2012 (depending on the data set) and are expanded annually.

*Note: For reasons of data protection law, the data provider filters those data sets which, in the case of sensitive data, could be traced back to single individuals.*

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

**Features loader**
>All StaNord data, like all other specialist data, are provided by geospatial service. The example above shows that the data structure provides each data record as a separate data object (feature) for each geographical area and administrative level. Each feature is also linked to its geographic geometry. In other words, it is not possible to load a single feature with all the data records, but the request must be made individually for each indicator. The Features Loader is the CoSI-specific module that requests the collected datasets from the server during the area selection, excluding the geometry (for performance reasons). It links these within the application with the area shown on the map.
### Technical data
The technical data sets, which are and can be integrated into CoSI, are provided as geospatial services by a wide variety of data owners, i.e., primarily public authorities, but in principle also private companies, real-time sensors, etc. They are accessed in CoSI as in the FHH Atlas via the URL of the respective service. Many of the data sets in their edited form emerged from the negotiation and coordination processes of the Urban Data Hub, through which the authorities and data holders of the FHH agree on common standards and regular publications.
### Analysis
Analysis data are all those data sets integrated (as WFS, see geospatial services) that have been configured for use with the CoSI analysis (and in future simulation) tools. In other words, each object (feature), e.g., daycare center or green space, is stored individually and can be viewed with its geographical position and extent.
### Presentation
Representation data are selected data sets from the FHH network in consultation with the specialist planners, which are visualized on the map by the underlying geoportal (master portal) and provided with a legend. The data record for the respective coordinate can be called up from the data record by a click. In contrast to the analysis data, the display data are currently not available as individual objects but rather as a tiled/rasterized image (WMS, see geospatial services).
### Geospatial services
The providers hold all data presented in CoSI and the FHH-Atlas as a service. The service delivers data records from the respective database in a machine-readable format via an URL. The request can be specified or limited (e.g., to a geographical section) via additional parameters.
### WMS
A WMS (Web Map Service) delivers geodata/maps as raster images (PNG), which are initially displayed on the map without background information. At the same time, the legend of the data record or information on a specific coordinate can be called up via further requests.
### WFS
In contrast to the WMS (Web Feature Service), which does not provide a finished map view but a raw data object, in which the data set of each geographical object (e.g., point, line, and area) including its attributes (e.g., a school including its type of school, its number of students, email address and afternoon offer). The visualization (styling) of the data is done using predefined or supplied configurations within the application. This is more computationally intensive for the user and less controllable on the part of the data provider; however, it offers the possibility to interact directly with the objects within the portal or change them.

# Modules
CoSI, as the instance of the master portal, is made up of several subjects and data-specific modules as typical in contemporary (web) development and described in the Structure chapter.

CoSI offers various modules, some of which are taken from the Master Portal, the others are CoSI-specific. Below is an overview of the tools in two categories:

**1.	CoSI-specific**
1. Analysis:
   1. Map visualization of regional statistical data
   2. Dashboard
   3. Facility overview (in development)
   4. Accessibility analysis
   5. Select area
   6. Identify comparable areas
   7. Supply analysis
1. Simulation: (in development)
   1. Scenario Manager
   2. Scenario Builder
   3. Neighborhood-Builder
1. Services: 
   1. Switch mousehover on / off
   2. Open the second window
 
**2.	Tools adopted from the Master Portal**
1. Analysis:
   1. Resident query
   2. Filter
   3. File import drawings
   4. Measure distance / area
   5. Drawing and writing
1. Services:
   1. Print map
   2. Save session
   3. Add WMS 
    
**Adjustments**
>In some cases, the tools from the master portal had to be slightly adapted to ensure stability within CoSI and increase the benefit. For example, with the “Print map” tool, unlike in the master portal, individually styled map elements are also output, for which there was no need in the master portal. Additional tools such as “Filter” and “Resident Survey” have been adapted or expanded to increase their usability in CoSI. With the filter, a list of results is generated and can be transferred to the dashboard (push). The resident query was integrated into the accessibility analysis and thus enabled an address-specific query of the number of residents for a generated catchment area. Various other adjustments (also purely cosmetic) to the UI also flow back from CoSI into the core architecture of the mast portal.

## Overview

![Illustration 1 The CoSI UI](https://user-images.githubusercontent.com/79461871/127781976-c7617966-f82d-4389-99ae-2c3affaecba5.JPG)

*Illustration 1: The CoSI UI*

1. **Topic tree / topic layer** (see topics)
2. **Analysis functions** (see analysis)
3. **Simulation functions** (not yet available)
4. **Services** (see services)
5. **Legend** (see legend)
6. **Dashboard** (see dashboard)
7. **Area selection** (see area selection)
8. **Contact form** - Requests, comments, comments and error reports can be sent directly to the project team or the technical control center 
9. **Search bar** - You can search for locations, addresses, B-plans, as well as active features (day care centers, sports facilities, etc.) in the map
10. **Tool window** - Active tools are displayed in the movable window
11. **Sidebar** - The dashboard and the filter are displayed in the sidebar, which remains open even when other tools are used. The width of the sidebar can be adjusted. (see dashboard)
12. **Zoom in**
13. **Zoom out**
14. **Focus on the selected area**
15. **Map visualization of regional statistical data / control element****
16. **Tooltip (mouse hover)** - Displays the area and other items under the mouse pointer. Can be deactivated under "Services" via "Switch mouse hover on / off".
17. **Selected areas** - Selected areas are shown with a blue border.

*Note: The simulation function has not yet been activated.*

*General note: Each (CoSI-specific) module offers a help button (question mark symbol) with information and explanations. Wherever possible and necessary, all elements are provided with explanatory tooltips, which appear when the mouse pointer pauses briefly over the element.*

## Themes (layers)
Layers can be switched on or off at any time from the “Themes” tab. However, when connecting, it must be taken into account that the loading times can be correspondingly longer if no planning area has been specified beforehand, as the data must then be loaded for the entire Hamburg area. The topics are sorted under technical data.

The topic tree is divided into background maps, a catalog of specialist data and the current selection of map levels.

![Illustration 2 - The topic tree](https://user-images.githubusercontent.com/79461871/127782065-9d6d1017-3096-4861-9f71-60ce9f046969.JPG)

*Illustration 2: The topic tree*

1. **Background maps** - Layers such as "City Map Hamburg", which are automatically active by default. If necessary, the "DOP 2 aerial maps" layer can also be activated. They can also be deactivated.
2. **Technical data** - 
	 - **Analysis / Simulation** - The prepared layers for CoSI-specific tools (provided as WFS, see glossary). The individual data layers are divided into categories that are regularly adapted or updated.
	 - **Presentation** - Data for pure "display" in the map, mainly taken from the FHH Atlas (provided as WMS). 
3. **Selected topics** - The active layers can be moved in their order and made transparent
4. **Layer info** - The legend and metadata of the specialist data layer can be displayed via the info button. This includes a description of the topic, the date of publication and the URL of the relevant service. The function is the same for all FHH geoportals.

The topics contain information that is represented symbolically or by areas on the map. In Figure 4, for example, the red dots represent the existing daycare centers in the area, while the purple lines represent areas that belong to the development plans layer.  

A legend on the active topics can be displayed by clicking on the "Legend" tab. Independently of this, further information on the respective topic can be called up by clicking on the info button to the right of the layer. Information such as a brief description of the topic including the data status and a legend on the topic are displayed. There are also links to download sources and a WFS or WMF address behind the info button.  

Clicking on an object on the map opens an information panel for the current selection (sports facility, daycare center, etc.). Information about the object is displayed on the information board. Data relevant to data protection (personal) are not displayed.  

It is possible to adjust the order and the transparency of the active layers: Under "Selected topics" there is an info button and a setting wheel for each selected topic. A click on the wheel opens the setting options for order and transparency.

## Accessibility

Various aids have been created in CoSI to make it easier to read.

![Illustration 3 - Help with accessibility](https://user-images.githubusercontent.com/79461871/127782088-89e677aa-6351-45ce-abf8-fed9a79ad37a.JPG)

*Illustration 3 - Help with accessibility*

1. **Integration of a new chart library** - I.a. retrievable via the map visualization of regional statistical data. Basically applies to all functions / services that offer charts.
2. **Improve readability**  the chart diagrams / evaluations - Choice between bar and chart diagrams
3. **Change view** - Two options can be selected: thick or thin area boundaries
4. **Tool tips** - Tool tips have been integrated into all new tools. The tips can be called up via the question marks that become visible when you move the mouse over the window.
5. **Emphasis on clustered facilities** - Several facilities that are close together are displayed as a “cluster” with a single symbol and the number of facilities at the location (see below).

![Illustration 4th - clustered entities](https://user-images.githubusercontent.com/79461871/127782091-a00a9f3a-a35d-4a47-9f88-c909a874ac88.JPG)

*Illustration 4th - clustered entities*

## Analysis

![Illustration 5 - analysis](https://user-images.githubusercontent.com/79461871/127782097-fa359c67-d915-458d-a239-9f44ca22627c.JPG)

*Illustration 5 - analysis*

1. **Facility overview** - Calls up a table overview of the selected facilities and enables individual sorting / filtering as well as an export.
2. **Resident query** - Address-specific query of the population from the StaNord
3. **Accessibility analysis**
   - Accessibility from a reference point
   - Accessibility in one area
4. **Filter** - Filter specialist data (schools, green spaces, etc.) according to parameters
5. **KML import** - Import created and saved drawings
6. **Measure distance / area**
7. **Identify comparable areas** - Select areas in Hamburg according to parameters
8. **Supply analysis** - Determine the relationship between institutions (specialist data) and target groups (StaNord data) in the area
9. **Drawing / writing** - Add and export your own drawings on the map

*Note: The facility overview is not yet activated for production.*

### Resident query
Basically, this function offers the possibility of determining the exact number of residents by drawing a rectangle or circle or by drawing an area. This tool comes from the master portal and has been integrated into the module “accessibility analysis”.

When calling up directly under the "Analysis" tab, the area over which the query is to be carried out must be specified manually (by drawing a rectangle or circle or by drawing an area).

When used within the context of the accessibility analysis, the area does not have to be specified manually, but the calculated catchment area is adopted as the area.

### Accessibility analysis
An accessibility analysis can be carried out in two ways: 1) from a reference point and 2) in the planning area. The mode of analysis can be selected in the dropdown menu.

**Important information:**
This tool was implemented using OpenRouteService, a service developed and provided by the Heidelberg Institute for Geoinformation Technology. Use is covered by the Creative Commons license CC BY 4.0. Further information can be found at: https: // heigit. org / de / ortsbasierte-dienste-und-navigation / https: //openrouteservice.org/services/

**1) Accessibility from a reference point**
Indicates an area that can be reached from a point on the map selected by the user within a distance specified by the user. The distance can be given in time or in meters. Accessibility is calculated based on the means of transport specified by the user. The polygons are automatically adjusted when the mode of transport or other parameters are changed.

The module can be used without first selecting and confirming a planning area. 

![Illustration 6th - Accessibility from a reference point](https://user-images.githubusercontent.com/79461871/127782103-395c5ab3-2ed9-40e0-b9de-cc2c607164ee.JPG)

*Illustration 6th - Accessibility from a reference point*

1. **Reference point** - Any reference point is set on the map.
2. **Define means of transport** - The means of transport is selected from a list. The following modes of transport are currently available: car, bike, bike (electric), walking, wheelchair.
3. **Specify the unit of measurement for the distance** - Specify whether the distance is given in minutes or meters.
4. **Distance** - Enter the distance in a previously defined unit of measurement (minutes or meters).
5. **Info, back to selection, delete polygon** - The Info button contains further information about the module. With the arrow to the left you navigate back to the selection between accessibility from a reference point and accessibility in the area. The polygon can be deleted by clicking on the trash can.
6. **Legend** - A legend is displayed. It is generated dynamically for the heat map and shows three evenly distributed distance values. The maximum value is the previously entered value for the distance.
7. **Facility cover** - Provides all facilities of the active layers that are located within the catchment area (heat map) in a drop-down list. When you click on a facility in the list, the position marker moves to the facility. More information about the facility can be found by clicking the facility.
8. **Zoom** -The heat map is focused in the center.
9. **Inhabitants query for the area** - Carries out an address-specific resident query for the catchment area, which is represented by the polygon.
10. **Polygon** - Shows the area that can be reached from the reference point as a heat map, depending on the previously entered parameters.

**2) Accessibility in the area**
Shows the coverage and accessibility of a previously specified type of facility (e.g. kindergartens) in the specified catchment area (planning area). The catchment area is the distance from the respective facility and can be specified in time or in meters. Accessibility depends on the means of transport specified.

![Illustration 7th - Accessibility in the area](https://user-images.githubusercontent.com/79461871/127782106-b66ef81e-928a-4f1f-87c6-ba404c0d8a18.JPG)

*Illustration 7th - Accessibility in the area*

1. **Select layer** - In order for this module to be used, at least one layer must be active.
2. **Define means of transport** - The means of transport is selected from a list. The following modes of transport are currently available: car, bike, bike (electric), walking, wheelchair.
3. **Specify the unit of measurement for the distance** - Specify whether the distance is given in minutes or meters.
4. **Distance** - Enter the distance in a previously defined unit of measurement (minutes or meters).
5. **Legend** - A legend is displayed. It is generated dynamically for the heat map and shows three evenly distributed distance values. The maximum value is the previously entered value for the distance.
6. **Polygons** - Show the areas that can be reached from the respective facility as a heatmap, depending on the previously entered parameters. The catchment areas calculated in this way can overlap. This module can be used to make visible where gaps arise with regard to the facility coverage in the area. 	

### Filter
The active, selected topics can be searched and filtered according to the categories of their data sets by clicking on the "Filter" tab. The map automatically zooms in on the filter results. Only results in the selected areas are included. The filter is available for all technical data sets that have meaningful filterable attributes (such as area, use, carrier, etc.).

![Illustration 8th - filters](https://user-images.githubusercontent.com/79461871/127782108-14cf240d-948c-48ec-a94d-cb921da9e510.JPG)

*Illustration 8th - filters*

1. **Select a topic in the filter** - The selected topics are displayed. Topics can be added at any time. To do this, click on the topic structure and select the topic.
2. **Filter options:**
   - Several filter options can be selected. The selection is automatically marked with a tick.
   - Slider (from / to): a desired area size can be entered, for example.
3. **The result is displayed immediately when the filter option is selected:**
   - The result is displayed on the map by a symbol or area color. This is displayed by clicking the “Legend” tab. Mousehover shows information field on facility / area.
   - The names of the areas / facilities are displayed in the search results field. By clicking on the names, the selection is marked on the map.
4. **Delete filter:** Individual selection by clicking the red "X" or delete the entire selection by clicking the "Delete all" button.

### Supply analysis
The "Supply Analysis" tool calculates the relationship between two data records. The data sets can either be regional statistical data or facility data from the menu "Topics / Technical data". In order for the supply analysis to be used, at least two data records must have been loaded.

![Illustration 9 - Supply analysis, settings](https://user-images.githubusercontent.com/79461871/127782111-691aff4e-ece2-4c1c-a259-a5760bae1886.JPG)

*Illustration 9 - Supply analysis, settings*

The individual functions of the tool are explained in detail below:
1. Use the button to open this auxiliary window.
2. You can use the button to switch between facility and regional statistical data sets.
3. Use the Select field to select one of the loaded data records.
4. For facility data sets, you can specify a factor (F) that determines how many units of the selected facility are required for the reference data set. For example, if you want to calculate the number of public schools against the number of the population under 18 and give a factor of 0.001, this would mean that one school is required for every 1000 members of the reference group. If a factor (F) is given, the columns "Capacity" and "Demand" are also given in the calculation table. 
5. Some facility records have parameters other than just their number in the selected areas. In public schools, for example, you can query the data record "number of students" or in hospitals the number of stationary places. Not every setup record has additional parameters.

![Illustration 10 - Care analysis, results](https://user-images.githubusercontent.com/79461871/127782114-ee7c35c1-ea8f-4e5a-a7e5-edab2f15c2b1.JPG)

*Illustration 10 - Care analysis, results*

1. **Result** - Results are shown in a table including the total value, as well as in the map, color-coded according to the value.
   - Area
   - Facility: The total number of facilities or the selected parameter of facilities in the area (e.g. m² playground).
   - Target group: The number of people in the (combined) target group in the area.
   - Capacity: The number of people who can take care of the facilities, according to factor F.
   - Requirement: The value of the parameter of the facilities that would be necessary for the number of people in the area, according to factor F.
   - Relationship: The simple relationship between facilities (number or parameters) and (combined) target group in the area.
   - Undersupply / oversupply: The coverage in percent, ie the ratio between capacity and (combined) target group in the area. If no factor F was selected, the column shows the direct relationship between institution and target group.
2. **Total / average** - Total and average values are determined for the selected areas. The total value is calculated from the sum of all facility and target group values. The average value is the arithmetic mean of the selected areas.
3. **Download as XLSX or GeoJson** - The above table can be downloaded as an XLSX file or as GeoJson for further processing in e.g. MS Excel or QGIS.
4. **Show in dashboard** - The results table can be transferred directly to the dashboard for later use.

### Comparable areas
The tool allows the determination of all areas (city districts or stat. Areas) in which the selected parameters predominate, or those which are similar to the selected reference area in these parameters.

![Illustration 11 - Comparable areas](https://user-images.githubusercontent.com/79461871/127782118-05befeba-3d13-4c8b-b7d5-71ffdb6186d0.JPG)

*Illustration 11 - Comparable areas*

1. **Statistical data filters** - Select the desired parameter for the comparison. Any number of parameters can be added. All StaNord data sets are available for this. However, proportional values are more suitable for comparability. At present, you cannot use your own calculations from the dashboard.
2. **Reference area** - Optionally, one of the selected areas can be specified as a reference area.
3. **Parameter settings** - The parameter settings show the current data set (year min. And max. Value of all Hamburg areas, the reference value (freely selectable or of the reference area), as well as the tolerance upwards and downwards. The tolerance interval is either in absolute numbers or in percent for proportional Values given.
4. **Results** - The areas that apply are marked on the map.

![Illustration 12th - Comparability, results](https://user-images.githubusercontent.com/79461871/127782119-559aeaa9-db60-4b6b-ade6-e71944e5849b.JPG)

*Illustration 12th - Comparability, results*

1. **Results** - All areas to which the selected criteria apply are listed here. A click on an area defines the map section for this area.
2. **Set as area selection** - The current area selection can be set to the result areas for further analysis via Set selection.
3. **Show in dashboard** - The list of results can be transferred to the dashboard without changing the area selection.

## Simulation
A first simulation function was developed. As soon as this has been transferred to production, step-by-step instructions will follow at this point.

## Services

![Illustration 13th - Services](https://user-images.githubusercontent.com/79461871/127782123-8623f992-a44b-4e13-b1b9-8c38ee1f0be2.JPG)

*Illustration 13th - Services*

1. **Print map** - Print the current map section including active layers.
2. **Switch mousehover on / off** - (De-) activate the tooltip that is displayed on the map at the mouse pointer.
3. **Save session** - Save the current session with active data, selected areas and filters as a URL. The card status can be reproduced via the URL. *Note: Manually added map services (WMS) and calculations made are not retained. Saving all work results is part of the ongoing development project.*
4. **Add WMS** - Any other map services can be integrated from the FHH Atlas or other sources via the web address (URL) of the service. The URLs can be found, for example, in the metadata catalog of the FHH or the geoportal under the info button in the topic tree (see topic tree).
5. **Open the second window** - s. Second window

### Second window
You can open a second browser tab with the dashboard via the "Services" / "Open second window" tab. All functions are available to you there as in the original window. You can detach the second window from your browser by dragging the tab (tab) to move it to a second screen. If the InfoScreen (second window) is open, you can no longer open the dashboard in the main window. If you close the window, the dashboard returns to the main window.

## Area selection
When you start CoSI, a frame of reference is first established and a planning area is compiled and confirmed.

![Illustration 14th - The Select Area tool](https://user-images.githubusercontent.com/79461871/127782128-ff5de021-c244-40cd-bb04-6092034df218.JPG)

*Illustration 14th - The "Select Area" tool*

1. **Choose frame of reference** - "Districts", "City districts" or "Statistical areas" can be selected via a drop-down menu - the administrative unit for which the statistical data is to be displayed and evaluations to be created. All functions are available on the respective area levels. However, the number of indicators available may vary. The frame of reference also determines the superordinate reference areas to be loaded: City districts for stat. Areas, districts by districts.
2. **Set buffer** - A buffer radius can be specified for which selected specialist data are displayed around the planning area. This takes into account the fact that the catchment area of a facility does not necessarily coincide with the territorial boundaries of the administrative unit within which the facility is located. The analysis functions are not affected by this.
3. **Confirm selection** - Loads the data for the selected planning area from the server and defines the area for the specialist data to be displayed. An empty selection can also be confirmed. Then no data will be loaded and specialist data will be displayed for the entire city area. (see below)
4. **Reset selection** - Resets the current planning area. In direct A new planning area can then be compiled and confirmed.
5. **Draw a selection rectangle** - A starting point is set and a rectangle is drawn over the relevant area to the end point. All administrative units that lie within the rectangle or on the lines of the rectangle are included in the planning area.
6. **Tool info**
7. **Show and hide additional help levels** - With the help of the checkbox, additional layers can be shown and hidden for orientation. The layer can also be switched on and off via the topic tree. The auxiliary levels currently include the “social spaces” and the “RISE support areas”.
8. **Select and deselect areas** -
	 - Click on the individual administrative units (statistical area or district) (clicking again deactivates the selection), the boundaries are marked in blue. 
	 - Click on the pen to the right of “Reset selection”. A drawing tool is activated; This allows the user to draw a rectangle over the selection area in order to select it.
	 - Both options described above can also be combined with one another, the order being irrelevant. The users can therefore first select individual administrative units and then activate the drawing tool in order to add additional administrative units or to proceed the other way round.

The defined planning area can be adjusted at any time; the area can be expanded (both by clicking and using the drawing tool), reduced (by clicking marked administrative units can be deselected) or completely reset (by clicking on “Reset selection”).

A planning area does not always have to be defined first in every context of use; Certain analysis tools such as the "Accessibility Analysis" and "Comparable Areas" can be used without specifying an area beforehand.

The following information applies to such cases:
1.	No data records are loaded, ie it is not possible to display the regional statistical data. Regional statistical data are also not displayed in the dashboard.
2.	When adding topics from the specialist data, the loading process could take longer
3.	The availability analysis may not work reliably for a very large number of facilities.

## Map analysis of regional statistical data
In addition to the technical data layers, the basis of all CoSI analysis functions are the data records of the StaNord database, which are available as time series for the various administrative units (see Sect. Regional statistical data). These can be visualized directly and dynamically on the map for the selected planning area. The color scaling and legend are generated dynamically from the selection. The most recent data set is always displayed.

The tool for visualizing regional statistical data enables the selection of regional statistical data sets that are available for the selected districts. It can only be used if areas have already been selected using the area selection tool. The tool can visualize the selected data sets on the map and generates a dynamic legend. Furthermore, data sets for several years can be selected and, if desired, animated in consecutive order.

![Illustration 15th - Window for map analysis of statistical data](https://user-images.githubusercontent.com/79461871/127782132-cc308d4a-a00a-4422-bcdd-0a75c6321f15.JPG)

*Illustration 15th - Window for map analysis of statistical data*

The individual functions of the tool are explained in detail below:
1.	The tool window can be minimized using the button.
2.	The map visualization can be shown and hidden again using the button.
3.	With the forward and back buttons, the regional statistical data sets can be switched through fluently.
4.	The year for which the regional statistical data set is visualized. The most recent available year is selected by default.
5.	Here you can select a year for comparison. The percentage difference to the first selected year is then also shown on the map.
6.	The selection field for the available regional statistical data sets. StaNord data sets Allows the relevant regional statistical data sets for the selected areas and the reference scale to be switched through and these to be displayed on the map with a color scale. The selection always shows the latest available data.
7.	The legend for the color visualization of the map. If you hover the mouse over one of the markers, the value of the associated, selected area is displayed. The lowest and highest values are also shown on the right and left.
8.	Use the button to open this auxiliary window. 
9.	With the play button you start the animation of the data sets for all available years. In the adjacent field you can enter a value that indicates how quickly the individual animation steps are run through (in seconds).
10.	Loads the current data into the visualization tool and creates a graph there.
11.	You can use the button to show and hide the names of the selected areas on the map.

## Dashboard
The dashboard forms the "heart" of the analysis functions in CoSI. All evaluations of the map-based tools as well as the underlying data sets come together here. It always shows the city as a whole, the selected statistical areas and the associated reference areas (of the higher-level administrative unit) with all StaNord characteristic data in tabular form and houses a number of statistical analysis tools such as diagrams, correlations or ratio formation. In addition, the evaluation results of all other CoSI modules can be displayed in the dashboard and used here for further evaluations or displays.

![Illustration 16 - Dashboard overview](https://user-images.githubusercontent.com/79461871/127782139-9508d8ac-0202-46db-8f35-f7375845ea31.JPG)

*Illustration 16 - Dashboard overview*

1. **Dashboard**
2. **Widget**(see widgets)
3. **Zoom in / out**
4. **Shut down**

### Structure (technology)
According to its basic function, the dashboard is a freely configurable work environment that can be configured as freely as possible both for your own work and for the visualization and presentation of the results (more on this under InfoScreen and Outlook). According to its structure, the Dashboard is completely ignorant of the content that is presented on it. So it is conceivable to expand it at will in future development steps.

Using a simple, preconfigured function, content from other modules can be transferred to the dashboard and displayed there as a new widget.

### InfoScreen
You can open a second browser tab with the dashboard via the "Services" / "Open second window" tab. All functions are available to you there as in the original window. You can detach the second window from your browser by dragging the tab (tab) to move it to a second screen. If the InfoScreen is open, you can no longer open the dashboard in the main window. When you close the window, the dashboard returns to the main window.

### Widgets
A widget is an isolated window / field within the dashboard that can accommodate any content and functions. Widgets can (if not configured otherwise) be scaled, moved, minimized and deleted. They are retained (persistent) even if the user closes the dashboard or changes the area selection. They can also be managed decentrally (on the code side) from anywhere in CoSI.

All widgets (with the exception of the overview table) can be deleted using the "Reset dashboard" button at the bottom of the dashboard.

*Note: With the exception of the overview table, currently open widgets are not automatically transferred when the InfoScreen is opened.*

![Figure 15 - Widget + context menu (e g  diagram)](https://user-images.githubusercontent.com/79461871/127782154-e1046e45-7c77-4d66-b84e-5f821890d9fc.JPG)

*Figure 15 - Widget + context menu (e.g. diagram)*

1. **Title (move)** - By clicking and dragging, the widget can be dragged to another location on the dashboard and the order of the widgets can be changed.
2. **Minimize** - The widget can be minimized and made available for later use.
3. **Clear** - The widget can be deleted at any time. The data will then be lost. Only the overview table will be rebuilt the next time the dashboard is opened.
4. **Zoom in / out** - Widgets can be enlarged and reduced; The extent to which this is possible depends on the content.
5. **Context menu**

### The Context menu
All more in-depth interactions with the contents of the dashboard or widgets take place via a context menu, which is called up by right-clicking on an element. Which functions are available depends on the respective element. If no functions are available on an element, the context menu does not open. Context functions are currently implemented in the summary table and the diagrams.

### The Overview table
By default, the table is the first widget that is automatically displayed when the dashboard is opened. The table shows all indicators of the StaNord data for the selected areas as well as the associated reference areas of the next larger administrative unit i.e, the respective city districts at stat. Areas and the districts in districts. All data sets are grouped by topic and contain continuous time series, which are expanded annually (see p.regional statistical data). In addition, calculated average and total values for the original selection are shown.

The table shows all indicators of the StaNord data for your selected areas. In addition, you will see 

**Calculations**
>The reference areas are not included. Also, only total and average values are calculated for absolute and not for proportional values, since the reference values are not clear and can therefore lead to incorrect calculations. For example, the “proportion of the population with a migration background” refers to the “total population”, “Proportion of women 15 to under 65 years of age who are subject to social insurance contributions”, however, to the absolute number of women between 15 and 65 who, in this form, at the StaNord- Data is not available as a data set. Theoretically, referencing the reference data record in the database is conceivable. However, this is a data issue that must be decided in coordination between UDH and StaNord in future development steps.

The associated reference areas of the next largest administrative unit as well as calculated average and total values for your selection (the reference areas are not included).
You can zoom in on an area name on the map by clicking on it. You can move or hide table columns. Hidden columns are not taken into account when creating a diagram. 

In the context menu you can 1) create diagrams from table columns or 2) offset table rows with one another (form quotients). The calculation results are added to the table as a new line for all years and areas. You can select multiple rows in the table for grouped diagrams using a check box or pressed the CTRL key.
The table can be filtered using the selection field (top right). The original and the filtered table can be downloaded as an XLSX file.

Please note: In regional statistical areas with less than 100 inhabitants or a category with fewer than 10 individual persons, no value is given for data protection reasons. This can lead to unwanted outliers and misrepresentations when creating diagrams.

The table can be filtered using the selection field (top right). The original and the filtered table can be downloaded as XLSX (see Download XLSX). By clicking on an area name, the map zooms in on it.

Table columns can also be moved or hidden. When creating a diagram, the order of the areas shown (in the case of bar charts) depends on the selected column order. In turn, hidden columns are not taken into account when creating the diagram.

*Note: At present, columns with numerical names (stat. Areas) cannot be moved, but are always shown in the table on the left in ascending order of their numbers.*

### Context functions
In the context menu you can 1) create diagrams from table columns or 2) offset table rows with one another (form quotients). The calculation results are added to the table as a new line for all years and areas. You can select multiple rows in the table for grouped diagrams using a check box or pressed the CTRL key.

Please note: In regional statistical areas with less than 100 inhabitants or a category with fewer than 10 individual persons, no value is given for data protection reasons. This can lead to unwanted outliers and misrepresentations when creating diagrams.

![Illustration 17th - Context functions summary table](https://user-images.githubusercontent.com/79461871/127782168-6df58d11-5f69-4b07-b9fd-0b0671fa3ef5.JPG)

*Illustration 17th - Context functions summary table*

1. **Diagrams** - Create diagrams from the selected data set. Bar charts can also be created for multiple indicators as grouped bar charts. The results are displayed as a widget at the bottom of the dashboard.
2. **Selection** - Two data sets for the formation of ratios / correlations. The selection made is displayed above the table and under "Own calculations".
3. **Own calculations** - Create calculations from the previous selection. In the case of ratios, the numerator values are divided by the denominator values every year. In correlation diagrams, the Y values for all years are plotted against the X values.

### Download XLSX
The overview table can be downloaded as an XLS file for further processing in MS Excel. The table can be created using the buttons at the end of the table. You can choose between unfiltered and filtered XLSX.
1. The table can be downloaded either unfiltered or filtered.
2. Own calculations are included.
3. The order of the columns can be changed by the user in the dashboard.
4. Columns are excluded by hiding.


### Diagrams
In principle, the following diagram types can be displayed in the current version of the CoSI dashboard: 
1. **Bar graphs** - For a selected year, also grouped for several data sets (see Fig. 17).
2. **Line charts** - For one data set over all years.
3. **Time beam** - Animated bar charts for all years, color coding in the map (see timeline).
4. **Correlation Charts (Scatter Charts)** - Visualization of any data set (Y-axis, ordinate) on top of another (X-axis, abscissa) (see calculate correlation).

![Illustration 18th - Select data for charts](https://user-images.githubusercontent.com/79461871/127782171-d2627104-9c30-4549-9a57-0c584dd7469a.JPG)

*Illustration 18th - Select data for charts*

1. **Select multiple rows (grouped bar charts)** - Several lines of the table can be selected for grouped bar graphs using the check box or by pressing the CTRL key (see below). Does not work for line charts for the sake of clarity. The order of the selection determines the order of the bars in the diagram.
2. **Select year for bar chart** - A message is displayed if no data record is available. The last year from the current date is always preset. Confirm by clicking on "Create for".
3. **Axis scaling for line charts** - 
	 - Unscaled axes: The Y-axis starts at 0
	 - Scaled axes: The Y-axis starts with the next sensible (if possible integer) value below the lowest value.

*Note: The order of the columns determines the order in the (bar) diagrams. Records from hidden columns are not displayed.*

![Illustration 19th - Chart types](https://user-images.githubusercontent.com/79461871/127782198-55074d19-3099-4097-a097-f0784d61e10d.JPG)

*Illustration 19th - Chart types*

1. **Simple bar graph** - Linear color scale from white (low value) to blue (high value), adapts to the selected columns. Selected year in the title.
2. **Grouped bar graph** - Spectral color scale for each selected table row, grouped by area. Selected year in the title.
3. **Line chart (unscaled Y-axis)** - Y-axis starts at 0. X-axis shows all years. Spectral color scale for each area.
4. **Line diagram (scaled Y-axis)** - Y-axis starts at the highest possible meaningful (if possible integer) value.
5. **Tooltip** - Mousehover above the diagram always shows the respective value and the area.
6. **Download diagram** -Each diagram can be downloaded as a raster or vector graphic using the context menu. 

### Time beam

![Illustration 20th - Time beam](https://user-images.githubusercontent.com/79461871/127782204-49798778-530a-4497-89ab-a14edd132aa1.JPG)

*Illustration 20th - Time beam*

1. **Time beam** - The years can be switched through using the slider.
2. **Play button** - The animation of the annual data sets runs in a loop via the play button.
3. **Bar graph** - The bar chart shows the current values for the selected year; Reference areas and calculated values are ignored.
4  **Color coding** - The current values are shown on the map with the same color scale.
5. **Delete timeline** - When the timeline is deleted or a new one is created, the map is also cleaned up.

*Note: At the current stage of development, the timeline only works for existing StaNord data and not for your own calculations.*

### Calculate ratios
Any two columns for calculation or correlation can be selected via the context menu.

![Illustration 21 - Write your own calculations in the table](https://user-images.githubusercontent.com/79461871/127782211-804a96c0-175d-40b2-9e5d-159e9dd6a5f3.JPG)

*Illustration 21 - Write your own calculations in the table*

1. **Select counter / Y-axis** - The data set, which is plotted as the Y value for ratios above the fraction line, for correlation diagrams. A new selection overwrites the previous value.
2. **Select denominator / X-axis** - The data set, which is plotted as the X value in the case of ratios below the fraction line, in correlation diagrams. A new selection overwrites the previous value.
3. **Deselect** - Reset the current selection.
4. **Current selection** - Your current selection is shown with a split symbol (“/”) above the table and in the context menu.
5. **Calculate ratio** - Divides each table entry (area and year) of the numerator data set by the corresponding one of the denominator data set. The results are appended to the table.
6. **Create a correlation diagram** - (see correlation diagram).
7. **Own calculations** - The new data record can be found in the table under the “Calculations” group. Like all other data sets, it can also be used for new diagrams, it can be filtered according to it and it can be downloaded with the table as XLSX. The only exception is the timeline (see timeline).

*Note: At present, your own calculations cannot be displayed on the map like the original StaNord data.*

### Correlation diagram

![Illustration 22nd - Correlation diagram](https://user-images.githubusercontent.com/79461871/127782214-2517e4dd-63de-472c-8fea-4b3372bd69f9.JPG)

*Illustration 22nd - Correlation diagram*

1. **Values** - For the selected data sets (X-axis, Y-axis) the values of all years and areas are plotted on top of one another. Each color represents an area / a table column and each point a value pair of a year.
2. **Tooltip** - The tooltip shows area, X-value, Y-value and year for each point.
3. **Regression line**
4. **Correlation** (Pearson) / Covariance

*Note: The correlation diagram does not make any statements about causality and does not take any other variables into account. Furthermore, the values are not weighted any further and outliers can distort the picture. In order to strengthen the informative value of the diagram, it is recommended to select a large number of areas or to restrict the area selection using "comparable areas" based on certain parameters.*

### Results
All results from other tools can be transferred to the dashboard. They are displayed there as widgets and are retained even after changing the area selection. If they contain names of facilities or areas, you can click on them to zoom to the object on the map.
