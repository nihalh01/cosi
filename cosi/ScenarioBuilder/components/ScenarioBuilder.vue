<script>
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";
import {getComponent} from "../../../../src/utils/getComponent";
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersScenarioBuilder";
import mutations from "../store/mutationsScenarioBuilder";
import actions from "../store/actionsScenarioBuilder";
import describeFeatureTypeByLayerId from "../../utils/describeFeatureType";
import beautifyKey from "../../../../src/utils/beautifyKey";
import validateProp, {compareLayerMapping} from "../utils/validateProp";
import TypesMapping from "../../assets/mapping.types.json";
import Feature from "ol/Feature";
import {featureTagStyleMod, featureTagStyle, toggleTagsOnLayerVisibility} from "../utils/guideLayer";
import getValuesForField from "../utils/getValuesForField";
import getFieldTypeForValue from "../utils/getFieldTypeForValue";
import hash from "object-hash";
import ReferencePicker from "./ReferencePicker.vue";
import MoveFeatures from "./MoveFeatures.vue";
import FeatureEditor from "./FeatureEditor.vue";
import GeometryPicker from "../../components/GeometryPicker.vue";
import ScenarioManager from "./ScenarioManager.vue";
import ScenarioFeature from "../classes/ScenarioFeature";
import {geomPickerUnlisten, geomPickerResetLocation, geomPickerClearDrawPolygon, geomPickerSetGeometry} from "../../utils/geomPickerHandler";
import ToolInfo from "../../components/ToolInfo.vue";
import {unpackCluster} from "../../utils/features/unpackCluster";
import {getAddress} from "../../utils/geocode";
import LoaderOverlay from "../../../../src/utils/loaderOverlay.js";
import {getModelByAttributes} from "../../utils/radioBridge.js";

export default {
    name: "ScenarioBuilder",
    components: {
        Tool,
        ToolInfo,
        ReferencePicker,
        MoveFeatures,
        ScenarioManager,
        GeometryPicker,
        FeatureEditor
    },
    data () {
        return {
            workingLayer: null,
            featureTypeDesc: [],
            featureTypeDescSorted: {
                required: [],
                optional: []
            },
            featureProperties: {},
            beautifyKey: beautifyKey,
            typesMapping: TypesMapping,
            geometry: null,
            valuesForFields: {},
            panel: [0, 1],
            formValid: false,
            isCreated: false,
            editDialog: false,
            editFeature: null,
            map: undefined
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/ScenarioBuilder", Object.keys(getters)),
        ...mapGetters("Tools/FeaturesList", ["groupActiveLayer", "activeVectorLayerList"]),
        ...mapGetters("Maps", ["getLayerById", "projectionCode"]),
        ...mapGetters("Tools/Routing", ["geosearchReverse"]),
        /**
         * Getter and Setter for the manuel coordinates Input for the geometry
         */
        geomCoords: {
            get () {
                return this.geometry ? JSON.stringify(this.geometry.getCoordinates()) : undefined;
            },
            set (v) {
                this.setGeomByInput(v);
            }
        }
    },

    watch: {
        /**
         * Watcher function for the workingLayer.
         * Triggers the retrival of the featureType description and the available values.
         * @param {Object} layerMap - the layerMap of the current working layer.
         * @returns {void}
         */
        workingLayer (layerMap) {
            LoaderOverlay.show();
            this.resetFeature();

            this.describeFeatureTypeByLayerId(layerMap.layerId)
                .then(desc => {
                    const _desc = desc || this.getDescriptionBySource(layerMap.layerId),
                        required = [],
                        optional = [];
                    let geom;

                    for (const field of _desc) {
                        if (compareLayerMapping(field, layerMap)) {
                            required.push(field);
                            this.featureProperties[field.name] = null;
                        }
                        else if (this.typesMapping[field.type] === "geom") {
                            geom = field;
                        }
                        else {
                            optional.push(field);
                        }
                    }
                    this.featureTypeDescSorted = {required, optional, geom};
                    this.featureTypeDesc = _desc;
                    this.asyncGetValuesForField(_desc);
                });
        },
        /**
         * If the tool is active, activate the select interaction and add overlay to the districtLayers if necessary
         * If the tool is not actvie, deactivate the interactions (select, drag box) and remove overlay if no districts are selected
         * and update the extent of the selected features (districts).
         * @param {boolean} newActive - Defines if the tool is active.
         * @returns {void}
         */
        async active (newActive) {
            if (newActive) {
                if (this.geometry) {
                    // wait for 2 ticks for the drawing layer to initialize
                    await this.$nextTick();
                    this.$refs["geometry-picker"].geometry.value = this.geometry;
                    await this.$nextTick();
                    geomPickerSetGeometry(this.$refs["geometry-picker"], this.geometry);
                }
            }
            else {
                const model = getComponent(this.id);

                if (model) {
                    model.set("isActive", false);
                }
                geomPickerUnlisten(this.$refs["geometry-picker"]);
            }
        },

        activeVectorLayerList (layerList) {
            if (this.guideLayer) {
                toggleTagsOnLayerVisibility(this.guideLayer, layerList);
            }
        },

        featureProperties: {
            deep: true,
            handler () {
                this.isCreated = false;
            }
        },

        geometry (geom) {
            this.isCreated = false;
            this.getAddress(geom);
        }
    },
    /**
     * Lifecycle function, triggers on component initialize. Creates necessary guide and drawing layers.
     * @returns {void}
     */
    async created () {
        this.$on("close", () => {
            this.setActive(false);
        });
        this.map = mapCollection.getMap("2D");
        await this.createGuideLayer();
    },
    methods: {
        ...mapMutations("Tools/ScenarioBuilder", Object.keys(mutations)),
        ...mapActions("Tools/ScenarioBuilder", Object.keys(actions)),
        ...mapActions("MapMarker", ["placingPointMarker", "removePointMarker"]),
        ...mapActions("Maps", ["addNewLayerIfNotExists"]),
        ...mapMutations("Maps", ["setCenter"]),

        compareLayerMapping, // the utils function that checks a prop against the layer map
        validateProp, // the utils function validating the type of props and returning the relevant rules
        describeFeatureTypeByLayerId, // WFS describeFeatureType request based on the rawLayerList

        /**
         * @description create a guide layer used for additional info to display on the map
         * @returns {void}
         */
        async createGuideLayer () {
            const newLayer = await this.addNewLayerIfNotExists({layerName: this.id + "_layer"});

            newLayer.setVisible(true);
            newLayer.setStyle(function (feature) {
                if (feature.get("isModified") && !feature.get("isSimulation")) {
                    return [featureTagStyleMod(feature)];
                }
                return [featureTagStyle(feature)];
            });
            newLayer.setZIndex(15);
            this.setGuideLayer(newLayer);

            return newLayer;
        },

        /**
         * Resets the new feature properties
         * @returns {void}
         */
        resetFeature () {
            this.featureProperties = {};
            this.geometry = null;
            this.formValid = false;
            geomPickerResetLocation(this.$refs["geometry-picker"]);
            geomPickerUnlisten(this.$refs["geometry-picker"]);
        },

        /**
         * Updates the geometry from the geomPicker in the data for later use when instantiating a new feature
         * @param {module:ol/Geometry} geom the new geometry object
         * @returns {void}
         */
        updateGeometry (geom) {
            this.geometry = geom;
        },

        /**
         * Creates a new simulated feature and adds it to the map
         * @todo move to the scenarioFeature constructor?
         * @returns {void}
         */
        createFeature () {
            const layer = this.getLayerById({layerId: this.workingLayer.layerId}),
                geom = this.geometry,
                feature = new Feature({geometry: geom});

            this.setFeatureProperties(feature, this.featureProperties, geom);
            this.activeScenario.addFeature(
                new ScenarioFeature(feature, layer)
            );

            geomPickerUnlisten(this.$refs["geometry-picker"]);
            geomPickerClearDrawPolygon(this.$refs["geometry-picker"]);
            this.removePointMarker();
            this.$root.$emit("updateFeature");

            this.isCreated = true;
        },

        /**
         * @param {module:ol/Feature} feature - the feature whose properties to set
         * @param {Object} properties - the dict of properties to add to the feature
         * @param {module:ol/Geometry} geometry - the feature's geometry
         * @returns {void}
         */
        setFeatureProperties (feature, properties, geometry) {
            // delete potential geometry from properties
            if (Object.hasOwnProperty.call(properties, "geometry")) {
                delete properties.geometry;
            }
            // set properties
            feature.setProperties(properties);
            // flag as simulated
            feature.set("isSimulation", true);
            // create unique hash as ID
            feature.setId(hash({...properties, geom: geometry}));

            // set additional attributes based on geometry
            if (geometry.getType() === "Polygon" || geometry.getType() === "MultiPolygon") {
                const area = Math.round((geometry.getArea() + Number.EPSILON) * 100) / 100;

                for (const attr of this.areaAttributes) {
                    feature.set(attr.key, area * attr.factorToSqm);
                }
            }
        },

        /**
         * Asynchronously Retrieves the avaialble values for each field of the featureType
         * stores the result for use in select fields
         * @param {Object[]} desc - the featureType description
         * @returns {void}
         */
        asyncGetValuesForField (desc) {
            this.valuesForFields = {};

            for (const field of desc) {
                getValuesForField(field.name, this.workingLayer.layerId)
                    .then(items => {
                        this.valuesForFields = {
                            ...this.valuesForFields,
                            [field.name]: items
                        };
                    });
            }

            LoaderOverlay.hide();
        },

        /**
         * Sets a reference feature's properties as the properties of the feature to create
         * deletes the original features geom if necessary
         * @param {module:ol/Feature} feature - the feature picked as reference
         * @returns {void}
         */
        getDataFromReferenceFeature (feature) {
            const referenceProps = feature.getProperties();

            if (Object.prototype.hasOwnProperty.call(referenceProps, "geom")) {
                delete referenceProps.geom;
            }

            this.featureProperties = referenceProps;
            this.formValid = this.requiredFieldsSet();
        },

        disableFeatureEditor (state) {
            if (state) {
                geomPickerUnlisten(this.$refs["geometry-picker"]);
            }
            this.setFeatureEditorDisabled(state);
        },

        mapDataTypes (type) {
            return this.$t(`additional:modules.tools.cosi.dataTypes.${type}`);
        },

        async getAddress (geom) {
            const address = await getAddress(geom, this.projectionCode, this.geosearchReverse.type);

            if (address) {
                for (const prop of this.workingLayer.addressField) {
                    this.featureProperties[prop] = "";
                }

                this.$set(this.featureProperties, this.workingLayer.addressField[0], address);
                this.$forceUpdate();
            }
        },

        getDescriptionBySource (layerId) {
            const layer = this.getLayerById({layerId: layerId}),
                feature = layer.getSource().getFeatures()[0] || getModelByAttributes({id: layerId})?.get("features")[0];
            let props, desc;

            if (feature) {
                props = feature.getProperties();
                desc = Object.entries(props).map(prop => ({
                    minOccurs: 0,
                    name: prop[0],
                    type: getFieldTypeForValue(prop[1])
                }));

                return desc;
            }

            return [];
        },

        requiredFieldsSet () {
            for (const field of this.featureTypeDescSorted.required) {
                if (!this.featureProperties[field.name]) {
                    return false;
                }
            }

            return true;
        },

        openEditDialog (evt) {
            this.editFeature = null;
            this.map.forEachFeatureAtPixel(evt.pixel, feature => {
                for (const feat of unpackCluster(feature)) {
                    if (feat.get("isSimulation")) {
                        this.editFeature = feat;
                        this.editDialog = true;
                    }
                }
            }, {
                layerFilter: l => {
                    return this.activeVectorLayerList.includes(l);
                }
            });

            if (!this.editFeature) {
                this.editDialog = false;
            }
        },

        deleteFeature () {
            this.activeScenario.removeSimulatedFeature(this.editFeature);
            this.editDialog = false;
        }
    }
};
</script>

<template lang="html">
    <div :class="active ? 'tool-wrap' : ''">
        <Tool
            :title="$t('additional:modules.tools.cosi.scenarioBuilder.title')"
            :icon="icon"
            :active="active"
            :render-to-window="renderToWindow"
            :resizable-window="resizableWindow"
            :deactivate-gfi="deactivateGFI"
            :initial-width="0.4"
        >
            <template
                v-if="active"
                #toolBody
            >
                <ToolInfo
                    :url="readmeUrl"
                    :locale="currentLocale"
                />
                <v-app id="scenario-builder-wrapper">
                    <ScenarioManager @pruneScenario="resetFeature" />
                    <v-divider />
                    <div>
                        <span class="text-subtitle-2">
                            {{ $t('additional:modules.tools.cosi.scenarioBuilder.title') }}
                        </span>
                    </div>
                    <div class="mb-2">
                        Für die ausgewählten Fachdaten Themen können neue fiktive Einrichtungen angelegt werden. Diese können für alle CoSI Analysefunktionen verwendet werden. Sie werden außerhalb CoSI's nicht gespeichert.
                    </div>
                    <div
                        v-if="groupActiveLayer.length === 0"
                        class="warning_wrapper section"
                    >
                        <p class="warning">
                            <span>{{ $t("additional:modules.tools.cosi.scenarioBuilder.warningNoData") }}</span>
                        </p>
                    </div>
                    <div
                        v-else
                        id="scenario-builder"
                    >
                        <form class="features-list-controls">
                            <v-divider />
                            <div class="mb-5 overline">
                                {{ $t('additional:modules.tools.cosi.scenarioBuilder.layerSelector') }}
                            </div>
                            <v-select
                                v-if="groupActiveLayer.length > 0"
                                v-model="workingLayer"
                                class="layer_selection selection"
                                :items="groupActiveLayer"
                                dense
                                outlined
                                clearable
                                :placeholder="$t('additional:modules.tools.cosi.scenarioBuilder.layerSelector')"
                            />
                            <v-divider />
                            <template v-if="featureTypeDesc.length > 0">
                                <div class="mb-5 overline">
                                    {{ $t('additional:modules.tools.cosi.scenarioBuilder.toolMenu') }}
                                </div>
                                <v-row>
                                    <v-col cols="4">
                                        <ReferencePicker
                                            :working-layer="workingLayer"
                                            :active="active"
                                            :use-icons="useIcons"
                                            @pickReference="getDataFromReferenceFeature"
                                            @referencePickerActive="disableFeatureEditor"
                                        />
                                    </v-col>
                                    <v-col cols="8">
                                        <MoveFeatures
                                            :active-scenario="activeScenario"
                                            :working-layer="workingLayer"
                                            :active="active"
                                            :use-icons="useIcons"
                                            :guide-layer="guideLayer"
                                            @moveFeaturesActive="disableFeatureEditor"
                                        />
                                    </v-col>
                                </v-row>
                                <v-divider />
                                <div class="mb-5 overline">
                                    {{ $t('additional:modules.tools.cosi.scenarioBuilder.configureFeature') }}
                                </div>
                                <v-expansion-panels
                                    v-model="panel"
                                    accordion
                                    multiple
                                >
                                    <v-expansion-panel>
                                        <v-expansion-panel-header>
                                            {{ $t('additional:modules.tools.cosi.scenarioBuilder.geomFieldHeader') }}
                                        </v-expansion-panel-header>
                                        <v-expansion-panel-content>
                                            <GeometryPicker
                                                ref="geometry-picker"
                                                :geom-field="featureTypeDescSorted.geom"
                                                :use-icons="useIcons"
                                                @updateGeometry="updateGeometry"
                                            />
                                        </v-expansion-panel-content>
                                    </v-expansion-panel>
                                    <v-expansion-panel>
                                        <v-expansion-panel-header>
                                            {{ $t('additional:modules.tools.cosi.scenarioBuilder.essentialFieldHeader') }}
                                        </v-expansion-panel-header>
                                        <v-expansion-panel-content>
                                            <v-row
                                                v-for="field in featureTypeDescSorted.required"
                                                :key="field.name"
                                                class="essential-field"
                                                :title="$t('additional:modules.tools.cosi.scenarioBuilder.essentialField')"
                                                dense
                                            >
                                                <v-col cols="3">
                                                    <v-subheader :title="beautifyKey(field.name)">
                                                        {{ beautifyKey(field.name) }}
                                                    </v-subheader>
                                                </v-col>
                                                <v-col cols="9">
                                                    <v-switch
                                                        v-if="typesMapping[field.type] === 'boolean'"
                                                        v-model="featureProperties[field.name]"
                                                        :label="mapDataTypes(field.type)"
                                                        dense
                                                        :hide-details="false"
                                                        @change="formValid = requiredFieldsSet()"
                                                    />
                                                    <!-- Add Date Picker for dates -->
                                                    <!-- <v-date-picker
                                                        v-else-if="typesMapping[field.type] !== 'date'"
                                                        v-model="featureProperties[field.name]"
                                                    /> -->
                                                    <v-combobox
                                                        v-else
                                                        v-model="featureProperties[field.name]"
                                                        :items="valuesForFields[field.name]"
                                                        :name="field.name"
                                                        :label="mapDataTypes(field.type)"
                                                        :rules="validateProp(field, workingLayer)"
                                                        dense
                                                        @change="formValid = requiredFieldsSet()"
                                                    />
                                                </v-col>
                                            </v-row>
                                        </v-expansion-panel-content>
                                    </v-expansion-panel>
                                    <v-expansion-panel>
                                        <v-expansion-panel-header>
                                            {{ $t('additional:modules.tools.cosi.scenarioBuilder.optionalFieldHeader') }}
                                        </v-expansion-panel-header>
                                        <v-expansion-panel-content>
                                            <v-row
                                                v-for="field in featureTypeDescSorted.optional"
                                                :key="field.name"
                                                class="optional-field"
                                                :title="$t('additional:modules.tools.cosi.scenarioBuilder.optionalField')"
                                                dense
                                            >
                                                <v-col cols="3">
                                                    <v-subheader :title="beautifyKey(field.name)">
                                                        {{ beautifyKey(field.name) }}
                                                    </v-subheader>
                                                </v-col>
                                                <v-col cols="9">
                                                    <v-switch
                                                        v-if="typesMapping[field.type] === 'boolean'"
                                                        v-model="featureProperties[field.name]"
                                                        :label="mapDataTypes(field.type)"
                                                        dense
                                                    />
                                                    <!-- Add Date Picker for dates -->
                                                    <!-- <v-date-picker
                                                        v-else-if="typesMapping[field.type] !== 'date'"
                                                        v-model="featureProperties[field.name]"
                                                    /> -->
                                                    <v-combobox
                                                        v-else
                                                        v-model="featureProperties[field.name]"
                                                        :items="valuesForFields[field.name]"
                                                        :name="field.name"
                                                        :label="mapDataTypes(field.type)"
                                                        :rules="validateProp(field, workingLayer)"
                                                        dense
                                                    />
                                                </v-col>
                                            </v-row>
                                        </v-expansion-panel-content>
                                    </v-expansion-panel>
                                </v-expansion-panels>
                                <v-row dense>
                                    <v-progress-linear
                                        v-if="featureTypeDesc.length > 0 && Object.keys(valuesForFields).length / featureTypeDesc.length < 1"
                                        :value="100 * Object.keys(valuesForFields).length / featureTypeDesc.length"
                                        background-color="white"
                                    />
                                </v-row>
                                <v-row>
                                    <v-col
                                        class="flex"
                                        cols="12"
                                    >
                                        <v-btn
                                            dense
                                            small
                                            tile
                                            color="primary"
                                            :disabled="!activeScenario || geometry === null || !formValid || isCreated"
                                            class="flex-item"
                                            :title="!formValid ? $t('additional:modules.tools.cosi.scenarioBuilder.requiredFieldMissing') : ''"
                                            @click="createFeature"
                                        >
                                            <v-icon>mdi-home-plus</v-icon>
                                            <span>
                                                {{ $t('additional:modules.tools.cosi.scenarioBuilder.createFeature') }}
                                            </span>
                                        </v-btn>
                                        <v-btn
                                            dense
                                            small
                                            tile
                                            color="grey lighten-1"
                                            :disabled="!activeScenario"
                                            :title="$t('additional:modules.tools.cosi.scenarioBuilder.helpResetFeature')"
                                            class="flex-item"
                                            @click="resetFeature"
                                        >
                                            <v-icon>mdi-eraser</v-icon>
                                            {{ $t('additional:modules.tools.cosi.scenarioBuilder.resetFeature') }}
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </template>
                        </form>
                    </div>
                </v-app>
            </template>
        </Tool>
        <FeatureEditor
            :disabled="featureEditorDisabled"
        />
    </div>
</template>

<style lang="scss">
    @import "../../utils/variables.scss";

    #scenario-builder {
        form {
            .row {
                margin-top: 0px;
            }
            .col-3 {
                overflow: hidden;
            }
        }
        .flex {
            display: flex;
            .flex-item {
                margin: 0 2px 0 2px;
            }
        }
    }
</style>
