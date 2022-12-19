import {
    getAllDistrictsWithoutLayer,
    getDistricts,
    getFeatureTypes,
    getLayerById,
    getNameList,
    getPropertyNameList,
    prepareDistrictLevels,
    setProperties,
    mapDistrictNames
} from "../../../utils/prepareDistrictLevels.js";
import {expect} from "chai";
import Source from "ol/source/Vector.js";
import Layer from "ol/layer/Vector.js";
import Feature from "ol/Feature.js";
import sinon from "sinon";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";

describe("addons/DistrictSelector/utils/prepareDistrictLevels.js", () => {

    before(() => {
        sinon.stub(rawLayerList, "getLayerList").returns([
            {
                url: "url",
                featureType: "featurType"
            },
            {
                url: "https://given.url",
                featureType: "v_hh_bezirk_bev_insgesamt"
            }
        ]);
    });

    after(() => {
        sinon.restore();
    });

    describe("getAllDistrictsWithoutLayer", () => {
        it("should return an empty array if the given parameter is not an array or an array with length zero", () => {
            expect(getAllDistrictsWithoutLayer({})).to.be.empty;
            expect(getAllDistrictsWithoutLayer(true)).to.be.empty;
            expect(getAllDistrictsWithoutLayer("districtLevels")).to.be.empty;
            expect(getAllDistrictsWithoutLayer(undefined)).to.be.empty;
            expect(getAllDistrictsWithoutLayer(null)).to.be.empty;
            expect(getAllDistrictsWithoutLayer(42)).to.be.empty;
            expect(getAllDistrictsWithoutLayer([])).to.be.empty;
        });

        it("should return an array with length three", () => {
            const testArray = [{}, {}, {}],
                testArrayTwo = [{layer: {}}, {layer: {}}, {}, {}, {}];

            expect(getAllDistrictsWithoutLayer(testArray)).to.be.an("array");
            expect(getAllDistrictsWithoutLayer(testArray)).to.have.lengthOf(3);
            expect(getAllDistrictsWithoutLayer(testArrayTwo)).to.be.an("array");
            expect(getAllDistrictsWithoutLayer(testArrayTwo)).to.have.lengthOf(3);
        });

        it("should return an array with to objects, that have no layer attribute", () => {
            const testArray = [{id: "123"}, {name: "Hello"}, {layer: {}}];

            expect(getAllDistrictsWithoutLayer(testArray)).to.deep.equal([{id: "123"}, {name: "Hello"}]);
        });
    });

    describe("getDistricts", () => {
        const layer = new Layer({
            source: new Source({
                features: [
                    new Feature({
                        name: "Altona",
                        id: "123"
                    }),
                    new Feature({
                        name: "Ottensen",
                        id: "456"
                    })
                ]
            })
        });

        it("should return an empty array if the property layer is not or wrongly defined", () => {
            expect(getDistricts({layer: ""})).to.be.an("array").to.be.empty;
            expect(getDistricts({layer: null})).to.be.an("array").to.be.empty;
            expect(getDistricts({layer: false})).to.be.an("array").to.be.empty;
            expect(getDistricts({layer: 5})).to.be.an("array").to.be.empty;
            expect(getDistricts({layer: []})).to.be.an("array").to.be.empty;
            expect(getDistricts({layer: undefined})).to.be.an("array").to.be.empty;
        });

        it("should return an empty array if the property label is not or wrongly defined", () => {
            expect(getDistricts({label: {}})).to.be.an("array").to.be.empty;
            expect(getDistricts({label: null})).to.be.an("array").to.be.empty;
            expect(getDistricts({label: false})).to.be.an("array").to.be.empty;
            expect(getDistricts({label: 5})).to.be.an("array").to.be.empty;
            expect(getDistricts({label: []})).to.be.an("array").to.be.empty;
            expect(getDistricts({label: undefined})).to.be.an("array").to.be.empty;
        });

        it("should return an empty array if the property keyOfAttrName is not or wrongly defined", () => {
            expect(getDistricts({keyOfAttrName: {}})).to.be.an("array").to.be.empty;
            expect(getDistricts({keyOfAttrName: null})).to.be.an("array").to.be.empty;
            expect(getDistricts({keyOfAttrName: false})).to.be.an("array").to.be.empty;
            expect(getDistricts({keyOfAttrName: 5})).to.be.an("array").to.be.empty;
            expect(getDistricts({keyOfAttrName: []})).to.be.an("array").to.be.empty;
            expect(getDistricts({keyOfAttrName: undefined})).to.be.an("array").to.be.empty;
        });

        it("should returns two districts", () => {
            const districts = getDistricts({label: "Stadtteil", layer: layer, keyOfAttrName: "name"});

            expect(districts).to.be.an("array").lengthOf(2);
        });

        it("should returns a district where the name and the label are the same", () => {
            const districts = getDistricts({label: "Stadtteile", layer: layer, keyOfAttrName: "name"});

            expect(districts[0].getLabel()).to.equal(districts[0].getName());
        });

        it("should returns a district where the name and the label are not the same, if duplicateDistrictNames includes the name of the district", () => {
            const districts = getDistricts({label: "Stadtteile", layer: layer, keyOfAttrName: "name", duplicateDistrictNames: ["Altona"]});

            expect(districts[0].getLabel()).not.to.equal(districts[0].getName());
            expect(districts[0].getLabel()).to.equal("Altona (Stadtteil)");
        });
    });

    describe("getFeatureTypes", () => {
        it("should return an empty array", () => {
            expect(getFeatureTypes(undefined)).to.be.an("array").to.be.empty;
            expect(getFeatureTypes(null)).to.be.an("array").to.be.empty;
            expect(getFeatureTypes({})).to.be.an("array").to.be.empty;
            expect(getFeatureTypes(true)).to.be.an("array").to.be.empty;
            expect(getFeatureTypes(42)).to.be.an("array").to.be.empty;
            expect(getFeatureTypes([])).to.be.an("array").to.be.empty;
        });

        it("should return an empty array include empty arrays", () => {
            const featureTypes = getFeatureTypes(["123", "456"]);

            expect(featureTypes).to.be.an("array").to.have.lengthOf(2);
            expect(featureTypes[0]).to.be.an("array").to.be.empty;
            expect(featureTypes[1]).to.be.an("array").to.be.empty;
        });

        it("should return an array of arrays, if typeNames provided", () => {
            const featureTypes = getFeatureTypes(["123", "456"], ["abc", ["def"]]);

            expect(featureTypes).to.be.an("array").to.have.lengthOf(2);
            expect(featureTypes[0]).to.be.an("array").to.deep.equal(["abc"]);
            expect(featureTypes[1]).to.be.an("array").to.deep.equal(["def"]);
        });

        it("should return an array of arrays", () => {
            const featureTypes = getFeatureTypes(["https://given.url"]);

            expect(featureTypes).to.be.an("array").to.not.be.empty;
            expect(featureTypes[0]).to.be.an("array").to.not.be.empty;
        });

        it("should return featureType 'v_hh_bezirk_bev_insgesamt' for the given url", () => {
            const featureTypes = getFeatureTypes(["https://given.url"]);

            expect(featureTypes[0]).to.include("v_hh_bezirk_bev_insgesamt");
        });
    });

    describe("getLayerById", () => {
        it("should return undefined if only one param is given", () => {
            expect(getLayerById(["Test"])).to.be.undefined;
        });

        it("should return undefined if the first param is not an array", () => {
            expect(getLayerById({}, "123")).to.be.undefined;
            expect(getLayerById(true, "123")).to.be.undefined;
            expect(getLayerById("districtLevels", "123")).to.be.undefined;
            expect(getLayerById(undefined, "123")).to.be.undefined;
            expect(getLayerById(null, "123")).to.be.undefined;
            expect(getLayerById(42, "123")).to.be.undefined;
        });

        it("should return undefined if the first param is an empty array", () => {
            expect(getLayerById([], "123")).to.be.undefined;
        });

        it("should return undefined if the second param is not a string", () => {
            expect(getLayerById([], {})).to.be.undefined;
            expect(getLayerById([], true)).to.be.undefined;
            expect(getLayerById([], undefined)).to.be.undefined;
            expect(getLayerById([], null)).to.be.undefined;
            expect(getLayerById([], 42)).to.be.undefined;
            expect(getLayerById([], [])).to.be.undefined;
        });

        it("should return a layer with the passed id", () => {
            const layerOne = new Layer({id: "123"}),
                layerTwo = new Layer({id: "456"}),
                layerThree = new Layer({id: "789"}),
                layerList = [layerOne, layerTwo, layerThree];

            expect(getLayerById(layerList, "123")).to.be.an("object");
            expect(getLayerById(layerList, "456")).to.be.an("object");
        });

        it("should return undefined if no layer is found", () => {
            const layerOne = new Layer({id: "123"}),
                layerTwo = new Layer({id: "456"}),
                layerList = [layerOne, layerTwo];

            expect(getLayerById(layerList, "789")).to.be.undefined;
        });
    });

    describe("getNameList", () => {
        it("should return an empty array if only one param is passed", () => {
            const layerOne = new Layer();

            expect(getNameList(layerOne)).to.be.an("array").that.is.empty;
            expect(getNameList(true)).to.be.an("array").that.is.empty;
            expect(getNameList("layerOne")).to.be.an("array").that.is.empty;
            expect(getNameList(42)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the first param is not an object", () => {
            expect(getNameList([], "123")).to.be.empty;
            expect(getNameList(true, "123")).to.be.empty;
            expect(getNameList("districtLevels", "123")).to.be.empty;
            expect(getNameList(undefined, "123")).to.be.empty;
            expect(getNameList(null, "123")).to.be.empty;
            expect(getNameList(42, "123")).to.be.empty;
        });

        it("should return an empty array if the second param is not a string", () => {
            const layerOne = new Layer();

            expect(getNameList(layerOne, {})).to.be.empty;
            expect(getNameList(layerOne, true)).to.be.empty;
            expect(getNameList(layerOne, undefined)).to.be.empty;
            expect(getNameList(layerOne, null)).to.be.empty;
            expect(getNameList(layerOne, 42)).to.be.empty;
            expect(getNameList(layerOne, [])).to.be.empty;
        });

        it("should return an empty array if no features with the attribute name exist", () => {
            const layerOne = new Layer({
                source: new Source({
                    features: [
                        new Feature({
                            id: "123"
                        }),
                        new Feature({
                            bezeichnung: "Ottensen"
                        })
                    ]
                })
            });

            expect(getNameList(layerOne, "name")).to.be.an("array").that.is.empty;
        });

        it("should return an array with the length of two'", () => {
            const layerOne = new Layer({
                source: new Source({
                    features: [
                        new Feature({
                            name: "Altona",
                            id: "123"
                        }),
                        new Feature({
                            name: "Ottensen"
                        }),
                        new Feature({
                            id: "Ottensen"
                        })
                    ]
                })
            });

            expect(getNameList(layerOne, "name")).to.be.an("array");
            expect(getNameList(layerOne, "name")).to.have.lengthOf(2);
        });

        it("should return an array with the strings 'Altona' and 'Ottensen'", () => {
            const layerOne = new Layer({
                source: new Source({
                    features: [
                        new Feature({
                            name: "Altona",
                            id: "123"
                        }),
                        new Feature({
                            name: "Ottensen"
                        })
                    ]
                })
            });

            expect(getNameList(layerOne, "name")).to.be.an("array");
            expect(getNameList(layerOne, "name")).to.deep.equal(["Altona", "Ottensen"]);
        });
    });

    describe("getPropertyNameList", () => {
        it("should return an empty array", async () => {
            expect(await getPropertyNameList(undefined)).to.be.an("array").to.be.empty;
            expect(await getPropertyNameList(null)).to.be.an("array").to.be.empty;
            expect(await getPropertyNameList({})).to.be.an("array").to.be.empty;
            expect(await getPropertyNameList(true)).to.be.an("array").to.be.empty;
            expect(await getPropertyNameList(42)).to.be.an("array").to.be.empty;
            expect(await getPropertyNameList([])).to.be.an("array").to.be.empty;
        });

        it("should return an empty array include empty arrays", async () => {
            const propertyNameList = await getPropertyNameList(["123", "456"]);

            expect(propertyNameList).to.be.an("array").to.have.lengthOf(2);
            expect(propertyNameList[0]).to.be.an("array").to.be.empty;
            expect(propertyNameList[1]).to.be.an("array").to.be.empty;
        });
    });


    describe("setProperties", () => {
        const bindObj = {
                districts: [],
                keyOfAttrName: "name",
                label: "Stadtteile",
                layer: new Layer({
                    source: new Source({
                        features: [
                            new Feature({
                                name: "Altona",
                                id: "123"
                            }),
                            new Feature({
                                name: "Ottensen",
                                id: "456"
                            })
                        ]
                    })
                })
            },
            eventDummy = {
                target: {
                    getFeatures: () => ["", ""]
                }
            },
            eventDummyEmpty = {
                target: {
                    getFeatures: () => []
                }
            },
            copySetProperties = setProperties.bind(bindObj);

        it("should return an object without the property 'nameList'", () => {
            copySetProperties(eventDummyEmpty);

            expect(bindObj).to.have.not.property("nameList");
        });

        it("should return an object without districts", () => {
            copySetProperties(eventDummyEmpty);

            expect(bindObj.districts).to.be.empty;
        });

        it("should return an object with the property 'nameList'", () => {
            copySetProperties(eventDummy);

            expect(bindObj).to.have.property("nameList");
        });

        it("should return an object with two districts", () => {
            copySetProperties(eventDummy);

            expect(bindObj.districts).to.have.lengthOf(2);
        });

        it("should return an array for the property 'nameList'", () => {
            copySetProperties(eventDummy);

            expect(bindObj.nameList).to.be.an("array");
        });

        it("should return ['Altona', 'Ottensen'] for the property 'nameList'", () => {
            copySetProperties(eventDummy);

            expect(bindObj.nameList).to.deep.equal(["Altona", "Ottensen"]);
        });
    });

    describe("prepareDistrictLevels", () => {
        it("should call on listener", async () => {
            const testArray = [{layerId: "123", stats: {}}],
                layerOne = new Layer({id: "123", source: new Source()}),
                spyOnSource = sinon.spy(layerOne.getSource(), "on"),
                layerList = [layerOne];

            await prepareDistrictLevels(testArray, layerList);
            expect(spyOnSource.calledOnce).to.be.true;
        });

        it("should return an object with the properties 'nameList', 'layer' , 'featureTypes', 'propertyNameList', 'referenceLevel' and 'districts'", async () => {
            const testArray = [{layerId: "123", stats: {}}],
                layerOne = new Layer({id: "123", source: new Source()}),
                layerList = [layerOne];

            await prepareDistrictLevels(testArray, layerList);

            expect(testArray[0]).to.have.property("nameList");
            expect(testArray[0]).to.have.property("layer");
            expect(testArray[0]).to.have.property("districts");
            expect(testArray[0]).to.have.property("featureTypes");
            expect(testArray[0]).to.have.property("propertyNameList");
            expect(testArray[0]).to.have.property("referenceLevel");
        });

        it("should do nothing if layer already there", () => {
            const testArray = [{layer: {}, stats: {}}],
                layerOne = new Layer({id: "123", source: new Source()}),
                layerList = [layerOne];

            prepareDistrictLevels(testArray, layerList);
            expect(testArray[0]).to.have.not.property("nameList");
            expect(testArray[0]).to.have.not.property("districts");
        });
    });

    describe("mapDistrictNames", () => {
        it("should return the original name, if no districtNamesMap provided", () => {
            const
                districtName = "Unterschweineöde",
                districtLevel = {layerId: "xyz"};

            expect(mapDistrictNames(districtName, districtLevel)).to.equal(districtName);
        });
        it("should return the synonym name, if districtNamesMap provided", () => {
            const
                districtName = "Unterschweineöde",
                synonym = "Oberschweineöde",
                districtLevel = {layerId: "xyz", districtNamesMap: {[districtName]: synonym}};

            expect(mapDistrictNames(districtName, districtLevel)).to.equal(synonym);
        });
    });
});
