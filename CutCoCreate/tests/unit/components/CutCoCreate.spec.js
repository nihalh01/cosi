import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import CutCoCreateComponent from "../../../components/CutCoCreate.vue";
import CutCoCreate from "../../../store/index";
import {expect} from "chai";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("addons/CutCoCreate/components/CutCoCreate.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        CutCoCreate:
                            {
                                "name": "translate#additional:modules.tools.CutCoCreate.title",
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
                        CutCoCreate
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        store.commit("Tools/CutCoCreate/setActive", true);
    });

    it("renders the CutCoCreate", () => {
        const wrapper = shallowMount(CutCoCreateComponent, {store, localVue});

        expect(wrapper.find("#vue-addon").exists()).to.be.true;
    });

    it("do not render the CutCoCreates if not active", () => {
        let wrapper = null;

        store.commit("Tools/CutCoCreate/setActive", false);
        wrapper = shallowMount(CutCoCreateComponent, {store, localVue});

        expect(wrapper.find("#vue-addon").exists()).to.be.false;
    });
    it("CutCoCreate contains correct html", () => {
        const wrapper = shallowMount(CutCoCreateComponent, {store, localVue});

        expect(wrapper.find("#vue-addon").html()).to.be.equals("<div id=\"vue-addon\">\n  additional:modules.tools.CutCoCreate.content\n</div>");
    });

});
