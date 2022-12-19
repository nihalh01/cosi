import * as Proj from "ol/proj.js";
import * as Extent from "ol/extent";
import GeometryCollection from "ol/geom/GeometryCollection";
import setBBoxToGeom from "../../utils/setBBoxToGeom";
import
{
    Fill,
    Stroke,
    Style
} from "ol/style.js";
import {getSearchResultsCoordinates} from "../../utils/getSearchResultsGeom";
import {
    polygon as turfPolygon,
    multiPolygon as turfMultiPolygon,
    lineString as turfLineString,
    featureCollection as turfFeatureCollection
} from "@turf/helpers";
import {default as turfSimplify} from "@turf/simplify";
import {default as turfBuffer} from "@turf/buffer";
import {readFeatures} from "../components/util.js";
import {transformFeatures} from "../../utils/features/transform";
import {getLayerSource} from "../../utils/layer/getLayerSource";
import {getModelByAttributes} from "../../utils/radioBridge.js";

export const methodConfig = {
    store: null
};
export default {
    /**
     * create isochrones features
     * @returns {void}
     */
    createIsochrones: async function () {
        this.clear();
        // TODO: Use store-method - see DistrictSelector component
        this.askUpdate = false;

        try {
            if (this.mode === "point") {
                await this.createIsochronesPoint();
            }
            else if (this.mode === "region") {
                await this.createIsochronesRegion();
            }
            else if (this.mode === "path") {
                await this.createBufferFromDirections();
            }
        }
        catch (err) {

            if (err.request_canceled) {
                return;
            }

            console.error(err);

            try {
                const code = (err.error || err).response.data.error.code;


                if (code === 3002 || code === 3099) {
                    this.showErrorInvalidInput();
                }
                else {
                    this.showError();
                }
            }
            catch (e) {
                console.error(e);
                this.showError();
            }
        }
    },
    /**
     * create isochrones features for selected several coordiantes
     * TODO: break apart into smaller functions
     * @fires Core#RadioRequestMapGetLayerByName
     * @fires OpenRouteService#RadioRequestOpenRouteServiceRequestIsochrones
     * @returns {void}
     */
    createIsochronesRegion: async function () {
        const
            coordinates = this.getCoordinates(this.setByFeature),
            {distance, maxDistance, minDistance, steps} = this.getDistances();

        if (
            coordinates !== null &&
            this.transportType !== "" &&
            this.scaleUnit !== "" &&
            distance !== 0
        ) {
            this.cleanup();

            const features = await this.getIsochrones({
                transportType: this.transportType,
                coordinates,
                scaleUnit: this.scaleUnit,
                distance,
                maxDistance,
                minDistance,
                baseUrl: this.baseUrl
            });

            // TODO: get locale from store
            this.setSteps(steps);
            this.setIsochroneFeatures(features);
            this.currentCoordinates = coordinates;
        }
        else {
            this.inputReminder();
        }
    },
    /**
     * TODO: see TODOs in createIsochronesRegion
     * create isochrones features for selected several coordiantes
     * @returns {void}
     */
    createIsochronesPoint: async function () {
        const
            {distance, maxDistance, minDistance, steps} = this.getDistances();

        if (
            this.coordinate.length > 0 &&
            this.transportType !== "" &&
            this.scaleUnit !== "" &&
            distance !== 0
        ) {
            this.setSetByFeature(false);

            const features = await this.getIsochrones({
                transportType: this.transportType,
                coordinates: this.coordinate,
                scaleUnit: this.scaleUnit,
                distance,
                maxDistance,
                minDistance,
                baseUrl: this.baseUrl
            });

            this.setSteps(steps);
            this.setRawGeoJson(await this.featureToGeoJson(features[0]));
            this.setIsochroneFeatures(features);
            this.showRequestButton = true;
            this.cleanup();
        }
        else {
            this.inputReminder();
        }
    },
    renderIsochrones (newFeatures) {
        this.mapLayer.getSource().clear();

        if (newFeatures.length === 0) {
            if (this.mode !== "region") {
                setBBoxToGeom.call(this, this.areaSelectorGeom || this.boundingGeometry);
            }
            return;
        }
        this.styleFeatures(newFeatures);
        this.mapLayer.getSource().addFeatures(newFeatures);
        if (this.mode !== "region") {
            this.setIsochroneAsBbox();
        }
    },
    /**
     * add coordinate after user click
     * @param {event} evt Event from User click
     * @returns {void}
     */
    setCoordinateFromClick: function (evt) {
        const rawCoords = this.setByFeature ? this.setCoordinatesByFeatures(evt) : [evt.coordinate],
            coordinates = rawCoords.map(coord => Proj.transform(
                coord,
                this.projectionCode,
                "EPSG:4326"
            ));

        this.setCoordinate(coordinates);
        this.setClickCoordinate(evt.coordinate);
        this.setSetBySearch(false);
    },

    setCoordinatesByFeatures: function (evt) {
        const feature = this.map.getFeaturesAtPixel(evt.pixel, {
            layerFilter: layer => this.activeVectorLayerList.includes(layer)
        })[0];

        if (feature) {
            const geom = feature.getGeometry();

            return this.simplifyGeometry(geom) || [evt.coordinate];
        }

        return [evt.coordinate];
    },

    simplifyGeometry (geom, tolerance = 1) {
        let simplified, geojson;

        if (geom.getType() === "Polygon") {
            geojson = turfPolygon(geom.getCoordinates());
            simplified = turfSimplify(geojson, {tolerance});

            return simplified.geometry.coordinates.flat(1).map(p => [p[0], p[1]]);
        }
        if (geom.getType() === "MultiPolygon") {
            geojson = turfMultiPolygon(geom.getCoordinates());
            simplified = turfSimplify(geojson, {tolerance});

            return simplified.geometry.coordinates.flat(2).map(p => [p[0], p[1]]);
        }
        if (geom.getType() === "Point") {
            return [[geom.getCoordinates()[0], geom.getCoordinates()[1]]];
        }

        return null;
    },

    createBufferFromDirections: function () {
        let bufferFeatures;
        const
            featureType = "Erreichbarkeit entlang einer Route",
            distance = parseFloat(this.distance) / 1000,
            steps = [distance, distance * 2 / 3, distance / 3],
            coords = this.selectedDirections?.lineString
                .map(pt => Proj.transform(pt, this.projectionCode, "EPSG:4326")),
            lineString = turfLineString(coords),
            buffer = turfFeatureCollection(steps.map(dist => turfBuffer(lineString, dist)));

        bufferFeatures = readFeatures(JSON.stringify(buffer));
        bufferFeatures = transformFeatures(bufferFeatures, "EPSG:4326", this.projectionCode);
        bufferFeatures.forEach((feature, i) => {
            feature.set("featureType", featureType);
            feature.set("value", steps[i]);
            feature.set("mode", this.transportType);
            feature.set("unit", this.scaleUnit);
        });

        this.setSteps([distance * 1000 / 3, distance * 2000 / 3, distance * 1000].map((n) => Number.isInteger(n) ? n.toLocaleString("de-DE") : n.toFixed(2)));
        this.setRawGeoJson(buffer);
        this.setIsochroneFeatures(bufferFeatures);
    },

    pickDirections: function (evt) {
        const feature = evt.selected[0];

        if (feature) {
            this._selectedDirections = feature;
        }
    },

    /**
     * TODO: replace calls to this function with /addons/cosi/utils/getSearchResultsCoordinate.js
     * @returns {void}
     */
    setSearchResultToOrigin: function () {
        const coord = getSearchResultsCoordinates();

        if (coord) {
            this.setCoordinate([coord]);
            this.setClickCoordinate(coord);
            this.setSetBySearch(true);
        }
    },
    /**
     * reminds user to set inputs
     * @returns {void}
     */
    inputReminder: function () {
        this.addSingleAlert({
            category: "Info",
            content: "<strong>" + this.$t("additional:modules.tools.cosi.accessibilityAnalysis.inputReminder") + "</strong>",
            displayClass: "info"
        });
    },

    showError: function () {
        this.addSingleAlert({
            content: "<strong>" + this.$t("additional:modules.tools.cosi.accessibilityAnalysis.showError") + "</strong>",
            category: "Fehler",
            displayClass: "error"
        });
    },
    showErrorInvalidInput: function () {
        this.addSingleAlert({
            content: "<strong>" + this.$t("additional:modules.tools.cosi.accessibilityAnalysis.showErrorInvalidInput") + "</strong>",
            category: "Fehler",
            displayClass: "error"
        });
    },
    /**
     * style isochrone features
     * @param {ol.Feature} features isochone features (polygons)
     * @returns {void}
     */
    styleFeatures: function (features) {
        const startIndex = features.length === 3 ? 0 : 1;

        for (let i = startIndex; i < features.length; i++) {
            features[i].setStyle(
                new Style({
                    fill: new Fill({
                        color: this.featureColors[i - startIndex]
                    }),
                    stroke: new Stroke({
                        color: "white",
                        width: 1
                    })
                })
            );
        }

        if (startIndex === 1) {
            features[0].setStyle(
                new Style({
                    fill: new Fill(this.refFeatureStyle.fill),
                    stroke: new Stroke(this.refFeatureStyle.stroke)
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
        const polygonGeometry = this.isochroneFeatures[this.isochroneFeatures.length === 4 ? 1 : 0].getGeometry(),
            geometryCollection = new GeometryCollection([polygonGeometry]);

        setBBoxToGeom.call(this, geometryCollection);
    },
    /**
    * resets facility layers' bbox
    * @returns {void}
    */
    resetIsochroneBBox () {
        setBBoxToGeom.call(this, this.areaSelectorGeom || this.boundingGeometry);
    },
    /**
     * clears the component
     * @returns {void}
     */
    clear: function () {
        this.layers = null;
        this.showRequestButton = false;
        this.setSteps([0, 0, 0]);
        this.setRawGeoJson(null);
        this.setIsochroneFeatures([]);
    },


    /**
     * Hides the current result without destroying it
     * @param {Boolean} v - the current val of "hide"
     * @returns {void}
     */
    hideResults (v) {
        if (v) {
            this.renderIsochrones([]);
            if (this.mode === "point") {
                this.removePointMarker();
            }
        }
        else {
            this.renderIsochrones(this._isochroneFeatures);
            if (this.mode === "point") {
                this.placingPointMarker(
                    Proj.transform(this.coordinate[0], "EPSG:4326", this.projectionCode)
                );
            }
        }
    },

    /**
     * gets the distance weighted by travel time index
     * @returns {{distance: Number, maxDistance: Number, minDistance: Number, steps: String[]}} distance with penalty and legend
     */
    getDistances: function () {
        const
            hasPenalty = this.useTravelTimeIndex && this.scaleUnit === "time" && this.transportType === "driving-car",
            penalty = this.travelTimeIndex[this.time] / Math.min(...Object.values(this.travelTimeIndex)),
            rawDistance = parseFloat(this.distance);
        let
            distance = rawDistance,
            maxDistance, minDistance,
            steps = [rawDistance / 3, rawDistance * 2 / 3, rawDistance].map(n => Number.isInteger(n) ? n.toLocaleString("de-DE") : n.toFixed(2));

        if (hasPenalty) {
            distance = rawDistance / penalty;
            maxDistance = rawDistance;
            minDistance = rawDistance / (Math.max(...Object.values(this.travelTimeIndex)) / Math.min(...Object.values(this.travelTimeIndex)));
            steps = [...steps, "max"];
        }

        return {distance, maxDistance, minDistance, steps};
    },
    getCoordinates: function (setByFeature) {
        const selectedLayerModel = getModelByAttributes({
            name: this.selectedFacilityName,
            type: "layer"
        });

        if (selectedLayerModel) {
            const features = getLayerSource(selectedLayerModel.get("layer"))
                .getFeatures()
                .filter(this.isFeatureActive);

            return features
                .reduce((res, feature) => {
                    const geometry = feature.getGeometry();

                    if (geometry.getType() === "Point") {
                        return [...res, geometry.getCoordinates().splice(0, 2)];
                    }
                    if (setByFeature) {
                        return [...res, ...this.simplifyGeometry(geometry, 10) || [Extent.getCenter(geometry.getExtent())]];
                    }
                    return [...res, Extent.getCenter(geometry.getExtent())];

                }, []).map(coord => Proj.transform(coord, this.projectionCode, "EPSG:4326"));
        }
        return null;
    }
};
