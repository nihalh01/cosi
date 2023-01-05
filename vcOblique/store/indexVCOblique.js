import actions from "./actionsVCOblique";
import mutations from "./mutationsVCOblique";
import getters from "./gettersVCOblique";
import state from "./stateVCOblique";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
