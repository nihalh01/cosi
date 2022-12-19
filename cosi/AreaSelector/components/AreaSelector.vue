<script>
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";
import ToolInfo from "../../components/ToolInfo.vue";
import {getComponent} from "../../../../src/utils/getComponent";
import {mapGetters, mapMutations, mapActions} from "vuex";
import getters from "../store/gettersAreaSelector";
import mutations from "../store/mutationsAreaSelector";
import {geomPickerUnlisten, geomPickerSetGeometry, geomPickerGetFeature} from "../../utils/geomPickerHandler";
import setBBoxToGeom from "../../utils/setBBoxToGeom.js";
import GeometryPicker from "../../components/GeometryPicker.vue";
import {Stroke, Style} from "ol/style.js";
import {featureToGeoJson} from "../../utils/features/convertToGeoJson";
import Feature from "ol/Feature";

export default {
    name: "AreaSelector",
    components: {
        Tool,
        ToolInfo,
        GeometryPicker
    },
    data () {
        return {
            polygonStyle: new Style({
                stroke: new Stroke({
                    width: 3,
                    color: [232, 85, 115, 1],
                    lineDash: [5, 5]
                })
            })
        };
    },
    computed: {
        ...mapGetters("Tools/AreaSelector", Object.keys(getters)),
        ...mapGetters("Tools/DistrictSelector", ["boundingGeometry"]),
        ...mapGetters("Maps", ["projectionCode"]),
        ...mapGetters("Language", ["currentLocale"]),
        geomField () {
            return {
                name: this.$t("additional:modules.tools.cosi.areaSelector.drawPolygon"),
                type: "Polygon"
            };
        }
    },
    watch: {
        async active (newActive) {
            if (newActive) {
                if (this.feature) {
                    await this.$nextTick();
                    geomPickerSetGeometry(this.$refs["geometry-picker"], this.feature.getGeometry());
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

        geometry (geom) {
            const feature = geomPickerGetFeature(this.$refs["geometry-picker"]) || new Feature({geometry: geom});

            this.setFeature(feature);
            this.drawingLayer.getSource().clear();
            if (this.feature) {
                this.drawingLayer.getSource().addFeature(this.feature);
            }

            this.addNewSelection({selection: [new Feature(geom)], source: this.$t("additional:modules.tools.cosi.areaSelector.title"), id: this.$t("additional:modules.tools.cosi.areaSelector.title") + " #" + new Feature(geom).ol_uid});
            setBBoxToGeom.call(this, geom || this.boundingGeometry);
        }
    },
    /**
    * @returns {void}
    */
    created () {
        this.createDrawingLayer();
        this.$on("close", this.close);
    },
    methods: {
        ...mapMutations("Tools/AreaSelector", Object.keys(mutations)),
        ...mapMutations("Tools/PopulationRequest", {
            setPopulationRequestGeometry: "setGeometry",
            setPopulationRequestActive: "setActive"
        }),
        ...mapActions("Maps", ["addNewLayerIfNotExists"]),
        ...mapActions("Tools/SelectionManager", ["addNewSelection"]),

        /**
         * Updates the geometry from the geomPicker in the data for later use when instantiating a new feature
         * @param {module:ol/Geometry} geom the new geometry object
         * @returns {void}
         */
        updateGeometry (geom) {
            this.setGeometry(geom);
            geomPickerUnlisten(this.$refs["geometry-picker"]);
        },

        /**
         * @description create a guide layer used for additional info to display on the map
         * @returns {void}
         */
        async createDrawingLayer () {
            const newLayer = await this.addNewLayerIfNotExists({layerName: this.id});

            newLayer.setVisible(true);
            newLayer.setStyle(this.polygonStyle);
            this.setDrawingLayer(newLayer);

            return newLayer;
        },

        /**
        * closes this component and opens requestInhabitants component and executes makeRequest with the calculated geoJSON of this component
        * @returns {void}
        */
        async requestInhabitants () {
            const geoJson = featureToGeoJson(this.feature, false, this.projectionCode, this.projectionCode);

            this.close();
            await this.$nextTick();
            this.setPopulationRequestActive(true);
            this.setPopulationRequestGeometry(geoJson.geometry);
        },

        /**
        * Closes this tool window by setting active to false
        * @returns {void}
        */
        close () {
            this.setActive(false);
        }
    }
};
</script>

<template lang="html">
    <Tool
        :title="$t('additional:modules.tools.cosi.areaSelector.title')"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
    >
        <template
            v-if="active"
            #toolBody
        >
            <v-app class="clamp-600px">
                <ToolInfo
                    :url="readmeUrl"
                    :locale="currentLocale"
                    :summary="$t('additional:modules.tools.cosi.areaSelector.info')"
                />
                <div id="area-selector">
                    <GeometryPicker
                        ref="geometry-picker"
                        :geom-field="geomField"
                        :is-gml="false"
                        @updateGeometry="updateGeometry"
                    />
                </div>
                <v-btn
                    v-if="geometry"
                    dense
                    small
                    tile
                    color="grey lighten-1"
                    @click="requestInhabitants"
                >
                    {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.requestInhabitants') }}
                </v-btn>
            </v-app>
        </template>
    </Tool>
</template>
