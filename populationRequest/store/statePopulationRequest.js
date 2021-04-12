/**
 * User type definition
 * @typedef {Object} populationRequestState
 * @property {Boolean} active if true, PopulationRequest will rendered
 * @property {String} id id of the PopulationRequest component
 * @property {String} name displayed as title (config-param)
 * @property {String} glyphicon icon next to title (config-param)
 * @property {Boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {Boolean} resizableWindow if true, window is resizable (config-param)
 * @property {Boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {Boolean} rasterActive is the rasterLayer active
 * @property {Boolean} alkisAdressesActive is the alkisAdressesLayer active
 * @property {Boolean} useProxy use a Proxy
 * @property {Integer} populationReqServiceId id of the population Request
 */
const state = {
    active: false,
    id: "populationRequest",
    // defaults for config.json parameters
    name: "Einwohner abfragen",
    glyphicon: "glyphicon-wrench",
    renderToWindow: true,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: true,
    rasterActive: false,
    alkisAdressesActive: false,
    useProxy: false,
    populationReqServiceId: 2
};

export default state;
