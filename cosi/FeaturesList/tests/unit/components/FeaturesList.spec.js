import Vuex from "vuex";
import {
    config,
    mount,
    createLocalVue
} from "@vue/test-utils";
import FeaturesList from "../../../components/FeaturesList.vue";
import FeaturesListStore from "../../../store/indexFeaturesList";
import DetailView from "../../../components/DetailView.vue";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import Vuetify from "vuetify";
import Vue from "vue";
import Tool from "../../../../../../src/modules/tools/ToolTemplate.vue";
import Scenario from "../../../../ScenarioBuilder/classes/Scenario";
import Layer from "ol/layer/Vector.js";
import Source from "ol/source/Vector.js";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import mockConfigJson from "./mock.config.json";
import districtLevel from "./mock.districtLevel";
import {initializeLayerList} from "../../../../utils/initializeLayerList";
import {VChip} from "vuetify/lib";

Vue.use(Vuetify);

const localVue = createLocalVue(),
    expect = chai.expect;

localVue.use(Vuex);
chai.use(sinonChai);

config.mocks.$t = key => key;

global.requestAnimationFrame = (fn) => fn();
global.cancelAnimationFrame = () => ({ });
global.ShadowRoot = window.ShadowRoot;


// eslint-disable-next-line require-jsdoc
function createLayer (feature) {
    return new Layer({
        id: "1234",
        source: new Source({
            features: [feature || createFeature()]
        })
    });
}

// eslint-disable-next-line require-jsdoc
function createFeature (key) {
    const feature = new Feature({
        id: "id",
        schulname: "feature 1",
        anzahl_schueler: 42,
        adresse_strasse_hausnr: "Hauptstraße",
        adresse_ort: "Hamburg",
        kapitelbezeichnung: "Grundschule",
        geometry: new Point([
            10.086822509765625,
            53.55825752009741
        ])
    });

    feature.setId("id");
    if (key) {
        feature.key = key;
    }
    return feature;
}


describe("addons/cosi/FeaturesList/components/FeaturesList.vue", () => {
    let store, sandbox, vuetify, layerListStub, getDistanceScoreStub, sourceStub, clearStub, _wrapper;


    const expMapping = [{
            group: "Bildung und Wissenschaft",
            layer: [{
                addressField: [
                    "adresse_strasse_hausnr",
                    "adresse_ort"
                ],
                categoryField: "kapitelbezeichnung",
                id: "Mein Layer",
                keyOfAttrName: "schulname",
                layerId: "1234",
                numericalValues: [{
                    id: "anzahl_schueler",
                    name: "Schülerzahl"
                }]
            }]
        }],
        expCols = [
            "style",
            "enabled",
            "name",
            "warning",
            "district",
            "address",
            "layerName",
            "type",
            "group",
            "anzahl_schueler"
        ],
        layersMock = [];


    beforeEach(() => {
        vuetify = new Vuetify();
        sandbox = sinon.createSandbox();
        layerListStub = sinon.stub();
        getDistanceScoreStub = sinon.stub();
        getDistanceScoreStub.returns(Promise.resolve({"score": 1, "1234": {value: 1, feature: createFeature()}}));

        clearStub = sinon.stub();
        sourceStub = {
            clear: clearStub,
            addFeature: sinon.stub()
        };

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Language: {
                    namespaced: true,
                    getters: {
                        currentLocale: () => "de-DE"
                    }
                },
                Tools: {
                    namespaced: true,
                    modules: {
                        FeaturesList: FeaturesListStore,
                        ScenarioBuilder: {
                            namespaced: true,
                            getters: {
                                scenario: sinon.stub().returns(new Scenario("Scenario")),
                                scenarioUpdated: sinon.stub().returns(new Scenario("Scenario"))
                            }
                        },
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                selectedDistrictLevel: sinon.stub().returns(districtLevel),
                                selectedFeatures: sinon.stub().returns(districtLevel.layer.getSource().getFeatures()),
                                layer: ()=>districtLevel.layer,
                                bufferValue: () => 0,
                                extent: sinon.stub()
                            }
                        },
                        DistanceScoreService: {
                            namespaced: true,
                            actions: {
                                getDistanceScore: getDistanceScoreStub
                            },
                            getters: {
                                wmsLayersInfo: ()=>[]
                            }
                        },
                        ChartGenerator: {
                            namespaced: true,
                            actions: {
                                channelGraphData: sinon.stub()
                            }
                        }
                    }
                },
                Map: {
                    namespaced: true,
                    getters: {
                        layerById: () => sinon.stub().returns({olLayer: createLayer()}),
                        layerList: layerListStub
                    },
                    actions: {
                        removeHighlightFeature: () => sinon.stub(),
                        createLayer: () => {
                            return Promise.resolve({
                                setVisible: sinon.stub(),
                                addEventListener: sinon.stub(),
                                getSource: () => sourceStub
                            });
                        }
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            },
            getters: {
                uiStyle: () => true
            }
        });
    });

    afterEach(function () {
        sandbox.restore();
        if (_wrapper) {
            _wrapper.destroy();
        }
    });

    // eslint-disable-next-line require-jsdoc, no-shadow
    async function mountComponent (isActive = true, layerList = layersMock) {
        layerListStub.returns(layerList);

        const ret = mount(FeaturesList, {
            stubs: {Tool},
            store,
            localVue,
            vuetify
        });

        store.commit("Tools/FeaturesList/setActive", isActive);
        store.commit("Tools/FeaturesList/setDistanceScoreEnabled", true);
        _wrapper = ret;
        await ret.vm.$nextTick();
        return ret;
    }

    describe("Component DOM", () => {
        it("should exist", async () => {
            const wrapper = await mountComponent();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find Tool component", async () => {
            const wrapper = await mountComponent(),
                toolWrapper = wrapper.findComponent(Tool);

            expect(toolWrapper.exists()).to.be.true;
        });

        it("should not render if active is false", async () => {
            const wrapper = await mountComponent(false);

            expect(wrapper.find("form").exists()).to.be.false;
        });

        it("should return false for null on isFeaturedDisabled", async () => {
            const wrapper = await mountComponent(false);

            expect(wrapper.vm.isFeatureDisabled(null)).to.be.false;
        });

        it("should return true for minimal object on isFeatureActive", async () => {
            const wrapper = await mountComponent(false);

            expect(wrapper.vm.isFeatureActive({style_: null})).to.be.true;
        });

        it("should return true for enabled object on isFeatureActive", async () => {
            const wrapper = await mountComponent(false),
                feat = {style_: null, feature: createFeature()};


            expect(wrapper.vm.isFeatureActive(feat.feature)).to.be.true;
            expect(wrapper.vm.isFeatureDisabled(feat.feature)).to.be.false;
        });

        it("should return false for disabled object on isFeatureActive", async () => {
            const wrapper = await mountComponent(false),
                feat = {style_: null, feature: createFeature()};

            await wrapper.vm.addDisabledFeatureItem(feat);

            expect(wrapper.vm.isFeatureDisabled(feat.feature)).to.be.true;
            expect(wrapper.vm.isFeatureActive(feat.feature)).to.be.false;
            await wrapper.vm.removeDisabledFeatureItem(feat);
        });

        it("should toggle active feacture", async () => {
            const wrapper = await mountComponent(false),
                feat = {style_: null, feature: createFeature()};

            await wrapper.vm.toggleFeature(feat);

            expect(wrapper.vm.isFeatureDisabled(feat.feature)).to.be.false;
            expect(wrapper.vm.isFeatureActive(feat.feature)).to.be.true;
        });

        it("mapping should be generated from layerConf, should have length of 1", async () => {
            const wrapper = await mountComponent();

            expect(wrapper.vm.mapping).deep.to.equal(expMapping);
            expect(wrapper.vm.mapping).to.have.lengthOf(1);
        });

        it("expect layer filter to have no items if no layer active", async () => {
            const wrapper = await mountComponent();

            expect(wrapper.vm.activeVectorLayerList).to.have.lengthOf(0);
            // expect(wrapper.vm.activeVectorLayerList).to.have.lengthOf(0);
        });

        it("layer should be read out if active", async () => {
            const wrapper = await mountComponent(true, [createLayer()]);

            await wrapper.vm.$nextTick();


            // flatActiveLayerMapping has length 1 if 1 layer is active
            expect(wrapper.vm.flatActiveLayerMapping).to.have.lengthOf(1);
            // first item in the layer filter dropdown has value "Mein Layer"
            expect(wrapper.find(".layer_selection").props("items")[1].text).to.equal("Mein Layer");
            expect(wrapper.vm.filteredItems).to.have.lengthOf(1);
        });

        it("items array should hold one item with relevant properties", async () => {
            const wrapper = await mountComponent(true, [createLayer()]);

            expect(wrapper.vm.items).to.have.lengthOf(1);
            expect(wrapper.vm.items[0]).to.have.all.keys("key", "name", "style", "district", "group", "layerName", "layerId", "type", "address", "feature", "enabled", "isModified", "isSimulation", "anzahl_schueler", "gfiAttributes");
        });

        it("should show layers for distance score", async () => {
            await initializeLayerList([{"id": "1234", "url": "url", "featureType": "type"}]);

            const wrapper = await mountComponent(true, [createLayer()]);

            await wrapper.vm.$nextTick();

            expect(wrapper.vm.layerOptions).to.deep.equal(
                [{"header": "Bildung und Wissenschaft"},
                    {
                        "featureType": "type",
                        "group": "Bildung und Wissenschaft",
                        "id": "Mein Layer",
                        "layerId": "1234",
                        "url": "url"
                    }
                ]

            );
            expect(wrapper.vm.layerWeights).to.deep.equal({});
            expect(wrapper.vm.selectedDistanceScoreLayers).to.deep.equal([]);
        });

        it("should show distance score layers select only if enabled", async () => {
            const wrapper = await mountComponent(true, [createLayer()]);

            expect(await wrapper.find("#selectedDistanceScoreLayers").exists()).to.be.true;

            await wrapper.vm.setDistanceScoreEnabled(false);

            expect(await wrapper.find("#selectedDistanceScoreLayers").exists()).to.be.false;
        });

        it("should show distance score column on select layer", async () => {
            await initializeLayerList([{"id": "1234", "url": "url", "featureType": "type"}]);
            const wrapper = await mountComponent(true, [createLayer()]);

            await wrapper.setData({selectedDistanceScoreLayers: [{layerId: "1234"}]});
            expect(wrapper.vm.columns.map(e => e.value)).to.contain("distanceScore");
        });

        it("should compute distance score on select layer", async () => {
            await initializeLayerList([{"id": "1234", "url": "url", "featureType": "type"}]);

            const feature = createFeature(),
                wrapper = await mountComponent(true, [createLayer(feature)]);

            await wrapper.setData({selectedDistanceScoreLayers: [{layerId: "1234"}]});

            await wrapper.vm.$nextTick();
            // eslint-disable-next-line one-var
            const args = getDistanceScoreStub.firstCall.args[1];

            expect(args.feature.getId()).to.be.equal("id");
            expect(args.layerIds).to.be.eql(["1234"]);
            expect(args.weights).to.be.eql([1]);
            expect(wrapper.vm.items).to.have.length(1);
            expect(wrapper.vm.items[0].weightedDistanceScores.score).to.be.equal(1);
            expect(wrapper.vm.items[0].weightedDistanceScores.score).to.be.equal(1);
            expect(wrapper.vm.items.map(i=>i.distanceScore)).to.be.eql(["1.0"]);
            expect(wrapper.findAllComponents(VChip).at(1).vm.color).to.be.equal("red");
        });

        it("should delete distance score on remove layer", async () => {
            await initializeLayerList([{"id": "1234", "url": "url", "featureType": "type"}]);

            const wrapper = await mountComponent(true, [createLayer()]);

            await wrapper.setData({selectedDistanceScoreLayers: [{layerId: "1234"}]});
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.items.map(i=>i.distanceScore)).to.be.eql(["1.0"]);

            await wrapper.setData({selectedDistanceScoreLayers: []});
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.items.map(i=>i.distanceScore)).to.be.eql([undefined]);
        });

        it("should set scored for dialog", async () => {
            // arrange
            await initializeLayerList([{"id": "1234", "url": "url", "featureType": "type"}]);
            const feature = createFeature(),
                wrapper = await mountComponent(true, [createLayer(feature)]),
                spyChannelGraphData = sinon.spy(wrapper.vm, "channelGraphData");

            await wrapper.setData({selectedDistanceScoreLayers: [{layerId: "1234"}]});
            await wrapper.vm.$nextTick();

            // act
            wrapper.vm.showDistanceScoreForItem(wrapper.vm.items[0]);

            // assert
            expect(spyChannelGraphData.calledOnce).to.be.true;
        });

        sinon.stub(FeaturesList.methods, "highlightVectorFeature");

        it("should show distance score features", async () => {
            // arrange
            const wrapper = await mountComponent(true, [createLayer()]);

            await wrapper.vm.$nextTick();
            await wrapper.setData({selectedDistanceScoreLayers: [{layerId: "1234"}]});
            await wrapper.vm.$nextTick();
            clearStub.reset();
            sourceStub.addFeature.reset();

            // act
            await wrapper.vm.setSelectedFeatureItems(wrapper.vm.items);

            // assert
            // call counts affected by other test runs, why?
            expect(clearStub.callCount).to.be.greaterThan(0);
            expect(sourceStub.addFeature.callCount).to.be.greaterThan(0);
            expect(sourceStub.addFeature.firstCall.args[0].getStyle().getImage().getFill().getColor()).to.eql([255, 179, 0]);
        });

        it("should hide distance score features on deselect", async () => {

            // arrange
            const wrapper = await mountComponent(true, [createLayer()]);

            await wrapper.vm.$nextTick();

            await wrapper.setData({selectedDistanceScoreLayers: [{layerId: "1234"}]});
            await wrapper.vm.$nextTick();
            await wrapper.vm.setSelectedFeatureItems(wrapper.vm.items);

            clearStub.reset();
            sourceStub.addFeature.reset();

            // act
            await wrapper.setData({selectedDistanceScoreLayers: []});

            // assert
            expect(clearStub.callCount).to.be.greaterThan(0);
            expect(sourceStub.addFeature.callCount).to.equal(0);
        });

        it("should recompute distance score after weight change", async () => {
            // arrange
            await initializeLayerList([{"id": "1234", "url": "url", "featureType": "type"},
                {"id": "1235", "url": "url", "featureType": "type"}
            ]);

            const wrapper = await mountComponent(true, [createLayer()]);

            await wrapper.setData({selectedDistanceScoreLayers: [{layerId: "1234"}, {layerId: "1235"}]});
            getDistanceScoreStub.reset();
            getDistanceScoreStub.returns(Promise.resolve({"score": 1, "1234": {value: 1, feature: createFeature()}}));

            // act
            await wrapper.vm.updateWeights({"1234": 0.5, "1235": 1});

            // assert
            // eslint-disable-next-line one-var
            const args = getDistanceScoreStub.firstCall.args[1];

            expect(args.weights).to.be.eql([0.5, 1]);
            expect(wrapper.vm.items.map(i=>i.distanceScore)).to.be.eql(["1.0"]);
        });

        it("headers should have all fields", async () => {
            const wrapper = await mountComponent(true, [createLayer()]);

            expect(wrapper.vm.columns.map(e => e.value)).deep.to.equal(expCols);
        });

        it("layer with one feature should be rendered to table if layer is active", async () => {
            const wrapper = await mountComponent(true, [createLayer()]),
                tableWrapper = wrapper.findComponent({name: "v-data-table"});

            // table has been rendered
            expect(tableWrapper.exists()).to.be.true;
            // table has 2 rows (1 header, 1 content)
            expect(tableWrapper.findAll("tr")).to.have.lengthOf(2);
        });

        sinon.stub(DetailView.methods, "gfiOrBeautifyKey");

        it("table row should be expanded to detail view", async () => {
            const wrapper = await mountComponent(true, [createLayer()]),
                tableWrapper = wrapper.findComponent({name: "v-data-table"});

            // await wrapper.vm.$nextTick();
            await wrapper.find("button.mdi-chevron-down").trigger("click");

            // expand the table on expand button click
            expect(tableWrapper.findAll(".v-data-table__expanded")).to.have.lengthOf(2);
            // render detail view in the expanded row
            expect(wrapper.findComponent(DetailView).findAll("tr")).to.have.lengthOf(6);
        });

        it("selecting a field in expanded view should emit the 'filterProps' event", async () => {
            const spyUpdateFilterProps = sinon.spy(FeaturesList.methods, "updateFilterProps"),
                wrapper = await mountComponent(true, [createLayer()]);

            // await wrapper.vm.$nextTick();
            await wrapper.find("button.mdi-chevron-down").trigger("click");
            await wrapper.findComponent(DetailView).find("input").trigger("click");

            // event should be emitted once
            expect(wrapper.findComponent(DetailView).emitted("filterProps").length).to.equal(1);
            // event should emit the layerId and prop selected
            expect(wrapper.findComponent(DetailView).emitted("filterProps")[0]).deep.to.equal([{"1234": ["id"]}]);
            // updateFilterProps called
            expect(spyUpdateFilterProps.calledOnce).to.be.true;
        });

        it("expect download prompt to open when table is exported", async () => {
            const spyExportTable = sinon.spy(FeaturesList.methods, "exportTable"),
                wrapper = await mountComponent(true, [createLayer()]);

            await wrapper.vm.$nextTick();
            await wrapper.find("#export-table").trigger("click");

            // exportTable should have been called
            expect(spyExportTable.callCount).to.equal(1);
        });

        it("expect feature to be removed from map/layer, when toggled off", async () => {
            const spyToggleFeature = sinon.spy(FeaturesList.methods, "toggleFeature"),
                layer1 = createLayer(),
                wrapper = await mountComponent(true, [layer1]);


            // toggle feature off
            await wrapper.find(".featureToggle").trigger("click");
            await wrapper.vm.$nextTick();

            expect(spyToggleFeature.calledOnceWith(wrapper.vm.items[0])).to.be.true;
            expect(wrapper.vm.disabledFeatureItems).to.have.lengthOf(1);
            expect(wrapper.vm.items[0].enabled).to.be.false;
            expect(layer1.getSource().getFeatures()).to.have.lengthOf(1);

            // toggle feature back on again
            await wrapper.find(".featureToggle").trigger("click");
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.items[0].enabled).to.be.true;
            expect(layer1.getSource().getFeatures()).to.have.lengthOf(1);
        });
        it("should update weights and recompute score", async () => {
            await initializeLayerList([{"id": "1234", "url": "url", "featureType": "type"}]);

            const wrapper = await mountComponent(true, [createLayer(createFeature(1))]);

            await wrapper.setData({selectedDistanceScoreLayers: [{layerId: "1234"}]});
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.layerWeights).to.deep.equal({"1234": 1});

            await wrapper.find("#weights").trigger("click");
            expect(wrapper.vm.showWeightsDialog).to.be.true;
        });
    });
});
