import {WFS} from "ol/format.js";
import {getLayerList} from "masterportalAPI/src/rawLayerList";
import unifyString from "../../utils/unifyString";
import MappingJson from "../../assets/mapping.json";
import {getFeature, getFeaturePost} from "../../../../src/api/wfs/getFeature.js";
import {equalTo} from "ol/format/filter";
import prepareStatsFeatures from "../utils/prepareStatsFeatures";

const actions = {
    /**
     * @param {Function} dispatch - Function to dispatch a action.
     * @param {Object} store.getters - The DistrictLoader getters.
     * @param {Object} getters.selectedDistrictLevel - The selected district level.
     * @param {Object} getters.districtLevels - All avaiable district levels.
     * @param {Object} getters.findMappingObjectByCategory - Gets a mapping object by category.
     * @param {Object} payload - The stored features per layer.
     * @param {Number[]} payload.extent - The extent of the selected districts.
     * @param {String[]} payload.districtNameList - A list of the names of the selected districts.
     * @param {Object} payload.districtLevel - The stored features per layer.
     * @param {String[]} payload.subDistrictNameList - The district names on the lower level to avoid naming conflicts
     * @returns {module:ol/Feature[]}Returns stats features.
     */
    loadDistricts ({commit, dispatch, getters}, payload) {
        dispatch("Alerting/addSingleAlert", {content: "Datensätze werden geladen"}, {root: true});
        dispatch("resetMapping");
        const {selectedDistrictLevel, districtLevels} = getters,
            {extent, districtNameList, districtLevel, subDistrictNameList} = payload,
            level = typeof districtLevel === "undefined" ? selectedDistrictLevel : districtLevel,
            layerList = getLayerList().filter(function (layer) {
                return layer.url === level?.url;
            }),
            wfsReader = new WFS({
                featureNS: layerList[0]?.featureNS
            }),
            featurePromiseList = [];

        layerList.forEach(function (layer) {
            featurePromiseList.push(getFeature(layer.url, layer.featureType, undefined, level.propertyNameList, typeof extent !== "undefined" ? extent.toString() : undefined)
                .then(response => {
                    return wfsReader.readFeatures(response);
                })
                .then(features => {
                    // mapping feature kategorie value
                    features.forEach(prepareStatsFeatures);

                    if (features.length > 0) {
                        layer.category = features[0].get("kategorie");
                    }
                    return features;
                })
                .then(features => {
                    return features.filter((feature) => {
                        const attr = level.keyOfAttrName,
                            unifiedDistrictNamesList = districtNameList.map(name => unifyString(name));

                        if (unifiedDistrictNamesList.includes(unifyString(feature.get(attr)))) {
                            // rename feature name for reference levels to avoid naming conflict
                            if (subDistrictNameList) {
                                const districtName = feature.get(attr);

                                if (subDistrictNameList.includes(districtName)) {
                                    feature.set(attr, `${districtName} (${attr.charAt(0).toUpperCase() + attr.slice(1)})`);
                                }
                            }
                            return true;
                        }
                        return false;
                    });
                })
                .catch(function (error) {
                    dispatch("alertError");
                    console.error(error);
                }));
        }, this);
        Promise.all(featurePromiseList).then((featureList) => {
            level.features = featureList.flat();

            const levelIndex = districtLevels.findIndex(element => {
                return element.label === level.label;
            });

            // loading reference Districts recursively
            if (levelIndex < districtLevels.length - 1) {
                const reflevel = districtLevels[levelIndex + 1],
                    selector = reflevel.keyOfAttrName,
                    referenceDistricts = featureList[0].reduce((refDistricts, feature) => {
                        return refDistricts.includes(feature.get(selector)) ? refDistricts : [...refDistricts, feature.get(selector)];
                    }, []);

                // trigger the method recursion
                // passing an undefined bbox if the scope is "bezirke", loading the entire city for all above levels
                return dispatch("loadDistricts", {
                    extent: reflevel.label === "Bezirke" ? undefined : extent,
                    districtLevel: reflevel,
                    districtNameList: reflevel.label === "Hamburg" ? ["hamburg_gesamt"] : referenceDistricts,
                    subDistrictNameList: districtNameList
                });
            }
            dispatch("Alerting/cleanup", null, {root: true});
            return commit("setFeatureList", featureList);
        }).catch(function (error) {
            dispatch("alertError");
            console.error(error);
        });
    },

    /**
     * @param {Object} store.getters - The DistrictLoader getters.
     * @param {Function} store.rootGetters - The root store getters.
     * @param {Function} store.dispatch - Function to dispatch a action.
     * @param {Object} payload - The stored features per layer.
     * @param {Number[]} payload.districtFeature - The district to fetch data for.
     * @param {String[]} payload.districtLevel - The administrative level the district belongs to.
     * @returns {module:ol/Feature[]} Returns stats features.
     */
    async getStatsByDistrict ({getters, rootGetters, dispatch}, {districtFeature, districtLevel}) {
        // Return stats if already stored
        if (districtFeature.get("stats")) {
            return districtFeature.get("stats");
        }
        /**
         * @deprecated
         * @todo refactor when Radio removed
        */
        Radio.trigger("Util", "showLoader");

        const {stats, keyOfAttrName, keyOfAttrNameStats} = districtLevel,
            {districtLevels} = getters,
            url = stats.baseUrl,
            srsName = rootGetters["Map/projectionCode"],
            loaderDistrictLevel = districtLevels.find(level => level.label === districtLevel.label),
            districtName = districtFeature.get(keyOfAttrName),
            featureTypes = getLayerList().reduce((typeNames, layer) => {
                return layer.url === url ? [...typeNames, layer.featureType] : typeNames;
            }, []),
            filter = equalTo(keyOfAttrNameStats, districtName),
            result = await getFeaturePost(url, {
                featureTypes,
                srsName,
                propertyNames: loaderDistrictLevel.propertyNameList.split(","),
                filter
            }),
            statsFeatures = new WFS().readFeatures(result);

        // map category names
        statsFeatures.forEach(prepareStatsFeatures);
        dispatch("appendStatsToDistricts", {statsFeatures, districtFeatures: districtLevel.layer.getSource().getFeatures()});

        /**
         * @deprecated
         * @todo refactor when Radio removed
        */
        Radio.trigger("Util", "hideLoader");

        return statsFeatures;
    },

    alertError ({dispatch}) {
        dispatch("Alerting/addSingleAlert", {
            category: "Warnung",
            content: "Datensätze konnten nicht geladen werden. Vermutlich liegt ein Verbindungsproblem zum Server vor. Bestätigen Sie die Auswahl erneut oder laden Sie CoSI neu.",
            displayClass: "warning"
        }, {root: true});
    },

    /**
     * @description Appends the stats features to the selected district feature objects. Uses references.
     * @todo This is preliminary! It's not clear yet whether it's useful.
     * @param {Object} context - the store's context arguments
     * @param {Object} context.getters - the modules store getters
     * @param {String} context.getters.keyOfAttrName - the key for the attribute "name" of the stats features' districts
     * @param {Object} context.rootGetters - the root store's getters
     * @param {Object} context.rootGetters.keyOfAttrName - the key for the attribute "name" of the districts in the map
     * @param {Object} context.rootGetters.selectedFeatures - the currently selected map features
     * @param {module:ol/Feature[]} statsFeatures - the loaded stats features for the current districtLevel
     * @param {module:ol/Feature[]} [districtFeatures] - the district features in the map, DistrictSelector's selected features if undefined
     * @returns {void}
     */
    appendStatsToDistricts ({getters, rootGetters}, {statsFeatures, districtFeatures}) {
        const keyOfAttrNameStats = getters.selectedDistrictLevel.keyOfAttrName,
            keyOfAttrName = rootGetters["Tools/DistrictSelector/keyOfAttrName"],
            _districtFeatures = districtFeatures || rootGetters["Tools/DistrictSelector/selectedFeatures"];

        statsFeatures.forEach(feature => {
            const district = _districtFeatures.find(districtFeature => districtFeature.get(keyOfAttrName) === feature.get(keyOfAttrNameStats));

            if (district) {
                district.set("stats", {...district.get("stats") || {}, [feature.get("kategorie")]: feature});
            }
        });
    },
    /**
     * @description sets a set of stats features for a given district level
     * @param {*} state - the District Loaders store state
     * @param {*} payload - the data to set
     * @param {String} payload.label - the district level to set the features to
     * @param {module:ol/Feature[]} payload.features - the features to set on the provided district level
     * @returns {void}
     */
    setDistrictLevelFeatures ({state}, payload) {
        const {label, features} = payload,
            districtLevel = state.districtLevels.find(level => unifyString(level.label) === unifyString(label));

        if (districtLevel) {
            districtLevel.features = features;
        }
    },
    /**
     * @description adds a stat feature to a given district level, extends the mapping object if necessary
     * @param {Object} context - the store's context arguments
     * @param {Object} context.state - the District Loaders store state
     * @param {Function} context.commit - Function to commit a mutation.
     * @param {Object} payload - the data to add
     * @param {String} payload.label - the district level to set the features to
     * @param {module:ol/Feature[]} payload.features - the feature to add to the provided district level
     * @returns {void}
     */
    addDistrictLevelFeature ({state, commit}, payload) {
        const {label, feature} = payload,
            districtLevel = state.districtLevels.find(level => unifyString(level.label) === unifyString(label));

        commit("addCategoryToMapping", feature);

        if (districtLevel) {
            districtLevel.features = [...districtLevel.features, feature];
        }
    },
    /**
     * @description removes a stat feature from a given district level, adjusts the mapping if necessary
     * @todo not implemented atm
     * @param {Object} context - the store's context arguments
     * @param {Object} context.state - the District Loader's store state
     * @param {Function} context.commit - Function to commit a mutation.
     * @param {Function} context.getters - the District Loader's getters.
     * @param {Object} payload - the data to remove
     * @param {String} payload.label - the district level to remove the feature from
     * @param {module:ol/Feature[]} payload.features - the feature to be removed from the provided district level
     * @returns {void}
     */
    removeDistrictLevelFeature ({state, commit, getters}, payload) {
        const {label, feature} = payload,
            districtLevel = state.districtLevels.find(level => unifyString(level.label) === unifyString(label));

        /** @todo find better, more performant solution */
        if (!getters.anyStatsOfCategory(feature.get("kategorie"))) {
            commit("removeCategoryFromMapping", feature);
        }

        if (districtLevel) {
            districtLevel.features = districtLevel.filter(_feature => _feature !== feature);
        }
    },

    /**
     * @description resets the mapping to the original json
     * @param {Object} state - the DistrictLoader store state
     * @returns {void}
     */
    resetMapping ({state}) {
        state.mapping = MappingJson;
    }
};

export default actions;
