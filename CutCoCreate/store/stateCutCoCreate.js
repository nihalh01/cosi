/**
 * User type definition
 * @typedef {object} CutCoCreateState
 * @property {boolean} active if true, CutCoCreate will rendered
 * @property {string} id id of the CutCoCreate component
 * @property {string} name displayed as title (config-param)
 * @property {string} glyphicon icon next to title (config-param)
 * @property {boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {boolean} resizableWindow if true, window is resizable (config-param)
 * @property {boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 */
const state = {
    active: true,
    id: "CutCoCreate",
    // defaults for config.json parameters
    name: "Co-Creation and story telling",
    glyphicon: "glyphicon-equalizer",
    renderToWindow: true,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: true,
    storyConf: {}
};

export default state;
