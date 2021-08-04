import {expect} from "chai";
import getters from "../../../store/gettersCutCoCreate";
import stateCutCoCreate from "../../../store/stateCutCoCreate";


const {
    active,
    id,
    name,
    glyphicon,
    renderToWindow,
    resizableWindow,
    isVisibleInMenu,
    deactivateGFI} = getters;

describe("addons/CutCoCreate/store/gettersCutCoCreate", function () {
    it("returns the active from state", function () {
        expect(active(stateCutCoCreate)).to.be.false;
    });
    it("returns the id from state", function () {
        expect(id(stateCutCoCreate)).to.equals("CutCoCreate");
    });

    describe("testing default values", function () {
        it("returns the name default value from state", function () {
            expect(name(stateCutCoCreate)).to.be.equals("Simple Vue Addon");
        });
        it("returns the glyphicon default value from state", function () {
            expect(glyphicon(stateCutCoCreate)).to.equals("glyphicon-screenshot");
        });
        it("returns the renderToWindow default value from state", function () {
            expect(renderToWindow(stateCutCoCreate)).to.be.true;
        });
        it("returns the resizableWindow default value from state", function () {
            expect(resizableWindow(stateCutCoCreate)).to.be.true;
        });
        it("returns the isVisibleInMenu default value from state", function () {
            expect(isVisibleInMenu(stateCutCoCreate)).to.be.true;
        });
        it("returns the deactivateGFI default value from state", function () {
            expect(deactivateGFI(stateCutCoCreate)).to.be.true;
        });

    });
});
