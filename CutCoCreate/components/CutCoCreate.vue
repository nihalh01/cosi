<script>
import Tool from "../../../src/modules/tools/Tool.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersCutCoCreate";
import mutations from "../store/mutationsCutCoCreate";
import {initializeLayerList} from "masterportalAPI/src/rawLayerList";
import actions from "../../schoolRoutePlanning/store/actionsSchoolRoutePlanning";

export default {
    name: "CutCoCreate",
    components: {
        Tool
    },
    data () {
        return {
            colors: [
                "primary",
                "secondary",
                "yellow darken-2",
                "red",
                "orange",
            ],
            model: 0
        };
    },
    computed: {
        ...mapGetters("Tools/CutCoCreate", Object.keys(getters))
    },
    created () {
        this.$on("close", this.close);
        this.fetchStoryConfig(Config.storyConf);
    },
    /**
     * Put initialize here if mounting occurs after config parsing
     * @returns {void}
     */
    mounted () {
        this.applyTranslationKey(this.name);
    },
    methods: {
        ...mapMutations("Tools/CutCoCreate", Object.keys(mutations)),
        ...mapActions("Tools/CutCoCreate", Object.keys(actions)),
        // These application wide getters and setters can be found in 'src/modules/map/store'
        ...mapMutations("Map", ["setCenter", "setLayerVisibility"]),
        ...mapGetters("Map", ["layerList", "visibleLayerList", "map"]),

        /**
         * Triggered when the next or previous steps are selected
         * Step specific changes are to be processed here
         * @returns {void}
         */
        storyStepChange (e) {
            const currentStep = this.storyConf.steps[e];
            if (Object.prototype.hasOwnProperty.call(currentStep, "flyToCoordinate")) {
                const mapView = this.map().getView();
                mapView.animate({
                    center: currentStep.flyToCoordinate,
                    duration: 2000,
                    zoom: currentStep.flyToZoom
                });
                console.log("center on step " + e);
            }
            if (Object.prototype.hasOwnProperty.call(currentStep, "layers")) {
                const layerList = this.layerList();
                for (const layer of layerList) {
                    if (currentStep.layers.includes(layer.values_.id)) {
                        this.setLayerVisibility(layer.values_.id, true);
                    } else {
                        this.setLayerVisibility(layer.values_.id, false);
                    }
                }
            }
        },

        /**
         * Closes this tool window by setting active to false
         * @returns {void}
         */
        close () {
            this.setActive(false);

            // TODO replace trigger when Menu is migrated
            // set the backbone model to active false for changing css class in menu (menu/desktop/tool/view.toggleIsActiveClass)
            // else the menu-entry for this tool is always highlighted
            const model = Radio.request("ModelList", "getModelByAttributes", {id: this.$store.state.Tools.CutCoCreate.id});

            if (model) {
                model.set("isActive", false);
            }
        },

        /**
         * Load the JSON configuration for the story mapping
         * @param {string} storyConfUrl - JSON url from assets f
         * @returns {void}
         */
        fetchStoryConfig (storyConfUrl) {
            initializeLayerList(storyConfUrl,
                (storyConf, error) => {
                    if (error) {
                        Radio.trigger("Alert", "alert", {
                            text: "<strong>Die Datei '" + storyConfUrl + "' konnte nicht geladen werden!</strong>",
                            kategorie: "alert-warning"
                        });
                    } else {
                        this.setStoryConf(storyConf);
                    }
                });
        }
    }
};
</script>

<template lang="html">
    <Tool
        :title="$t(name)"
        :icon="glyphicon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
        :initialWidth="700"
    >
        <template #toolBody>
            <div
                v-if="active"
                id="vue-addon"
            >
                <v-app>
                    <div class="text-h3">
                        {{ storyConf.name }}
                    </div>
                    <div v-if="storyConf !== undefined && storyConf.hasOwnProperty('steps')">
                        <v-carousel v-model="model"
                                    :continuous="false"
                                    hide-delimiters
                                    @change="storyStepChange"
                        >
                            <v-carousel-item
                                v-for="(step, index) in storyConf.steps"
                            >
                                <v-sheet
                                    height="100%"
                                    tile
                                >
                                    <v-row
                                        align="start"
                                        justify="center"
                                    >
                                        <div class="text-h5">
                                            {{ step.title }}
                                        </div>
                                    </v-row>
                                    <v-row
                                        align="start"
                                        justify="center"
                                    >
                                        <div class="text">
                                            {{step}}
                                        </div>
                                    </v-row>
                                    <v-row
                                        style="height: 30px"
                                        align="end"
                                        justify="center"
                                    >
                                        <div class="text">
                                            Story step {{ index + 1 }} / {{ storyConf.steps.length }}
                                        </div>
                                    </v-row>
                                </v-sheet>
                            </v-carousel-item>
                        </v-carousel>
                    </div>
                </v-app>
            </div>
        </template>
    </Tool>
</template>
