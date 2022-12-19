**DistrictSelector**

Mit dem DistrictSelector kann ein Gebiet auf Basis einer Verwaltungsebene (z.B.: Statistisches Gebiet) ausgewählt werden. Für das gewählte Gebiet werden die entsprechenden regionalstatistischen Daten geladen.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiet auswählen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-image|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|districtLevels|ja|Object[]||Beinhaltet die nötigen Informationen der einzelnen Verwaltungsebenen (siehe Beispiel).|
|districtLevels[i].layerId|ja|String||Die Layer id zum jeweiligen Verwaltungslayer.|
|districtLevels[i].label|ja|String||Die/der Bezeichnung/ Name für die Verwaltungsebene.|
|districtLevels[i].keyOfAttrName|ja|String||Der Key für das Attribut in dem der Name der Verwaltungeinheit steht.|
|districtLevels[i].duplicateDistrictNames|nein|String[]||Namen von Gebieten, die Konflikte auslösen. Eimsbüttel zum Beispiel gibt es als Stadtteil und als Bezirk. Die Namen sind bei der höheren Verwaltungsebene anzugeben.|
|districtLevels[i].stats|ja|Object||Definiert URL und den Key des Attributes "Name" für die statistischen Daten.|
|districtLevels[i].stats.keyOfAttrName|ja|String||Key des Attributes "Name" für die statistischen Daten.|
|districtLevels[i].stats.baseUrl|ja|String[]||Die URLs der WFS Dienste für die statistischen Daten.|
|districtLevels[i].stats.metadataUrls|nein|String[]||Die URLs der Metadaten der statistischen Daten.|
|districtLevels[i].stats.featureTypes|nein|String[]||Die featureTypes der WFS Dienste für die statistischen Daten, die zu laden sind, ansonsten werden alle des Dienstes geladen|
|districtLevels[i].activeStyle|nein|Object||Benutzerdefinierte Styles für die jeweils ausgewählte Verwaltungsebene. Entspricht der Hierarchie des OpenLayers Style Definition|
|districtLevels[i].districtNamesMap|nein|Object||Benutzerdefiniertes dictionary zum bereitstellen von synonymen Gebietsnamen|
|districtLevels[i].displayAll|nein|Boolean||Definiert ob alle Gebiete des Levels im Dashboard stets angezeigt werden sollen, egal ob ausgewählt oder nicht|
|additionalInfoLayers|nein|{[key: String]: String[]}|Zusätzliche Info Layer die beim Nutzen des Tools angezeigt werden können. Der Key ist der angezeigte Bezeichner, der Value die Liste an Layer IDs|

**Beispiel**
```
"districtSelector": {
  "name": "translate#additional:modules.tools.cosi.districtSelector.title",
  "districtLevels": [
    {
      "layerId": "6071",
      "label": "Statistische Gebiete",
      "keyOfAttrName": "statgebiet",
      "stats": {
        "keyOfAttrName": "stat_gebiet",
        "baseUrl": ["https://qs-geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Statistische_Gebiete"],
        "metadataUrls": ["http://hmdk.metaver.de/trefferanzeige?docuuid=99687398-CFFE-413E-B966-6B8629D335F5"],
        "featureTypes": [["regionalstatistische_daten_stat_geb"]]
      },
      "activeStyle": {
        "fillColor": [
          255,
          255,
          255,
          0
        ],
        "stroke": {
          "color": "#3399CC",
          "width": 2
        }
      }
    },
    {
      "layerId": "1694",
      "label": "Stadtteile",
      "keyOfAttrName": "stadtteil_name",
      "stats": {
        "keyOfAttrName": "stadtteil",
        "baseUrl": ["https://qs-geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Stadtteile", "https://geodienste.hamburg.de/HH_WFS_Bevoelkerungsprognosen_Stadtteile"],
        "metadataUrls": ["http://hmdk.metaver.de/trefferanzeige?docuuid=F4062BD8-43C4-4C4F-AA45-253D84A3685E"],
        "featureTypes": [["regionalstatistische_daten_stadtteile"], ["bevoelkerungsprognosen_stadtteile_hh"]]
      }
    },
    {
      "layerId": "1692",
      "label": "Bezirke",
      "keyOfAttrName": "bezirk_name",
      "duplicateDistrictNames": ["Eimsbüttel", "Wandsbek", "Bergedorf", "Harburg"],
      "stats": {
        "keyOfAttrName": "bezirk",
        "baseUrl": ["https://qs-geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"],
        "metadataUrls": ["http://hmdk.metaver.de/trefferanzeige?docuuid=0076F219-A3CA-4898-8501-361565361342"],
        "featureTypes": [["regionalstatistische_daten_bezirke"]]
      }
    },
    {
      "layerId": "1693",
      "label": "Hamburg",
      "keyOfAttrName": "fhh",
      "stats": {
        "keyOfAttrName": "verwaltungseinheit",
        "baseUrl": ["https://qs-geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"],
        "featureTypes": ["regionalstatistische_daten_hh_gesamt"]
      },
      "displayAll": true,
      "districtNamesMap": {
        "FHH": "Hamburg"
      }
    }
  ],
  "active": true,
  "additionalInfoLayers": {
    "Sozialräume": ["20179"],
    "RISE": ["4411", "13895", "17040", "18712", "4413", "4409", "18713", "4412", "4410", "18714", "10767"]
}
```

***
