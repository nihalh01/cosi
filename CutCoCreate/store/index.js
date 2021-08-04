import getters from "./gettersCutCoCreate";
import mutations from "./mutationsCutCoCreate";
import state from "./stateCutCoCreate";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
