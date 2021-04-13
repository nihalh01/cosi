/**
 * @description Reducer function for the layers in a folder
 * @param {Object[]} layers the layers in the folder
 * @param {String} condition the condition to filter by
 * @returns {Object[]} the mapped and filtered vectorlayers
 */
function mapVectorLayersInFolder (layers, condition) {
    return layers.reduce((layerlist, layer) => {
        if (layer[condition]) {
            const keyOfAttrName = layer.mouseHoverField || "name";


            layerlist.push({
                layerId: layer.id,
                id: layer.name,
                numericalValues: layer.numericalValues || [],
                keyOfAttrName: Array.isArray(keyOfAttrName) ? keyOfAttrName[0] : keyOfAttrName
            });
        }
        return layerlist;
    }, []);
}


/**
 * @description reads ou the analyzable vectorlayers from the portals config.json
 * @param {Object} topicsConfig -
 * @param {String} path - the folder path containing all analyzable layers
 * @param {String} condition - the attribute that must be set (value or true) for a layer to qualify
 * @param {String} misc - the name to group ungrouped layers by
 * @returns {Object[]} the layer mapping array
 */
export default function getVectorlayerMapping (topicsConfig, path = "Fachdaten/FachdatenAnalyseSimulation2", condition = "isFacility", misc = "Sonstiges") {
    const _path = path.split("/"),
        mapping = [];
    let vectorlayerHierarchy = _path.length > 0 ? topicsConfig[_path[0]] : topicsConfig;

    // follow the path down the folder structure to the destined folder containing the analysis layers
    if (_path.length > 1) {
        for (let i = 1; i < _path.length; i++) {
            if (vectorlayerHierarchy && vectorlayerHierarchy.Ordner) {
                vectorlayerHierarchy = vectorlayerHierarchy.Ordner.find(folder => folder.id === _path[i]);
            }
        }
    }

    if (vectorlayerHierarchy) {
        // add a group for each folder in the hierarchy
        for (const folder of vectorlayerHierarchy.Ordner) {
            mapping.push({
                group: folder.Titel,
                layer: mapVectorLayersInFolder(folder.Layer, condition)
            });
        }

        // assign the not grouped layers to the misc category
        if (vectorlayerHierarchy.Layer) {
            mapping.push({
                group: misc,
                layer: mapVectorLayersInFolder(vectorlayerHierarchy.Layer, condition)
            });
        }
    }

    return mapping;
}

