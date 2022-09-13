<script>
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersExportPDF";
import mutations from "../store/mutationsExportPDF";
import actions from "../store/actionsExportPDF";

export default {
    name: "ExportPDF",
    components: {
        Tool
    },
    data () {
        return {
            selectedLayer: null,
            log: {
                i: "-",
                val: "-"
            }
        };
    },
    computed: {
        ...mapGetters("Tools/ExportPDF", Object.keys(getters)),
        ...mapGetters("Maps", ["getVisibleLayerList"]),
        layerList () {
            return this.getVisibleLayerList
                .filter(layer => layer.getSource().getFeatures)
                .map(layer => ({
                    name: layer.get("name"),
                    layer
                }));
        }
    },
    watch: {
    },
    created () {
        this.$on("close", () => {
            this.setActive(false);
        });
    },
    mounted () {
        console.log(this.$store);

        console.log(this);
    },
    methods: {
        ...mapMutations("Tools/DistrictSelector", Object.keys(mutations)),
        ...mapActions("Tools/DistrictSelector", Object.keys(actions)),
        moveRandomGeometry () {
            const features = this.selectedLayer.layer.getSource().getFeatures(),
                randIndex = Math.floor(Math.random() * features.length),
                selectedFeature = features[randIndex];

            console.log(randIndex, selectedFeature);

            selectedFeature.getGeometry().translate(randIndex * 100, randIndex * 100);

            this.log.i = randIndex;
            this.log.val = randIndex * 100;
        }
    }
};
</script>

<template lang="html">
    <Tool
        :title="$t('additional:modules.tools.cosi.exportPDF.title')"
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
            <v-select
                v-model="selectedLayer"
                :items="layerList"
                item-text="name"
                return-object
            />
            <v-btn
                :disabled="!selectedLayer"
                @click="moveRandomGeometry"
            >
                Click me!
            </v-btn>
            <h3>
                Index: {{ log.i }}, Value: {{ log.val }}
            </h3>
        </template>
    </Tool>
</template>

<style lang="scss" scoped>
</style>
