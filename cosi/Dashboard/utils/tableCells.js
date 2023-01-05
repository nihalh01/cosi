
/**
 * Returns the value for the cell
 * @param {*} item - item
 * @param {*} header - header
 * @param {*} timestamp - year
 * @returns {String} the text val for the cell
 */
export function getValue (item, header, timestamp) {
    let val;

    if (header?.value && item[header.value]) {
        val = parseFloat(item[header.value][String(this.timestampPrefix) + timestamp]);
    }

    return val ? val.toLocaleString(this.currentLocale) : "-";
}

/**
 * Returns the class for the cell
 * @param {*} item - item
 * @param {*} header - header
 * @param {*} timestamp - year
 * @returns {String} the class
 */
export function getValueClass (item, header, timestamp) {
    return item[header.value]?.isModified <= timestamp ? "modified" : "";
}

/**
 * Returns the tooltip for the cell
 * @param {*} item - item
 * @param {*} header - header
 * @param {*} timestamp - year
 * @returns {String} the tooltip
 */
export function getValueTooltip (item, header, timestamp) {
    return item[header.value]?.isModified <= timestamp ? this.$t("additional:modules.tools.cosi.dashboard.modifiedTooltip") : undefined;
}
