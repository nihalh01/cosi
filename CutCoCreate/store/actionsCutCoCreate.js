
export default {
    /**
     * @description Starts a new OpenRouteService request
     * @param {Object} ctx - the store context
     * @param {Object} payload - the request options, incl. service and profile for the URL params
     * @returns {void}
    setStoryConf ({commit}, payload) {
        commit("setStoryConf", payload);
    },
    */
    /**
     * @description toggles or sets the visibility of the drawing layer of the module
     * @param {Object} ctx - ctx - the store context
     * @param {Boolean} [isActive=undefined] - the new state of the drawing layer
     * @returns {void}

    toggleIsochroneView ({state}, isActive = undefined) {
        const drawingLayer = state.drawingLayer,
            _isActive = isActive === undefined ? !drawingLayer?.getVisible() : isActive;

        if (drawingLayer) {
            drawingLayer.setVisible(_isActive);
        }
    }
     */
};
