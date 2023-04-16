<script>
import {mapMutations} from "vuex";
export default {
    name: "EditForReportTemplate",
    data () {
        return {
            count: 0,
            props: ["reportTemplateMode", "toolName"]
        };
    },
    methods: {
        ...mapMutations("Tools/ReportTemplates", ["finishEditingToolSettings", "abortEditingToolSettings"])
    }
};
</script>

<template>
    <v-card
        v-if="!(reportTemplateMode===null)"
        variant="tonal"
        color="grey lighten-3"
        width="400px"
        class="mt-3 mb-3"
    >
        <v-card-title>Tool für Report Template Einstellen</v-card-title>
        <v-card-text>
            Wählen Sie die für Ihre Analyse notwendigen Datenlayer aus dem Themenbaum aus. Geben Sie dann alle gewünschten Einstellungen hier ein. Drücken Sie auf übernehmen, um die Einstellungen in das Report Template zu übernehmen.
        </v-card-text>
        <v-card-actions>
            <v-btn
                id="reporttemplate-editing-done"
                dense
                small
                tile
                color="grey lighten-1"
                @click="abortEditingToolSettings(toolName)"
            >
                <!-- abortEditingToolSettings: mutation imported from reportTemplate by parent component -->
                abbrechen
            </v-btn>
            <v-btn
                id="reporttemplate-editing-done"
                dense
                small
                tile
                color="light green"
                @click="finishEditingToolSettings(toolName)"
            >
                <!-- finishEditingToolSettings: mutation imported from reportTemplate by parent component -->

                übernehmen
            </v-btn>
        </v-card-actions>
    </v-card>
</template>


