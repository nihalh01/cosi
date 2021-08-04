
import {generateSimpleGetters} from "../../../src/app-store/utils/generators";
import CutCoCreateState from "./stateCutCoCreate";

const getters = {
    ...generateSimpleGetters(CutCoCreateState)
};

export default getters;
