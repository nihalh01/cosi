import GeoJSON from "ol/format/GeoJSON";
import * as Proj from "ol/proj.js";
import * as Extent from "ol/extent";
import GeometryCollection from "ol/geom/GeometryCollection";
import setBBoxToGeom from "../../utils/setBBoxToGeom";
import {
    Fill,
    Stroke,
    Style
} from "ol/style.js";
import InfoTemplate from "text-loader!./info.html";
import * as turf from "@turf/turf";

export default {
    /**
     * creates the isochrone features, set the styles, and add them to the map layer
     * @fires Alerting#RadioTriggerAlertAlertRemove
     * @fires Core#RadioRequestMapGetLayerByName
     * @fires OpenRouteService#RadioRequestOpenRouteServiceRequestIsochrones
     * @returns {void}
     */
    createIsochrones2: function () {
        const range =
            this.scaleUnit === "time" ? this.distance * 60 : this.distance;

        const coordinates = this.getCoordinates(this.selectedFacilityName)

        if (
            coordinates != null &&
            this.transportType !== "" &&
            this.scaleUnit !== "" &&
            range !== 0
        ) {
            Radio.trigger("Alert", "alert:remove");
            // group coordinates into groups of 5
            const coordinatesList = []
            for (let i = 0; i < coordinates.length; i += 5) {
                const arrayItem = coordinates.slice(i, i + 5);
                coordinatesList.push(arrayItem);
            }
            // each group of 5 coordinates
            const promiseList = [];
            coordinatesList.forEach(coordinates => {
                promiseList.push(Radio.request("OpenRoute", "requestIsochrones", this.transportType, coordinates, this.scaleUnit,
                        [range, range * 0.67, range * 0.33])
                    .then(res => {
                        // reverse JSON object sequence to render the isochrones in the correct order
                        // this reversion is intended for centrifugal isochrones (when range.length is larger than 1)
                        const json = JSON.parse(res),
                            reversedFeatures = [...json.features].reverse(),
                            groupedFeatures = [
                                [],
                                [],
                                []
                            ];

                        for (let i = 0; i < reversedFeatures.length; i = i + 3) {
                            groupedFeatures[i % 3].push(reversedFeatures[i]);
                            groupedFeatures[(i + 1) % 3].push(reversedFeatures[i + 1]);
                            groupedFeatures[(i + 2) % 3].push(reversedFeatures[i + 2]);
                        }
                        json.features = reversedFeatures;
                        return groupedFeatures;
                    }));
            });
            Promise.all(promiseList).then((groupedFeaturesList) => {
                this.mapLayer.getSource().clear();
                for (let i = 0; i < 3; i++) {
                    let layeredList = groupedFeaturesList.map(groupedFeatures => groupedFeatures[i]);

                    layeredList = [].concat(...layeredList);
                    let layerUnion = layeredList[0];

                    for (let j = 0; j < layeredList.length; j++) {
                        layerUnion = turf.union(layerUnion, layeredList[j]);
                    }
                    let layerUnionFeatures = this.parseDataToFeatures(JSON.stringify(layerUnion));
                    layerUnionFeatures = this.transformFeatures(layerUnionFeatures, "EPSG:4326", "EPSG:25832");

                    const featureType = "Erreichbarkeit im Gebiet"
                    layerUnionFeatures.forEach(feature => {
                        feature.set("featureType", featureType)
                    });
                    this.styleFeatures(layerUnionFeatures);
                    this.mapLayer.getSource().addFeatures(layerUnionFeatures);
                }
            });
        } else {
            this.inputReminder();
        }
    },
    createIsochrones: async function () {
        // coordinate has to be in the format of [[lat,lon]] for the request
        const range =
            this.scaleUnit === "time" ? this.distance * 60 : this.distance;

        if (
            this.coordinate != null &&
            this.transportType !== "" &&
            this.scaleUnit !== "" &&
            range !== 0
        ) {
            try {
                const res = await Radio.request(
                    "OpenRoute",
                    "requestIsochrones",
                    this.transportType,
                    [this.coordinate],
                    this.scaleUnit,
                    [range * 0.33, range * 0.67, range]
                );

                const distance = parseFloat(this.distance);
                this.steps = [distance * 0.33, distance * 0.67, distance].map((n) =>
                    Number.isInteger(n) ? n.toString() : n.toFixed(2)
                );

                // reverse JSON object sequence to render the isochrones in the correct order
                const json = JSON.parse(res);
                const reversedFeatures = [...json.features].reverse();
                json.features = reversedFeatures;
                let newFeatures = this.parseDataToFeatures(JSON.stringify(json));

                newFeatures = this.transformFeatures(
                    newFeatures,
                    "EPSG:4326",
                    "EPSG:25832"
                );

                const featureType = "Erreichbarkeit ab einem Referenzpunkt"
                newFeatures.forEach((feature) => {
                    feature.set("featureType", featureType);
                });

                this.rawGeoJson = await this.featureToGeoJson(newFeatures[0]);

                this.styleFeatures(newFeatures, [this.coordinate]);

                this.mapLayer.getSource().clear(); // Persistence of more than one isochrones?
                this.mapLayer.getSource().addFeatures(newFeatures.reverse());
                this.isochroneFeatures = newFeatures;
                this.setIsochroneAsBbox();
                this.showRequestButton = true;
                Radio.trigger("Alert", "alert:remove");
            } catch (err) {
                console.error(err);
                this.showError();
            }
        } else {
            this.inputReminder();
        }
    },
    /**
     * Tries to parse data string to ol.format.GeoJson
     * @param   {string} data string to parse
     * @throws Will throw an error if the argument cannot be parsed.
     * @returns {object}    ol/format/GeoJSON/features
     */
    parseDataToFeatures: function (data) {
        const geojsonReader = new GeoJSON();
        let jsonObjects;

        try {
            jsonObjects = geojsonReader.readFeatures(data);
        } catch (err) {
            console.error(err);
            this.showError();
        }

        return jsonObjects;
    },
    /**
     * Transforms features between CRS
     * @param   {feature[]} features Array of ol.features
     * @param   {string}    crs      EPSG-Code of feature
     * @param   {string}    mapCrs   EPSG-Code of ol.map
     * @returns {void}
     */
    transformFeatures: function (features, crs, mapCrs) {
        features.forEach(function (feature) {
            const geometry = feature.getGeometry();
            if (geometry) {
                geometry.transform(crs, mapCrs);
            }
        });
        return features;
    },
    setCoordinateFromClick: function (evt) {
        const coordinate = Proj.transform(
            evt.coordinate,
            "EPSG:25832",
            "EPSG:4326"
        );

        this.coordinate = coordinate;
        this.placingPointMarker(evt.coordinate);
        this.setBySearch = false;
    },
    setSearchResultToOrigin: function () {
        let features = this.markerPoint.getSource().getFeatures();
        if (features.length == 1) {
            // single point
            const coord = features[0].getGeometry().getCoordinates();
            const pcoord = Proj.transform(coord, "EPSG:25832", "EPSG:4326");
            this.coordinate = pcoord;
            this.setBySearch = true;
        } else {
            // single polygon
            features = this.markerPolygon.getSource().getFeatures();
            if (features.length == 1) {
                const pts = features[0].getGeometry().getInteriorPoints();
                if (pts.getPoints().length == 1) {
                    const pcoord = Proj.transform(
                        pts.getPoints()[0].getCoordinates().slice(0, 2),
                        "EPSG:25832",
                        "EPSG:4326"
                    );
                    this.coordinate = pcoord;
                    this.setBySearch = true;
                } else if (pts.getPoints().length > 1) {
                    const geo = features[0].getGeometry();
                    const coords = Extent.getCenter(geo.getExtent());
                    const pcoord = Proj.transform(coords, "EPSG:25832", "EPSG:4326");
                    this.coordinate = pcoord;
                    this.setBySearch = true;
                }
            }
        }
    },
    /**
     * reminds user to set inputs
     * @returns {void}
     */
    inputReminder: function () {
        Radio.trigger("Alert", "alert", {
            text: "<strong>Bitte füllen Sie alle Felder aus.</strong>",
            kategorie: "alert-warning",
        });
    },

    showError: function () {
        Radio.trigger("Alert", "alert", {
            text: "<strong>Die Anfrage konnte nicht korrekt ausgeführt werden. Bitte überprüfen Sie Ihre Eingaben.</strong>",
            kategorie: "alert-danger",
        });
    },
    /**
     * clears the list of facilities within the isochrones
     * @returns {void}
     */
    // hideDashboardButton: function () {
    //   this.$el.find("#show-in-dashboard").hide();
    //   //   this.$el.find("#hh-request").hide();
    // },
    /**
     * style isochrone features
     * @param {ol.Feature} features isochone features (polygons)
     * @param {array} coordinate todo
     * @returns {void}
     */
    styleFeatures: function (features, coordinate) {
        for (let i = 0; i < features.length; i++) {
            features[i].setProperties({
                coordinate
            });
            features[i].setStyle(
                new Style({
                    fill: new Fill({
                        color: this.getFeatureColors()[i],
                    }),
                    stroke: new Stroke({
                        color: "white",
                        width: 1,
                    }),
                })
            );
        }
    },
    /**
     * sets facility layers' bbox as the isochrones
     * @fires Core.ConfigLoader#RadioRequestParserGetItemsByAttributes
     * @fires BboxSettor#RadioTriggerSetBboxGeometryToLayer
     * @returns {void}
     */
    setIsochroneAsBbox: function () {
        const polygonGeometry = this.isochroneFeatures[
                this.steps.length - 1
            ].getGeometry(),
            geometryCollection = new GeometryCollection([polygonGeometry]);

        setBBoxToGeom(geometryCollection);
    },
    /**
     * updates facilitie's name within the isochrone results
     * @returns {void}
     */
    updateResult: function () {
        const visibleLayerModels = Radio.request(
            "ModelList",
            "getModelsByAttributes", {
                typ: "WFS",
                isBaseLayer: false,
                isSelected: true
            }
        );

        if (visibleLayerModels.length > 0) {
            this.layers = [];
            Radio.trigger("Alert", "alert:remove");
            visibleLayerModels.forEach((layerModel) => {
                const features = layerModel.get("layer").getSource().getFeatures();
                if (features && features.length) {
                    const props = features[0].getProperties()
                    let idSelector;
                    /**
                     * hard coded id selector for facility layers
                     */
                    if (props.schul_id) {
                        idSelector = props.schulname ?
                            "schulname" :
                            "schul_id";
                    } else if (props.einrichtung) {
                        idSelector = props.name ?
                            "name" :
                            "einrichtung";
                    } else if (props.Einrichtungsnummer) {
                        idSelector = props.Name_normalisiert ?
                            "Name_normalisiert" :
                            "Einrichtungsnummer";
                    } else if (props.identnummer) {
                        idSelector = props.belegenheit ?
                            "belegenheit" :
                            "identnummer";
                    } else if (props.hauptklasse) {
                        idSelector = props.anbietername ?
                            "anbietername" :
                            "strasse";
                    }
                    // inscribe the coordinate to the feature for rendering to the resultView DOM Element
                    // for zooming to feature by click
                    const sfeatures = features.map((feature, i) => {
                        const geometry = feature.getGeometry();
                        const coord =
                            geometry.getType() === "Point" ?
                            geometry.getCoordinates().splice(0, 2) :
                            Extent.getCenter(geometry.getExtent());

                        let label = feature.getProperties()[idSelector];
                        if (!label) label = i + 1;
                        return [label, coord];
                    });

                    this.layers.push({
                        layerName: layerModel.get("name"),
                        layerId: layerModel.get("id"),
                        features: sfeatures,
                    });
                }
            });
        } else {
            this.selectionReminder();
        }
    },
    /**
     * reminds user to select facility layers
     * @returns {void}
     */
    selectionReminder: function () {
        Radio.trigger("Alert", "alert", {
            text: '<strong>Bitte wählen Sie mindestens ein Thema unter Fachdaten aus, zum Beispiel "Sportstätten".</strong>',
            kategorie: "alert-warning",
        });
    },
    resetMarkerAndZoom: function () {
        const icoord = Proj.transform(this.coordinate, "EPSG:4326", "EPSG:25832");
        this.placingPointMarker(icoord);
        Radio.trigger("MapView", "setCenter", icoord);
    },
    showInDashboard: function () {
        const el = $(this.$refs.result)
        Radio.trigger("Dashboard", "append", el, "#dashboard-containers", {
            id: "reachability",
            name: "Erreichbarkeit ab einem Referenzpunkt",
            glyphicon: "glyphicon-road",
            scalable: true,
        });
        el.find("#dashboard-container").empty();
    },
    /**
     * shows help window
     * @returns {void}
     */
    showHelp: function () {
        Radio.trigger("Alert", "alert:remove");
        Radio.trigger("Alert", "alert", {
            text: InfoTemplate,
            kategorie: "alert-info",
            position: "center-center",
        });
    },
    /**
     * clears the component
     * @returns {void}
     */
    clear: function () {
        this.layers = null;
        this.showRequestButton = false;
        this.steps = [0, 0, 0];
        this.rawGeoJson = null;
        this.isochroneFeatures = [];

        if (this.mapLayer.getSource().getFeatures().length > 0) {
            this.mapLayer.getSource().clear();
            //TODO
            if (this.extent.length > 0) {
                setBBoxToGeom(this.boundingGeometry);
            }
        }
    },
    /**
     * requests inhabitant calculation function
     * @returns {void}
     */
    requestInhabitants: function () {
        //TODO
        Radio.trigger(
            "GraphicalSelect",
            "onDrawEnd",
            this.rawGeoJson,
            "einwohnerabfrage",
            true
        );
    },
    getFeatureColors: function () {
        return [
            "rgba(200, 0, 3, 0.1)",
            "rgba(100, 100, 3, 0.15)",
            "rgba(0, 200, 3, 0.2)",
        ]
    },
    getCoordinates: function (name) {
        const selectedLayerModel = Radio.request("ModelList", "getModelByAttributes", {
            name: name
        });

        if (selectedLayerModel) {
            const features = selectedLayerModel.get("layer")
                .getSource().getFeatures().filter(f => typeof f.style_ === "object" || f.style_ === null);

            return features
                .map((feature) => {
                    const geometry = feature.getGeometry();
                    if (geometry.getType() === "Point") {
                        return geometry.getCoordinates().splice(0, 2);
                    } else {
                        return Extent.getCenter(geometry.getExtent());
                    }
                }).map(coord => Proj.transform(coord, "EPSG:25832", "EPSG:4326"));
        }
        return null
    }
}
