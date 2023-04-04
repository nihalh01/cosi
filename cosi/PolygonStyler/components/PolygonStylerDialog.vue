<script>
import {convertToHexColor} from "../../../../src/utils/convertColor.js";

export default {
    name: "PolygonStylerDialog",
    props: {
        items: {
            type: Array,
            required: true
        },
        dialog: {
            type: Boolean,
            requierd: true
        }
    },
    data () {
        return {
            headersTwo: [
                {
                    text: "Attribut",
                    value: "attribute"
                },
                {
                    text: "Farbe",
                    value: "color",
                    sortable: false
                }
            ],
            colorPickerDialog: false,
            color: "",
            selectedItem: null
        };
    },
    computed: {
        _dialog: {
            get () {
                return this.dialog;
            },
            set (v) {
                console.log(v);
                this.$emit("hideDialog");
                // this.emit to parent
                // this._dialog = v;
            }
        },
    },
    methods: {
        test (item) {
            console.log("Test", item);
            this.colorPickerDialog = true;
            this.selectedItem = item;
        },

        testTwo (color) {
            console.log(color);
            this.selectedItem.color = color.hex;
            console.log(this.items);
            console.log(this.selectedItem);

        }

    }
};
</script>

<template>
    <div>
        <v-dialog
            v-model="_dialog"
            max-width="590"
        >
            <v-data-table
                :headers="headersTwo"
                :items="items"
                :hide-default-footer="true"
                :items-per-page="-1"
            >
                <template #[`item.color`]="{ item }">
                    <v-avatar
                        :color="item.color"
                        size="32"
                        @click="test(item)"
                    />
                </template>
            </v-data-table>
            <v-btn
                color="green darken-1"
                text
                @click="_dialog = false"
            >
                Agree
            </v-btn>
        </v-dialog>
        <v-dialog
            v-model="colorPickerDialog"
            max-width="290"
        >
            <v-color-picker
                v-model="color"
                dot-size="25"
                @update:color="testTwo"
            />
            <v-btn
                color="green darken-1"
                text
                @click="colorPickerDialog = false"
            >
                Agree
            </v-btn>
        </v-dialog>
    </div>
</template>

<style lang="scss" scoped>
</style>
