<script>
export default {
    name: "DataTable",
    components: {
    },
    props: {
        // Dataset to be displayed in the table
        dataset: {
            type: Array,
            default: () => []
        },
        // Type of field A (facility/feature)
        typeA: {
            type: String,
            default: null
        },
        // Type of field B (facility/feature)
        typeB: {
            type: String,
            default: null
        },
        // True if factor F was specified in CalculateRatio.vue
        fActive: {
            type: Boolean,
            default: false
        },
        // The ratio between F_A and F_B
        faktorF: {
            type: String,
            default: "1/1"
        }
    },
    computed: {
        /**
         * @description Predefines the headers for the vuetify data-table.
         * @returns {void}
         */
        headers () {
            const head = [
                {
                    text: this.$t("additional:modules.tools.cosi.calculateRatio.table.text.scope"),
                    value: "scope",
                    sortable: false,
                    show: true,
                    help: this.$t("additional:modules.tools.cosi.calculateRatio.table.help.scope")
                },
                {
                    text: this.typeA,
                    value: "paramA_val",
                    show: true,
                    help: this.$t("additional:modules.tools.cosi.calculateRatio.table.help.typeA")
                },
                {
                    text: this.typeB,
                    value: "paramB_val",
                    show: true,
                    help: this.$t("additional:modules.tools.cosi.calculateRatio.table.help.typeB")
                },
                {
                    text: this.typeA + " / " + this.typeB,
                    value: "relation",
                    show: true,
                    help: this.$t("additional:modules.tools.cosi.calculateRatio.table.help.relation")
                },
                {
                    text: this.$t("additional:modules.tools.cosi.calculateRatio.table.text.capacity"),
                    value: "capacity",
                    show: this.fActive,
                    help: this.$t("additional:modules.tools.cosi.calculateRatio.table.help.capacity")
                },
                {
                    text: this.$t("additional:modules.tools.cosi.calculateRatio.table.text.need"),
                    value: "need",
                    show: this.fActive,
                    help: this.$t("additional:modules.tools.cosi.calculateRatio.table.help.need")
                },
                {
                    text: this.$t("additional:modules.tools.cosi.calculateRatio.table.text.coverage"),
                    value: "coverage",
                    show: true,
                    help: this.$t("additional:modules.tools.cosi.calculateRatio.table.help.coverage")
                }
            ];

            return head.filter(x=>x.show);
        },

        formatData () {
            return this.dataset.map(scope => ({
                ...scope,
                paramA_val: scope.paramA_val === undefined || scope.paramA_val === null || scope.paramA_val === "NaN" ? this.$t("additional:modules.tools.cosi.calculateRatio.table.noData") : scope.paramA_val.toLocaleString("de-DE"),
                paramB_val: scope.paramB_val === undefined || scope.paramB_val === null || scope.paramB_val === "NaN" ? this.$t("additional:modules.tools.cosi.calculateRatio.table.noData") : scope.paramB_val.toLocaleString("de-DE"),
                relation: scope.relation.toLocaleString("de-DE"),
                coverage: scope.coverage.toLocaleString("de-DE") + "%",
                capacity: scope.capacity.toLocaleString("de-DE"),
                need: scope.need.toLocaleString("de-DE")
            }));
        }
    }
};
</script>

<template lang="html">
    <div class="calc_ratio_results data_table">
        <v-data-table
            :headers="headers"
            :items="formatData"
            :items-per-page="10"
            :items-per-page-text="$t('additional:modules.tools.cosi.calculateRatio.table.itemsPerPage')"
            class="elevation-1"
            hide-default-header
        >
            <template
                #header="{ props }"
            >
                <thead>
                    <tr>
                        <th
                            v-for="header in props.headers"
                            :key="header.text"
                        >
                            <p>
                                <strong>{{ header.text }}</strong>
                                <template v-if="header.value === 'capacity' || header.value === 'need'">
                                    <br><small>(F = {{ faktorF }})</small>
                                </template>
                            </p>
                            <div class="col_info">
                                <p>{{ header.help }}</p>
                            </div>
                        </th>
                    </tr>
                </thead>
            </template>
            <template
                #[`item.scope`]="{ item }"
            >
                <td class="text-start name-cell">
                    {{ item.scope }}
                </td>
            </template>
            <template
                #[`item.paramA_val`]="{ item }"
            >
                <div
                    class="table_cell"
                    :class="{ lower: item.index >= dataset.length/2 }"
                >
                    {{ item.paramA_val }}

                    <span v-if="item.data.incompleteDatasets_A > 0">*</span>
                    <div
                        v-if="item.data.incompleteDatasets_A > 0"
                        class="hover_helper"
                    >
                        <h2><strong>{{ item.data.incompleteDatasets_A.toLocaleString("de-DE") }} / {{ item.data.datasets_A }}</strong> {{ $t("additional:modules.tools.cosi.calculateRatio.table.dataIncomplete") }}</h2>
                        <p>{{ $t("additional:modules.tools.cosi.calculateRatio.table.dataIncompleteHint") }}</p>
                    </div>
                </div>
            </template>
            <template #[`item.paramB_val`]="{ item }">
                <!-- eslint-disable-next-line vue/no-multiple-template-root -->
                <div class="table_cell">
                    {{ item.paramB_val }}

                    <span v-if="item.data.incompleteDatasets_B > 0">*</span>
                    <div
                        v-if="item.data.incompleteDatasets_B > 0"
                        class="hover_helper"
                    >
                        <h2><strong>{{ item.data.incompleteDatasets_B.toLocaleString("de-DE") }} / {{ item.data.datasets_B }}</strong> {{ $t("additional:modules.tools.cosi.calculateRatio.table.dataIncompleteHint") }}</h2>
                        <p>{{ $t("additional:modules.tools.cosi.calculateRatio.table.dataIncomplete") }}</p>
                    </div>
                </div>
            </template>
        </v-data-table>
    </div>
</template>

<style lang="scss">
    .calc_ratio_results.data_table {
        overflow:visible;
        th {
            position:relative;
            z-index:10;

            .col_info {
                position:absolute;
                opacity:0;
                pointer-events: none;
                top:0;
                left:0;
                width:auto;
                height:auto;
                padding:10px;
                box-sizing: border-box;
                background:white;
                border:1px solid #ccc;
                z-index:12;

                p {
                    font-size:12px;
                }
            }

            &:hover {
                cursor:pointer;
                .col_info {
                    opacity:1;
                    pointer-events:all;
                    transition:0.15s linear 0.3s;
                }
            }
        }
        td {
            text-align: right;
            vertical-align: middle;
            &.name_cell {
                text-align:left;
            }
        }

        .table_cell {
            display: flex;
            align-items: center;
            justify-content: end;
            position:relative;
            width:100%;
            height:100%;

            span {
                color:black;
                font-weight:900;
            }

            .hover_helper {
                position: absolute;
                pointer-events:none;
                opacity: 0;
                top: 0;
                left: calc(100% - 30px);
                width: auto;
                min-width:360px;
                text-align: center;
                padding: 10px;
                box-sizing: border-box;
                height: auto;
                background: white;
                border:1px solid #ccc;
                pointer-events: none;
                transition: 0.3s;
                z-index:10;

                h2 {
                    color:black;
                    font-size:13px;
                    font-weight:700;
                    text-align:left;
                    padding-bottom:5px;
                    margin-bottom:5px;
                    border-bottom:1px solid #ccc;
                    text-transform: none;

                    strong {
                        font-size:16px;
                        margin-right:10px;
                    }
                }

                p {
                    color:#888;
                    font-size:12px;
                    text-align:left;
                }
            }

            &.lower {
                .hover_helper {
                    top:auto;
                    bottom:0;
                }
            }

            &:hover {
                .hover_helper {
                    opacity:1;
                    pointer-events:all;
                    transition:0.3s;
                }
            }
        }
    }
</style>


