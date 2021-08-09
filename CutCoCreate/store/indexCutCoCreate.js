import getters from "./gettersCutCoCreate";
import mutations from "./mutationsCutCoCreate";
import state from "./stateCutCoCreate";
import actions from "./actionsCutCoCreate";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
