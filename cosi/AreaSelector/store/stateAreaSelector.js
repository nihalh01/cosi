/**
 * User type definition
 * @typedef {object} VueAddonState
 * @property {boolean} active if true, VueAddon will rendered
 * @property {string} id id of the VueAddon component
 * @property {string} name displayed as title (config-param)
 * @property {string} glyphicon icon next to title (config-param)
 * @property {boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {boolean} resizableWindow if true, window is resizable (config-param)
 * @property {boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 */
const state = {
    active: false,
    id: "areaSelector",
    name: "Manuelle Flächenauswahl für Fachdaten",
    glyphicon: "glyphicon-screenshot",
    renderToWindow: true,
    resizableWindow: false,
    isVisibleInMenu: true,
    deactivateGFI: false,
    drawingLayer: null,
    geometry: null,
    feature: null,
    readmeUrl: {
        "en": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/cosi-prod/cosi/manuals/areaSelector.en.md",
        "de": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/cosi-prod/cosi/manuals/areaSelector.de.md"
    }
};

export default state;
