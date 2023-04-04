<script>
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";
import {mapGetters, mapMutations} from "vuex";
import mutations from "../store/mutationsPolygonStyler";
import getters from "../store/gettersPolygonStyler";
import WebGLVectorLayerRenderer from "ol/renderer/webgl/VectorLayer.js";
import {packColor} from "ol/renderer/webgl/shaders";
// import {convertToHexColor, convertColor} from "../../../../src/utils/convertColor.js";
// import PolygonStylerDialog from './PolygonStylerDialog.vue';

export default {
    name: "PolygonStyler",
    components: {
        Tool
    },
    data () {
        return {
            // just webgl layer
            layerList: [],
            selectedLayerNameList: [],
            headers: [
                {
                    text: "Thema",
                    value: "name"
                },
                {
                    text: "Attribut",
                    value: "featureAttributes"
                },
                {
                    text: "Stylen",
                    value: "editButton"
                }
            ],
            headersTwo: [
                {
                    text: "Attribut",
                    value: "attribute"
                },
                {
                    text: "Farbe",
                    value: "color",
                    sortable: false
                }
            ],
            dialog: false,
            colorPickerDialog: false,
            uniqueValues: [],
            color: "",
            selectedItem: null,
            currentColorList: [],
            selectedLayer: undefined
        };
    },
    computed: {
        ...mapGetters("Tools/PolygonStyler", Object.keys(getters)),
        ...mapGetters("Tools/FeaturesList", ["activeVectorLayerList"]),

        layerNameList () {
            return this.layerList.map(layer => layer.get("name"));
        },

        selectedLayerList () {
            return this.layerList.filter(layer => this.selectedLayerNameList.includes(layer.get("name")));
        },

        layerItemList () {
            return this.selectedLayerList.map(layer => {
                return {
                    name: layer.get("name"),
                    layer,
                    features: layer.getSource().getFeatures(),
                    featureAttributes: this.getAttributes(layer.get("gfiAttributes")),
                    editButton: "mdi-pencil"
                };
            });
        }
    },
    watch: {
        activeVectorLayerList () {
            if (this.activeVectorLayerList.length === 0) {
                return;
            }
            this.layerList = this.activeVectorLayerList.filter(layer => {
                return layer.get("renderer") === "webgl" && layer.get("isPointLayer") === false;
            });
        },
        dialog () {
            if (!this.dialog) {
                this.layerItemList.forEach(item => {
                    item.layer.renderer_ = new WebGLVectorLayerRenderer(item.layer, this.getRenderFunctions(item.colorList, item.selectAttribute));
                    mapCollection.getMap("2D").renderSync();
                });
            }
        }
    },
    created () {
        this.$on("close", () => {
            this.setActive(false);
        });
    },
    methods: {
        ...mapMutations("Tools/PolygonStyler", Object.keys(mutations)),

        getRenderFunctions (colorList, attribute) {
            return {
                /**
                 * Used for polygon fills
                 * Reads the relevant properties from the Masterportal style object
                 * @see https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/doc/style.json.md
                 */
                fill: {
                    attributes: {
                        color: (feature) => {
                            const t = colorList.find(color => color.attribute === feature.get(attribute));

                            if (packColor(t?.color) !== 0) {
                                return packColor(t.color);
                            }
                            return packColor("#006688");
                        },
                        opacity: () => {
                            return 0.5;
                        }
                    }
                },
                stroke: {
                    /**
                     * Used for polygon edges and lineStrings
                     * Reads the relevant properties from the Masterportal style object
                     * @see https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/doc/style.json.md
                     */
                    attributes: {
                        color: () => {
                            return "#006688";
                        },
                        width: () => {
                            return 1;
                        }
                    }
                }
            };
        },

        getAttributes (attr) {
            return Object.keys(attr).map(key => {
                return {
                    value: key,
                    text: attr[key]
                };
            });
        },

        setCurrentColorList (colorList) {
            this.currentColorList = colorList;
            this.dialog = true;
        },

        test (item) {
            this.colorPickerDialog = true;
            this.selectedItem = item;
        },

        testTwo (color) {
            this.selectedItem.color = color.hex;

        },

        setFeatureValues (layerItem, attributeName) {
            const allValues = layerItem.features.map(feature => feature.get(attributeName)),
                uniqueValues = [...new Set(allValues)];

            layerItem.colorList = this.getColorMap(uniqueValues);
            layerItem.selectAttribute = attributeName;
        },

        getColorMap (values) {
            return values.map(val => {
                return {
                    attribute: val,
                    color: "#e3e3e3"
                };
            });
        }

    }
};
</script>

<template>
    <Tool
        :title="$t('additional:modules.tools.cosi.districtSelector.title')"
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
            <v-app>
                <v-select
                    v-model="selectedLayerNameList"
                    :items="layerNameList"
                    multiple
                />
                <v-data-table
                    :headers="headers"
                    :items="layerItemList"
                    :hide-default-footer="true"
                    :hide-default-header="true"
                >
                    <template #[`item.featureAttributes`]="{ item}">
                        <v-select
                            :items="item.featureAttributes"
                            return-object
                            @change="setFeatureValues(item, $event.value)"
                        />
                    </template>
                    <template #[`item.editButton`]="{ item }">
                        <v-btn
                            icon
                            @click="setCurrentColorList(item.colorList)"
                        >
                            <v-icon>{{ item.editButton }}</v-icon>
                        </v-btn>
                    </template>
                </v-data-table>
                <!-- <PolygonStylerDialog
                    :dialog="dialog"
                    :items="currentColorList"
                    @hideDialog="dialog = false"
                /> -->
                <v-dialog
                    v-model="dialog"
                    max-width="590"
                    scrollable
                >
                    <v-card tile>
                        <v-card-text>
                            <v-data-table
                                :headers="headersTwo"
                                :items="currentColorList"
                                :hide-default-footer="true"
                                :items-per-page="-1"
                            >
                                <template #[`item.color`]="{ item }">
                                    <v-avatar
                                        :color="item.color"
                                        size="24"
                                        @click="test(item)"
                                    />
                                </template>
                            </v-data-table>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn
                                color="green darken-1"
                                text
                                @click="dialog = false"
                            >
                                Anwenden
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
                <v-dialog
                    v-model="colorPickerDialog"
                    max-width="290"
                >
                    <v-card tile>
                        <v-card-text>
                            <v-color-picker
                                v-model="color"
                                dot-size="25"
                                @update:color="testTwo"
                            />
                        </v-card-text>
                        <v-card-actions>
                            <v-btn
                                color="green darken-1"
                                text
                                @click="colorPickerDialog = false"
                            >
                                Übernehmen
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </v-app>
        </template>
    </Tool>
</template>

<style lang="scss" scoped>
</style>
