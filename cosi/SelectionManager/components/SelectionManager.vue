<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import getters from "../store/gettersSelectionManager";
import mutations from "../store/mutationsSelectionManager";
import actions from "../store/actionsSelectionManager";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import getBoundingGeometry from "../../utils/getBoundingGeometry.js";
import setBBoxToGeom from "../../utils/setBBoxToGeom.js";
import ToolInfo from "../../components/ToolInfo.vue";
import {addModelsByAttribute, getModelByAttributes} from "../../utils/radioBridge.js";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import {default as turfCenterOfMass} from "@turf/center-of-mass";
import GeoJSON from "ol/format/GeoJSON";
import {Fill, Stroke, Style} from "ol/style.js";

export default {
    name: "SelectionManager",
    components: {
        ToolInfo
    },
    data () {
        return {
            // Bool if the addon is open in the frontend or not
            openAddon: false,
            // array that stores the indexes of selections with extend options active
            extendedOptions: [],
            // array that stores the indexes of selections that are about to be merged
            selectionsToMerge: [],
            // Bool that reacts to changes in the this.selections array
            allSelectionsPossible: true
        };
    },
    computed: {
        ...mapGetters("Tools/SelectionManager", Object.keys(getters)),
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/ColorCodeMap", ["upperEdge"]),
        ...mapGetters("Tools/DistrictSelector", ["name", "selectedDistrictLevel", "selectedFeatures", "label", "keyOfAttrName", "keyOfAttrNameStats", "loadend", "metadataUrls", "boundingGeometry"]),
        ...mapGetters("Maps", ["getVisibleLayerList"]),
        ...mapGetters("Tools/FeaturesList", ["activeVectorLayerList", {facilitiesMapping: "mapping"}]),
        dashboardOpen () {
            return this.$store.getters["Tools/Dashboard/active"] || this.$store.getters["Tools/FeaturesList/active"];
        },
        selectionGroups () {
            return [... new Set(this.selections.map(selection => selection.source).sort())];
        },
        activeLayerList () {
            return this.activeVectorLayerList.map(layer => layer.getProperties().name);
        }
    },
    watch: {
        // other tools can commit to this store variable to add new selections
        // that pattern allows us to use data from external tools and apply internal methods to it.
        acceptSelection (selection) {
            if (selection) {
                this.selections.push(selection);
                this.highlightSelection(this.selections.length - 1);
            }
        },
        /**
             * @description Changes the style of the selection manager VectorLayer based on if the addon is active or not.
             * @returns {void}
             */
        openAddon () {
            const selectionLayer = this.map.getLayers().getArray().filter(layer => layer.get("name") === "selection_manager");

            if (!this.openAddon) {
                const style = new Style({
                    stroke: new Stroke({
                        color: "#A8404E",
                        width: 4
                    })
                });

                if (selectionLayer.length > 0) {
                    selectionLayer[0].setStyle(style);
                }
            }
            else {
                const style = new Style({
                    fill: new Fill({
                        color: "rgba(214, 96, 93, 0.35)"
                    }),
                    stroke: new Stroke({
                        color: "#D6605D",
                        width: 1
                    })
                });

                if (selectionLayer.length > 0) {
                    selectionLayer[0].setStyle(style);
                }
            }
        },
        /**
             * @description Sets the all selections button active again if the this.selections array changes.
             * @returns {void}
             */
        selections () {
            this.allSelectionsPossible = true;
        }
    },
    created () {
        this.map = mapCollection.getMap("2D");
    },
    methods: {
        ...mapMutations("Tools/SelectionManager", Object.keys(mutations)),
        ...mapActions("Tools/SelectionManager", Object.keys(actions)),
        ...mapMutations("Maps", ["setLayerVisibility", "addLayerToMap", "removeLayerFromMap"]),
        /**
             * @description Creates VectorLayer for the chosen selection
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @param {boolean} forceUpdate - update even if selection hasn't changed
             * @returns {void}
             */
        highlightSelection (index) {
            if (this.activeSelection !== index) {
                this.setActiveSelection(index);
                if (this.selections[index].storedLayers.length > 0) {
                    this.setStoredLayersActive(this.selections[index].storedLayers);
                }
                if (this.selections[index].settings.bufferActive) {
                    this.rerenderSelection(index);
                }
                else {

                    //  remove selection manager layers
                    this.map.getLayers().getArray().filter(layer => layer.get("name") === "selection_manager").forEach(layer => this.map.removeLayer(layer));

                    const vectorSource = new VectorSource({
                            features: this.selections[index].selection
                        }),
                        layer = new VectorLayer({
                            name: "selection_manager",
                            source: vectorSource,
                            style: new Style({
                                fill: new Fill({
                                    color: "rgba(214, 96, 93, 0.35)"
                                }),
                                stroke: new Stroke({
                                    color: "#D6605D",
                                    width: 3
                                })
                            })
                        });

                    layer.setZIndex(9999);
                    this.map.addLayer(layer);

                    setBBoxToGeom.call(this, getBoundingGeometry(this.selections[index].selection, 0));
                }
            }
            else {
                this.removeLayer();
                this.setActiveSelection(null);
            }
        },
        /**
             * @description Creates VectorLayer for the chosen selection if there is a buffer value and overwrites standard selection.
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @returns {void}
             */
        rerenderSelection (index) {
            if (this.activeSelection === index) {

                //  remove selection manager layers
                this.map.getLayers().getArray().filter(layer => layer.get("name") === "selection_manager").forEach(layer => this.map.removeLayer(layer));

                const vectorSource = new VectorSource({
                        features: this.selections[index].bufferedSelection
                    }),
                    layer = new VectorLayer({
                        name: "selection_manager",
                        source: vectorSource,
                        style: new Style({
                            fill: new Fill({
                                color: "rgba(214, 187, 47, 0.35)"
                            }),
                            stroke: new Stroke({
                                color: "#D6B62F",
                                width: 3
                            })
                        })
                    });

                layer.setZIndex(9999);
                this.map.addLayer(layer);

                setBBoxToGeom.call(this, getBoundingGeometry(this.selections[index].bufferedSelection));
            }
        },
        /**
             * @description Creates VectorLayer for the chosen selection on hover in the selection menu.
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @returns {void}
             */
        hoverSelection (index) {
            this.map.getLayers().getArray().filter(layer => layer.get("name") === "selection_manager_hover_layer").forEach(layer => this.map.removeLayer(layer));

            const vectorSource = new VectorSource({
                    features: this.selections[index].selection
                }),
                layer = new VectorLayer({
                    name: "selection_manager_hover_layer",
                    source: vectorSource,
                    style: new Style({
                        fill: new Fill({
                            color: "rgba(214, 96, 93, 0.2)"
                        })
                    })
                });

            layer.setZIndex(9999);
            this.map.addLayer(layer);
        },
        /**
             * @description Removes the hover selection layer.
             * @returns {void}
             */
        resetHovers () {
            this.map.getLayers().getArray().filter(layer => layer.get("name") === "selection_manager_hover_layer").forEach(layer => this.map.removeLayer(layer));
        },
        /**
             * @description Stores current layers or resets the stored layers in chosen selection
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @returns {void}
             */
        storeLayers (index) {
            if (this.selections[index].storedLayers.length > 0) {
                this.selections[index].storedLayers = [];
            }
            else {
                this.selections[index].storedLayers = this.activeLayerList;
            }
        },
        /**
             * @description Sets the storedLayers from the selection active and all other theme data layers inactive
             * @param {Array} storedLayers - The names of the stored layers inside the saved selection
             * @returns {void}
             */
        setStoredLayersActive (storedLayers) {
            //  inverse the stored layers to get the theme data layers that are about to hideflat().filter(layer => !storedLayers.includes(layer.id)),
            this.activeVectorLayerList.forEach(layer => {
                const layerId = layer.getProperties().id,
                    model = getModelByAttributes({type: "layer", id: layerId});

                if (model) {
                    model.set("isSelected", false);
                }
            });

            storedLayers.forEach(layerName => {
                const model = getModelByAttributes({type: "layer", name: layerName});

                if (model) {
                    model.set("isSelected", true);
                }
                else {
                    addModelsByAttribute({name: layerName});
                }
            });
        },
        /**
             * @description Adds index of selection to extendedOptions to extend to option menu in the frontend.
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @returns {void}
             */
        setExtendedOptions (index) {
            if (this.extendedOptions.includes(index)) {
                this.extendedOptions.splice(this.extendedOptions.indexOf(index), 1);
            }
            else {
                this.extendedOptions.push(index);
            }
        },
        /**
             * @description Creates new single selection from all avaible selections in the this.selections array.
             * @returns {void}
             */
        allSelections () {
            const flatArray = this.selections.map(selection => selection.selection).flat();

            this.addNewSelection({selection: flatArray, source: this.$t("additional:modules.tools.cosi.selectionManager.title"), id: this.$t("additional:modules.tools.cosi.selectionManager.allSelections") + " (" + this.selections.length + ")"});
            this.highlightSelection(this.selections.length - 1);
            this.allSelectionsPossible = false;
        },
        /**
             * @description Calculates the center of each feature and draws a polygon along these points.
             * @param {Array} selectionArray - Array of selections that i supposed to be connected
             * @returns {void}
             */
        connectSelections (selectionArray) {
            const format = new GeoJSON(),
                newPolygonCoords = [],
                selectionsCopy = selectionArray.map(selection => selection.selection);

            selectionsCopy.forEach(selection => {
                if (Array.isArray(selection)) {
                    selection.forEach(subSelection => {
                        const centerOfPolygon = turfCenterOfMass(format.writeFeatureObject(subSelection));

                        newPolygonCoords.push(centerOfPolygon);
                    });
                }
                else {
                    const centerOfPolygon = turfCenterOfMass(format.writeFeatureObject(selection));

                    newPolygonCoords.push(centerOfPolygon);
                }
            });

            selectionsCopy.push(new Feature(new Polygon([newPolygonCoords.map(point => point.geometry.coordinates)])));
            this.addNewSelection({selection: selectionsCopy.flat(), source: this.$t("additional:modules.tools.cosi.selectionManager.title"), id: this.$t("additional:modules.tools.cosi.selectionManager.connectedSelections") + " (" + selectionsCopy.length - 1 + ")"});
            this.highlightSelection(this.selections.length - 1);
        },
        /**
             * @description Toggles the buffered selection to overwrite standard selection on the OL Layer.
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @returns {void}
             */
        triggerBuffer (index) {
            if (this.selections[index].settings.bufferActive) {
                this.selections[index].settings.bufferActive = false;
                if (this.activeSelection === index) {
                    this.setActiveSelection(null);
                    this.highlightSelection(index);
                }
            }
            else {
                this.selections[index].settings.bufferActive = true;
                if (this.activeSelection === index) {
                    this.rerenderSelection(index);
                }
            }
        },
        /**
             * @description If the buffer value changes (at input v-slider) updates the buffered selection.
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @returns {void}
             */
        polygonChange (index) {
            const newGeometry = getBoundingGeometry(this.selections[index].selection, this.selections[index].settings.buffer),
                transformedPolygons = [];

            newGeometry.getGeometries().forEach(geometry => {
                transformedPolygons.push(new Feature(geometry));
            });

            this.selections[index].bufferedSelection = transformedPolygons;

            if (this.selections[index].settings.bufferActive && this.activeSelection === index) {
                this.rerenderSelection(index);
            }
        },
        /**
             * @description Creates a new selection from the buffered value.
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @returns {void}
             */
        addBufferAsSelection (index) {
            this.addNewSelection({selection: this.selections[index].bufferedSelection, source: this.$t("additional:modules.tools.cosi.selectionManager.title"), id: this.$t("additional:modules.tools.cosi.selectionManager.buffer") + " " + this.selections[index].id});
            this.selections[index].settings.buffer = 0;
            this.selections[index].settings.bufferActive = false;
            this.highlightSelection(this.selections.length - 1);
        },
        /**
             * @description Removes the selection_manager layer from the map
             * @returns {void}
             */
        removeLayer () {
            this.setActiveSelection(null);
            this.map.getLayers().getArray().filter(layer => layer.get("name") === "selection_manager").forEach(layer => this.map.removeLayer(layer));
        },
        /**
             * @description Removes a single selection from the this.selections array
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @returns {void}
             */
        removeSelection (index) {
            this.selections.splice(index, 1);

            if (this.selections.length === 0) {
                this.removeLayer();
            }
        },
        /**
         * @description Resets the whole this.selections array
         * @returns {void}
         */
        removeAllSelections () {
            this.clearAllSelections();
            this.removeLayer();
            this.setActiveSelection(null);
        },
        /**
             * @description Merges selections from selectionToMerge array into a single selection.
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @returns {void}
             */
        addMergedSelection () {
            const flatSelections = this.selections.filter((selection, i) => this.selectionsToMerge.includes(i)).map(selection => selection.selection),
                flatArray = flatSelections.flat();

            this.addNewSelection({selection: flatArray, source: this.$t("additional:modules.tools.cosi.selectionManager.title"), id: this.$t("additional:modules.tools.cosi.selectionManager.mergedSelections") + " (" + this.selectionsToMerge.length + ")"});
            this.selectionsToMerge = [];
            this.highlightSelection(this.selections.length - 1);
        },
        /**
             * @description Adds index of single selection to the this.selectionsToMerge array (or removes it).
             * @param {Integer} index - Index of the chosen selection in this.selections
             * @returns {void}
             */
        mergeSelections (index) {
            if (this.selectionsToMerge.includes(index)) {
                this.selectionsToMerge.splice(this.selectionsToMerge.indexOf(index), 1);
            }
            else {
                this.selectionsToMerge.push(index);
            }
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="!dashboardOpen && selections.length > 0"
        id="sm"
        class="sm_addon_container"
        :style="{bottom: upperEdge + 10 + 'px'}"
    >
        <button
            id="sm_btn"
            class="addon_icon cosi_menu_btn"
            :class="{highlight: openAddon}"
            @click="openAddon = !openAddon"
        >
            <v-icon>mdi-selection-ellipse-arrow-inside</v-icon>
        </button>
        <div
            id="sm_wrapper"
            class="addon_wrapper"
            :class="{
                open: openAddon
            }"
        >
            <div class="selection_menu">
                <div class="addon_head">
                    <p>{{ $t('additional:modules.tools.cosi.selectionManager.title') }}</p>
                    <ToolInfo
                        :url="readmeUrl"
                        :locale="currentLocale"
                    />
                </div>
                <div class="function_buttons all_function_buttons">
                    <button
                        class="all_btn"
                        :title="$t('additional:modules.tools.cosi.selectionManager.title_all_selections')"
                        :class="{disabled: selections.length < 2 || !allSelectionsPossible}"
                        @click="allSelections()"
                    >
                        <v-icon>mdi-selection-ellipse-arrow-inside</v-icon>
                    </button>
                    <button
                        class="connect_btn"
                        :title="$t('additional:modules.tools.cosi.selectionManager.title_connect_selections')"
                        :class="{disabled: selections.map(selection => selection.selection).flat().length > 3}"
                        @click="connectSelections(selections)"
                    >
                        <v-icon>mdi-vector-selection</v-icon>
                    </button>
                    <button
                        class="remove_all_btn"
                        :title="$t('additional:modules.tools.cosi.selectionManager.title_remove_all')"
                        @click="removeAllSelections()"
                    >
                        <v-icon>mdi-close-box-multiple</v-icon>
                    </button>
                </div>
                <div class="cache">
                    <div class="cache_head">
                        <p>{{ $t('additional:modules.tools.cosi.selectionManager.cache') }}</p>
                        <div class="function_buttons cache_buttons">
                            <button
                                v-if="selectionsToMerge.length > 0"
                                :title="$t('additional:modules.tools.cosi.selectionManager.title_merge')"
                                class="combine_btn"
                                @click="addMergedSelection()"
                            >
                                <v-icon>mdi-vector-combine</v-icon>
                            </button>
                            <button
                                class="connect_btn"
                                :title="$t('additional:modules.tools.cosi.selectionManager.title_connect_selections')"
                                :class="{disabled: selections.map(selection => selection.selection).flat().length < 3}"
                                @click="connectSelections()"
                            >
                                <v-icon>mdi-vector-selection</v-icon>
                            </button>
                            <button
                                class="remove_all_btn"
                                :title="$t('additional:modules.tools.cosi.selectionManager.title_remove_all')"
                                @click="removeAllSelections()"
                            >
                                <v-icon>mdi-close-box-multiple</v-icon>
                            </button>
                        </div>
                    </div>
                    <ul class="cache_selections">
                        <li
                            v-for="(selection, i) in selectionsToMerge"
                            :key="i"
                            class="cache_selection"
                        >
                            {{ selection }}
                            <button
                                class="remove_cached_btn"
                                :title="$t('additional:modules.tools.cosi.selectionManager.title_remove_cached_selection')"
                                @click="selectionsToMerge.splice(i, 1);"
                            >
                                <v-icon>mdi-close</v-icon>
                            </button>
                        </li>
                    </ul>
                </div>
                <ul class="groups">
                    <li
                        v-for="(group, index) in selectionGroups"
                        :key="index"
                        class="grouplevel"
                    >
                        <div class="group_header">
                            {{ group }}
                        </div>
                        <ul class="selections">
                            <template v-for="(selection, i) in selections">
                                <li
                                    v-if="selection.source === group"
                                    :key="i"
                                    class="selectionlevel"
                                    :class="{
                                        extended: extendedOptions.includes(i),
                                        hoverHighlight: selectionsToMerge.includes(i) && activeSelection !== i
                                    }"
                                    @hover="hoverSelection(i)"
                                    @focus="hoverSelection(i)"
                                >
                                    <p>{{ selection.id }}</p>
                                    <ul
                                        class="function_buttons"
                                    >
                                        <button
                                            class="view_btn"
                                            :title="$t('additional:modules.tools.cosi.selectionManager.title_view')"
                                            :class="{
                                                highlight: activeSelection === i,
                                                scaledHighlight: selection.settings.bufferActive,
                                            }"
                                            @click.exact="highlightSelection(i)"
                                        >
                                            <v-icon>mdi-eye-outline</v-icon>
                                        </button>
                                        <button
                                            v-if="selections.length > 1"
                                            :title="$t('additional:modules.tools.cosi.selectionManager.title_add')"
                                            class="add_btn"
                                            :class="{
                                                highlight: selectionsToMerge.includes(i),
                                            }"
                                            @click="mergeSelections(i)"
                                        >
                                            <v-icon>mdi-plus</v-icon>
                                        </button>
                                        <!--<button
                                            v-if="selectionsToMerge.length > 0 && activeSelection === i"
                                            :title="$t('additional:modules.tools.cosi.selectionManager.title_merge')"
                                            class="combine_btn"
                                            @click="addMergedSelection(i)"
                                        >
                                            <v-icon>mdi-vector-combine</v-icon>
                                        </button>-->
                                        <button
                                            class="freeze_btn"
                                            :class="{highlight: selection.storedLayers.length > 0}"
                                            :title="selection.storedLayers.length > 0 ? selection.storedLayers.join(', ') : $t('additional:modules.tools.cosi.selectionManager.title_stored')"
                                            @click="storeLayers(i)"
                                        >
                                            <template v-if="selection.storedLayers.length > 0">
                                                <v-icon>mdi-anchor</v-icon>
                                            </template>
                                            <template v-else>
                                                <v-icon>mdi-layers-plus</v-icon>
                                            </template>
                                        </button>
                                        <button
                                            :title="$t('additional:modules.tools.cosi.selectionManager.title_extended_options')"
                                            class="option_btn"
                                            :class="{highlight: extendedOptions.includes(i)}"
                                            @click="setExtendedOptions(i)"
                                        >
                                            <v-icon>mdi-tools</v-icon>
                                        </button>
                                        <button
                                            :title="$t('additional:modules.tools.cosi.selectionManager.title_remove')"
                                            class="remove_btn"
                                            @click="removeSelection(i)"
                                        >
                                            <v-icon>mdi-close</v-icon>
                                        </button>
                                    </ul>
                                    <div class="extended_options">
                                        <v-text-field
                                            v-model="selection.settings.buffer"
                                            max="1500"
                                            min="-1500"
                                            type="number"
                                            @input="polygonChange(i)"
                                        />
                                        <v-slider
                                            v-model="selection.settings.buffer"
                                            max="1500"
                                            min="-1500"
                                            step="10"
                                            :title="$t('additional:modules.tools.cosi.selectionManager.title_slider')"
                                            @input="polygonChange(i)"
                                        />
                                        <button
                                            :title="$t('additional:modules.tools.cosi.selectionManager.title_toggle_buffer')"
                                            class="activate_btn"
                                            :class="{highlight: selection.settings.bufferActive}"
                                            @click="triggerBuffer(i)"
                                        >
                                            <v-icon>mdi-selection-drag</v-icon>
                                        </button>
                                        <button
                                            v-if="selection.settings.bufferActive && selection.settings.buffer !== 0"
                                            :title="$t('additional:modules.tools.cosi.selectionManager.title_buffer_selection')"
                                            class="add_buffer_btn"
                                            @click="addBufferAsSelection(i)"
                                        >
                                            <v-icon>mdi-plus-box-multiple</v-icon>
                                        </button>
                                    </div>
                                </li>
                            </template>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>


<style lang="scss">
    @import "../../utils/variables.scss";
        .sm_addon_container {
            position:fixed;
            z-index:5000;
            left:18px;

            .addon_icon {
                position:absolute;
                left:0;
                bottom:0;
                width:44px;
                height:36px;
                background:$buttongrey;
                border:1px solid #aaa;
                @include drop_shadow;

                .v-icon {
                    font-size:24px;
                }

                &.highlight {
                    border:1px solid $brightblue;
                    background:whitesmoke;
                }
            }

            .addon_wrapper {
                position:absolute;
                bottom:0;
                left:50px;
                width:450px;
                height:0;
                background:white;
                transition:0.3s;
                overflow:hidden;
                @include drop_shadow;

                &.mergeHover {
                    background:rgba(255,255,255,0.85);
                    backdrop-filter:blur(5px);
                    outline:2px solid $masterportal_blue;
                }

                .addon_head {
                    p {
                        font-size: 120%;
                        font-weight: 700;
                        color: black;
                        margin-left: 10px;
                        padding-top: 15px;
                        margin-bottom: -25px;
                    }
                }

                .all_function_buttons {
                    width:90px;
                    height:30px;
                    margin:0px 5px 0px auto;
                    border-bottom: 1px solid #aaa;
                    display:flex;
                    flex-flow:row wrap;
                    justify-content:flex-end;

                    button {
                        flex-basis:20px;
                        height:20px;
                        background:#424242;
                        margin-top:5px;
                        margin-left:5px;

                        &.disabled {
                            pointer-events:none;
                            opacity:0.6;
                        }

                        &.remove_all_btn {
                            background:#D6605D;
                        }

                        .v-icon {
                            font-size:16px;
                            color:whitesmoke;
                        }
                    }
                }

                &.open {
                    height:auto;
                    overflow-y:auto;
                    overflow-x:hidden;
                    max-height:68vh;
                    transition:0.3s;
                }

                ul {
                    display:flex;
                    flex-flow:row wrap;
                    width:100%;
                    padding:0;
                    list-style:none;

                    li {
                        flex:1 0 100%;
                    }
                }

                .cache {
                    margin:5px;

                    ul {
                        justify-content:flex-end;

                        li {
                            flex:0 0 auto;
                            padding:5px 10px;
                            font-size:10px;
                            margin-left:3px;
                            margin-top:3px;
                            background:#ccc;

                            button {
                                margin-left:10px;

                                .v-icon {
                                    font-size:10px;
                                    color:#444;
                                }
                            }
                        }
                    }
                }

                ul.groups {
                    .group_header {
                        width:100%;
                        height:40px;
                        line-height:40px;
                        color:black;
                        font-weight:700;
                        padding-left:10px;
                        border-bottom:1px solid #aaa;
                    }

                    li.grouplevel {
                    }

                    ul.selections {
                        li.selectionlevel {
                            display:flex;
                            flex-flow:row wrap;
                            flex:1 0 100%;
                            background:whitesmoke;
                            border-bottom:1px solid #ccc;
                            height:30px;
                            padding-left:20px;
                            text-align:left;
                            box-sizing:border-box;
                            overflow:hidden;
                            transition:0.15s;

                            &.hoverHighlight {
                                background:#ddd;
                                border-right:2px solid $brightred;
                            }

                            &.extended {
                                height:70px;
                            }

                            .extended_options {
                                    display:flex;
                                    flex-flow:row wrap;
                                    justify-content:flex-end;
                                    height:40px;
                                    padding:5px;
                                    flex:1 0 100%;
                                    box-sizing:border-box;

                                    button {
                                        flex-basis:20px;
                                        height:20px;
                                        background:#424242;
                                        margin:5px 0px 0px 5px;

                                        .v-icon {
                                            color:whitesmoke;
                                            font-size:16px;
                                        }
                                    }

                                    button.activate_btn {
                                        &.highlight {
                                            background:#D6B62F;
                                        }
                                    }

                                    .v-text-field {
                                        background:white;
                                        height:30px;
                                        flex:0 0 50px;
                                        padding: 0;
                                        margin: 0;
                                        border: 1px solid #ccc;

                                        .v-input__slot {
                                            &:before, &:after {
                                                display:none;
                                            }
                                        }

                                        input {
                                            text-align:center;
                                            font-size:100%;
                                        }
                                    }

                                    .v-input__slider {
                                        height:30px;
                                        flex:0 0 80px;

                                        .v-slider__thumb:before {
                                            display:none;
                                        }
                                    }
                                }

                            p {
                                flex-basis:calc(100% - 140px);
                                line-height:30px;
                            }

                            ul.function_buttons {
                                display:flex;
                                flex-flow:row wrap;
                                flex-basis:130px;
                                justify-content: flex-end;
                                padding-right: 5px;
                                margin: 0px 0px 0px auto;

                                button {
                                    flex-basis:20px;
                                    height:20px;
                                    background:#424242;
                                    margin-top:5px;
                                    margin-left:5px;

                                    &.view_btn {
                                        &.highlight {
                                            background:#D6605D;

                                            &.scaledHighlight {
                                                background:#D6B62F;

                                                .v-icon {
                                                    color:#222;
                                                }
                                            }

                                            &:hover {
                                                filter:invert(0);
                                            }
                                        }
                                    }

                                    &.combine_btn {
                                        background:$brightred;

                                        .v-icon {
                                            color:whitesmoke;
                                        }

                                        &:hover {
                                            border:1px solid $brightred;
                                            background:whitesmoke;

                                            .v-icon {
                                                color:$brightred;
                                            }
                                        }
                                    }

                                    &.add_btn {
                                        background:whitesmoke;
                                        border:1px solid #ccc;

                                        .v-icon {
                                            color:$brightred;
                                        }

                                        &.highlight {
                                            background:$brightred;

                                            .v-icon {
                                                color:whitesmoke;
                                            }
                                        }
                                    }

                                    &.freeze_btn {
                                        &.highlight {
                                            background:$masterportal_blue;
                                        }
                                    }

                                    &.option_btn {
                                        &.highlight {
                                            background:whitesmoke;
                                            border:1px solid #222;

                                            .v-icon {
                                                color:#222;
                                            }
                                        }
                                    }

                                    &.remove_btn {
                                        background:$error_red;
                                    }

                                    &:hover {
                                        outline:1px solid #222;
                                        background:whitesmoke;

                                        .v-icon {
                                            color:#222;
                                        }
                                    }

                                    .v-icon {
                                        font-size:16px;
                                        color:whitesmoke;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
</style>
