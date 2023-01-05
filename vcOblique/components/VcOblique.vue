<script>
import Vue from "vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import {getComponent} from "../../../src/utils/getComponent";
import ToolTemplate from "../../../src/modules/tools/ToolTemplate.vue";
import mutationsObliqueViewer from "../store/mutationsVCOblique";
import iframeResize from "../node_modules/iframe-resizer/js/iframeResizer";

Vue.directive("resize", {
    bind: function (el, {value = {}}) {
        el.addEventListener("load", () => iframeResize(value, el));
    },
    unbind: function (el) {
        el?.iFrameResizer?.removeListeners();
    }
});

export default {
    name: "VcOblique",
    components: {
        ToolTemplate
    },
    computed: {
        ...mapGetters("Tools/VcOblique", [
            "active",
            "deactivateGFI",
            "defaultMapMarkerStyleId",
            "icon",
            "initialWidth",
            "name",
            "obliqueViewerURL",
            "renderToWindow",
            "resizableWindow"
        ]),
        ...mapGetters("Maps", ["clickCoordinate", "initialCenter"]),
        ...mapGetters({
            isMobile: "mobile"
        })
    },
    watch: {
        active (value) {
            if (value) {
                this.$nextTick(() => {
                    this.setObliqueViewerURL(this.initialCenter);
                    this.initObliqueView();
                });
            }
            else {
                this.resetObliqueViewer();
            }
        },
        clickCoordinate (value) {
            if (this.active === true) {
                this.setObliqueView(value);
            }
        },
        isMobile (value) {
            this.setRenderToWindow(value);
        }
    },
    created () {
        this.$on("close", this.close);
    },
    methods: {
        ...mapMutations("Tools/VcOblique", Object.keys(mutationsObliqueViewer)),
        ...mapActions("Tools/VcOblique", ["initObliqueView", "resetObliqueViewer", "setObliqueView", "setObliqueViewerURL"]),

        /**
        * Close the sidebar and deactivate the obliqueViewer
        * @returns {void}
        */
        close () {
            const model = getComponent("vcOblique");

            this.setActive(false);
            if (model) {
                model.set("isActive", false);
            }
        }
    }
};

</script>

<template lang="html">
    <ToolTemplate
        :title="$t(name)"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
        :initial-width="initialWidth"
    >
        <template #toolBody>
            <div
                v-if="active"
                id="obliqueViewer"
            >
                <iframe
                    id="obliqueIframe"
                    ref="iframeContent"
                    v-resize="{}"
                    title="ObliqueIframe"
                    width="100%"
                    height="100%"
                    frameboarder="0"
                    :src="obliqueViewerURL"
                />
            </div>
        </template>
    </ToolTemplate>
</template>

<style lang="scss" scoped>
#obliqueViewer{
    height: 84vh;
}
</style>

