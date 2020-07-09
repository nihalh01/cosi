import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import VueAddonComponent from "../../../components/VueAddon.vue";
import VueAddon from "../../../store/VueAddon";
import {expect} from "chai";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("VueAddon.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        VueAddon:
                            {
                                "name": "translate#additional:modules.tools.vueAddon.title",
                                "glyphicon": "glyphicon-th-list"
                            }
                    }
                }
            }
        }
    };
    let store;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        VueAddon
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        store.dispatch("Tools/VueAddon/setActive", true);
    });

    it("renders the VueAddon", () => {
        const wrapper = shallowMount(VueAddonComponent, {store, localVue});

        expect(wrapper.find("#vue-addon").exists()).to.be.true;
    });

    it("do not render the VueAddons if not active", () => {
        let wrapper = null;

        store.dispatch("Tools/VueAddon/setActive", false);
        wrapper = shallowMount(VueAddonComponent, {store, localVue});

        expect(wrapper.find("#vue-addon").exists()).to.be.false;
    });
    it("VueAddon contains correct html", () => {
        const wrapper = shallowMount(VueAddonComponent, {store, localVue});

        expect(wrapper.find("#vue-addon").html()).to.be.equals("<div id=\"vue-addon\">\n  additional:modules.tools.vueAddon.content\n</div>");
    });

});
