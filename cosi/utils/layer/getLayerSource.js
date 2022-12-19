import Cluster from "ol/source/Cluster";
import VectorLayer from "ol/layer/Vector";

/**
 * Returns the raw vector source of a vector layer, both clustered and not.
 * @param {ol/layer/Vector} layer - The ol vector layer.
 * @returns {ol/source/Vector|null} The raw vector source or null if no source exists.
 */
function getLayerSource (layer) {
    if (typeof layer !== "object" || !(layer instanceof VectorLayer) || layer.getSource() === null) {
        console.error("utils/layer/getLayerSource: layer must be a vector layer with a source", layer);
        return null;
    }
    const source = layer.getSource();

    return source.constructor === Cluster ? source.getSource() : source;
}

module.exports = {
    getLayerSource
};
