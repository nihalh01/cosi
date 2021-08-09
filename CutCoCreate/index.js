import CutCoCreateComponent from "./components/CutCoCreate.vue";
import CutCoCreateStore from "./store/indexCutCoCreate.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: CutCoCreateComponent,
    store: CutCoCreateStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
