import {unByKey} from "ol/Observable";
import {describeFeatureType, getFeatureDescription} from "../../../../src/api/wfs/describeFeatureType.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import {getContainingDistrictForExtent} from "../../utils/geomUtils.js";

const eventKeys = {};

/**
 * Prepares the district level objects for the district selector.
 * Each district level is assigned its layer, the districts, the reference level (the next higher) and a list of all district names.
 * Will no longer be executed once all district levels have their layer.
 * @param {Object[]} districtLevels - All avaiable district level objects.
 * @param {module:ol/layer[]} layerList - An array of layers.
 * @returns {void}
 */
export async function prepareDistrictLevels (districtLevels, layerList) {
    const filteredDistrictLevels = getAllDistrictsWithoutLayer(districtLevels);

    if (filteredDistrictLevels.length > 0) {
        filteredDistrictLevels.forEach(async (districtLevel, index) => {
            // the reference level, null if there is none reference level
            districtLevel.referenceLevel = index < districtLevels.length - 1 ? districtLevels[index + 1] : null;
            // the layer for the district level
            districtLevel.layer = getLayerById(layerList, districtLevel.layerId);
            // the names of all avaible districts
            districtLevel.nameList = getNameList(districtLevel.layer, districtLevel.keyOfAttrName);
            // all featureTypes for the WFS GetFeature request for the stats features
            districtLevel.featureTypes = getFeatureTypes(districtLevel.stats.baseUrl, districtLevel.stats.featureTypes);
            // property names for the WFS GetFeature request for the stats features, without geometry
            if (!districtLevel.propertyNameList) {
                const propertyNameList = await getPropertyNameList(districtLevel.stats.baseUrl, districtLevel.featureTypes);

                if (!districtLevel.propertyNameList) {
                    districtLevel.propertyNameList = propertyNameList;
                }
            }
            // all districts at this level
            districtLevel.districts = getDistricts(districtLevel);
            // at this point the features of the layer are probably not yet loaded,
            // therefore the listener on the layer source to set the 'nameList' and the 'districts' property
            eventKeys[districtLevel.layerId] = districtLevel.layer.getSource().on("change", setProperties.bind(districtLevel));
        });
    }
}

/**
 * Returns all district level objects without layer.
 * @param {Object[]} districtLevels - All avaiable district level objects.
 * @returns {Object[]} The filtered district levels or an empty array.
 */
export function getAllDistrictsWithoutLayer (districtLevels) {
    if (!Array.isArray(districtLevels)) {
        console.error(`prepareDistrictLevels.getAllDistrictsWithoutLayer: ${districtLevels} has to be defined and an array.`);
        return [];
    }
    return districtLevels.filter(district => {
        return typeof district.layer === "undefined";
    });
}

/**
 * Creates a new 'district' object for all features from the layer and return them.
 * @param {Object} districtLevel - The district level.
 * @param {module:ol/layer} districtLevel.layer - The layer of the district level.
 * @param {String} districtLevel.keyOfAttrName - The key for the attribute containing the name of the district.
 * @param {String} districtLevel.label - The label of the district level.
 * @param {String[]|undefined} districtLevel.duplicateDistrictNames - Names of districts that trigger conflicts.
 * @param {Object} referenceLevel - The reference level from the district level.
 * @param {String} layerId - The id of the layer for the district level.
 * @returns {Object[]} The districts.
 */
export function getDistricts ({layer, keyOfAttrName, label, duplicateDistrictNames, referenceLevel, layerId}) {
    if (typeof layer !== "object" || layer === null || Array.isArray(layer) || typeof keyOfAttrName !== "string" || typeof label !== "string") {
        console.error(`prepareDistrictLevels.getDistricts: ${layer} has to be defined and an object. ${keyOfAttrName} has to be defined and a string. ${label} has to be defined and a string`);
        return [];
    }

    const districts = [];

    layer.getSource().getFeatures().forEach(function (feature) {
        districts.push({
            // the administration feature (district)
            adminFeature: feature,
            // an array for all statistical features of this district, currently used for calculations
            statFeatures: [],
            // an array with the original statistical features of this district as backup
            originalStatFeatures: [],
            // flag district is selected
            isSelected: false,
            // id of the district
            getId: () => feature.getId(),
            // label of the district
            getLabel: () => {
                const districtName = feature.get(keyOfAttrName);

                // rename feature name for reference levels to avoid naming conflict
                if (duplicateDistrictNames?.includes(districtName)) {
                    return `${districtName} (${label.slice(0, -1)})`;
                }
                return districtName;
            },
            // name of the district
            getName: () => {
                // The names of St.Pauli and Co. are inconsistent in the different services.
                if (feature.get(keyOfAttrName).indexOf("St. ") !== -1) {
                    return feature.get(keyOfAttrName).replace(/ /, "");
                }
                return feature.get(keyOfAttrName);
            },
            // name of the reference (parent) district
            getReferencDistrictName: () => {
                // Districtlevel = Hamburg
                if (referenceLevel === null) {
                    return null;
                }
                // Districtlevel = Stadtteile/Bezirke
                // The info for this can be found already at the admin feautre
                if (layerId !== "6071") {
                    return feature.get(referenceLevel.keyOfAttrName);
                }
                // Districtlevel = Stat.Gebiete
                const referenceDistrict = getContainingDistrictForExtent(referenceLevel, feature.getGeometry().getInteriorPoint().getExtent());

                return referenceDistrict.getName();
            }
        });
    });

    return districts;
}

/**
 * Returns a list of all feature types for the given WFS sources (urls).
 * @param {String[]} urls - The urls of the WFS`s.
 * @param {Array.<String[]>} typeNames - The feature types for each url if provided.
 * @returns {Array.<String[]>} The feature types for each url.
 */
export function getFeatureTypes (urls, typeNames) {
    if (!Array.isArray(urls)) {
        console.error(`prepareDistrictLevels.getFeatureTypes: ${urls} has to be defined and an array.`);
        return [];
    }
    const
        _typeNames = typeNames?.map(typeName => typeof typeName === "string" ? [typeName] : typeName), // map strings to list for WFS request
        featureTypes = [];

    for (let i = 0; i < urls.length; i++) {
        /**
         * if a featureType list is provided, use the list from config.json
         * alternatively extract from services.json
         */
        featureTypes[i] = Array.isArray(_typeNames?.[i]) ?
            _typeNames[i] :
            rawLayerList.getLayerList().reduce((_featureTypes, layer) => {
                return layer?.url === urls[i] ? [..._featureTypes, layer.featureType] : _featureTypes;
            }, []);
    }

    return featureTypes;
}

/**
 * Returns the layer of the passed id or undefined if no layer is found.
 * @param {module:ol/layer[]} layerList - An array of layers.
 * @param {String} id - The layer id.
 * @returns {module:ol/layer/Layer|undefined} The found layer.
 */
export function getLayerById (layerList, id) {
    if (!Array.isArray(layerList) || typeof id !== "string") {
        console.error(`prepareDistrictLevels.getLayerById: ${layerList} has to be defined and an array. ${id} has to be defined and a string`);
        return undefined;
    }

    return layerList.find(layer => {
        return layer.get("id") === id;
    });
}

/**
 * Returns the names of all avaible districts in the district level.
 * @param {module:ol/layer/VectorLayer} layer - A vector layer.
 * @param {String} keyOfAttrName - The key for the attribute "name" of the district features.
 * @returns {String[]} The names of the districts or an empty array.
 */
export function getNameList (layer, keyOfAttrName) {
    if (typeof layer !== "object" || layer === null || Array.isArray(layer) || typeof keyOfAttrName !== "string") {
        console.error(`prepareDistrictLevels.getNameList: ${layer} has to be defined and an object. ${keyOfAttrName} has to be defined and a string`);
        return [];
    }
    const nameList = [];

    layer.getSource().getFeatures().forEach(feature => {
        if (typeof feature.get(keyOfAttrName) !== "undefined") {
            // The names of St.Pauli and Co. are inconsistent in the different services.
            if (feature.get(keyOfAttrName).indexOf("St. ") !== -1) {
                feature.set(keyOfAttrName, feature.get(keyOfAttrName).replace(/ /, ""));
            }
            nameList.push(feature.get(keyOfAttrName));
        }
    });

    nameList.sort();

    return [...new Set(nameList)];
}

/**
 * Returns a list of all property names for the given WFS sources (urls), without geometries.
 * @param {String[]} urls - The urls of the WFS`s.
 * @param {Array.<String[]>} [typeNames] - The feature types for each url if provided.
 * @returns {Promise<Array.<String[]>>} The property name for each url.
 */
export async function getPropertyNameList (urls, typeNames) {
    if (!Array.isArray(urls)) {
        console.error(`prepareDistrictLevels.getPropertyNameList: ${urls} has to be defined and an array.`);
        return [];
    }
    const propertyNameList = [];

    for (let i = 0; i < urls.length; i++) {
        propertyNameList[i] = [];

        const layer = rawLayerList.getLayerList().find(rawlayer => {
            if (rawlayer.url === urls[i]) {
                if (Array.isArray(typeNames?.[i])) {
                    return rawlayer.featureType === typeNames?.[i][0];
                }
                return true;
            }
            return false;
        });

        if (layer) {
            // get the property names by the 'DescribeFeatureType' request
            const json = await describeFeatureType(urls[i]),
                description = getFeatureDescription(json, layer?.featureType);

            if (description) {
                description.forEach(element => {
                    // "gml:" => geometry property
                    if (element.type.search("gml:") === -1) {
                        propertyNameList[i].push(element.name);
                    }
                });
            }
        }

    }
    return propertyNameList;
}

/**
 * Sets the districts and the names of all districts to the district level.
 * Removes the event listener using the key returned by on() for this callback.
 * @this districtLevel
 * @param {module:ol/events/Event~BaseEvent} evt - Change event of a source.
 * @returns {void}
 */
export function setProperties (evt) {
    if (evt.target.getFeatures().length > 0 && this.districts.length === 0) {
        this.districts = getDistricts(this);
        this.nameList = getNameList(this.layer, this.keyOfAttrName);
        // unbind the listener
        unByKey(eventKeys[this.layerId]);
    }
}

/**
 * Retrieves synonymous district names from a map provided in config.json
 * @param {String} districtName - the district name to map
 * @param {Object} districtLevel - the districtLevel to check
 * @returns {String} the district name synonym or the original district name
 */
export function mapDistrictNames (districtName, districtLevel) {
    return districtLevel.districtNamesMap?.[districtName] || districtName;
}
