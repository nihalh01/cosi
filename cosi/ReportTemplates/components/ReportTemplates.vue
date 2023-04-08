<script>
// Documentation in ./doc/ReportTemplates.md
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";
import {getComponent} from "../../../../src/utils/getComponent";
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersReportTemplates";
import mutations from "../store/mutationsReportTemplates";
import tableify from "tableify"; // generate html tables from js objects
import promisedEvent from "../utils/promisedEvent";
export default {
    name: "ReportTemplates",
    components: {
        Tool
    },
    data () {
        return {
            uploadedTemplate: null, // file input field for report templates. This variable is watched and used to replace `templateItems` store variable
            supportedExportFormats: ["HTML", "PDF", "Importierbares Template (json)"],
            selectedExportFormat: "HTML",
            ui_currentTab: 0, // vuetify tab content based on v-model
            ui_tab: null,
            ui_items: ["Importieren", "Bearbeiten", "Anwenden", "Exportieren"]
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/ReportTemplates", Object.keys(getters)),
        ...mapGetters("Tools/ToolBridge", ["currentSettings"]),
        ...mapGetters("Maps", {getMapView: "getView"}),
        ...mapGetters("Tools/SelectionManager", ["activeSelection", "selections", "lastSelectionWithCurrentDataLayers"]),
        ...mapGetters("Tools/FeaturesList", ["activeVectorLayerList", {facilitiesMapping: "mapping"}])

    },
    watch: {
        /**
         * whenever the template file input changes, load the file and overwrite templateItems array
         * @param {*} file file name (given in file input field)
         * @return {void}
         */
        uploadedTemplate (file) {
            // this is a bit convoluted:
            // 1. create a file reader object
            // 2. define the function that updates our array based on the file
            // 3. tell the fileReader to use that function when the file is loaded
            // 4. use the reader on the file

            if (!file) {
                return;
            }
            // 1. create a file reader object
            const reader = new FileReader(),
                // 2. define the function that updates our array based on the file
                updateTemplateItems = (() => { // callback when file is read: replace templateItem array

                    return (newItems) => {
                        // alert and exit if json is not in reportTemplate format
                        if (!this.templateItemJsonValid(newItems)) {
                            this.addSingleAlert("Datei ist kein valides Report Template.");
                            this.uploadedTemplate = null;
                            return;
                        }
                        // ..otherwise update state
                        this.$store.state.Tools.ReportTemplates.templateItems = newItems;

                    };
                })();

            // 3. tell the fileReader to use that function when the file is loaded
            reader.onload = () => { // when file is read, parse json and run callback
                let parsedJson = null;

                if (reader.result) {
                    try {
                        parsedJson = JSON.parse(reader.result);
                    }
                    catch (e) {
                        // on error, clear file input
                        this.uploadedTemplate = null;
                        this.addSingleAlert({
                            content: "Datei nicht lesbar oder kein valides JSON",
                            category: "Fehler",
                            displayClass: "error"
                        });
                        throw new Error(e); // error in the above string (in this case, yes)!
                    }
                }

                updateTemplateItems(parsedJson);

            };
            // 4. use the reader on the file
            reader.readAsText(file); // read file (and inherently run callback which replaces the templateItems array)
        },
        editingTool (newValue, oldValue) {
            const stopEditing = newValue.toolName === null,
                startEditing = !stopEditing,
                editsAccepted = newValue.accepted;

            if (startEditing) {
                console.log(this.templateItems[newValue.templateItemsIndex]);
                // update tool interface based on stored settings via toolbridge (without actually applying the tool)
                this.runTool({
                    toolName: this.templateItems[newValue.templateItemsIndex].tool, // the selected tool
                    settings: this.templateItems[newValue.templateItemsIndex].settings, // the settings stored previously via the `updateToolSeetings()` method
                    // eslint-disable-next-line no-empty-function
                    outputCallback: ()=>{},
                    updateInterfaceOnly: true
                });
            }
            if (stopEditing & editsAccepted) {
                // copy settings from tool
                this.updateToolSettings(oldValue.templateItemsIndex);

            }
            // if we were editing before, and the update to the editing mode says the edits should be accepted,
            // then copy the tool settings to the relevant chapter
            if (newValue.accepted && newValue.accepted === true && oldValue.toolName && oldValue.templateItemsIndex) {
                console.log("before ", this.templateItems[oldValue.templateItemsIndex].settings);
                this.templateItems[oldValue.templateItemsIndex].hasSettings = true;
                console.log("after ", this.templateItems[oldValue.templateItemsIndex].settings);
            }


        }
    },
    created () {
        this.$on("close", this.close);
    },
    mounted () {
        // ...
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapMutations("Tools/ReportTemplates", Object.keys(mutations)),
        ...mapActions("Tools/ToolBridge", ["runTool"]),
        ...mapActions("Maps", ["zoomToExtent"]),
        ...mapActions("Tools/ExportPDF", ["reportTemplateToPDF"]),
        ...mapMutations("Tools/SelectionManager", ["addSelection", "setActiveSelection", "setAcceptSelection"]),
        // store settings from selected addon in the template
        updateToolSettings (templateItemsIndex) {
            // get settings via ToolBridge currentSettings() method
            const toolSettings = this.currentSettings(this.templateItems[templateItemsIndex].tool);

            // update array
            this.templateItems[templateItemsIndex].settings = toolSettings; // update settings
            this.templateItems[templateItemsIndex].hasSettings = true; // handled as UI checkbox
            this.clearTemplateItemOutput(templateItemsIndex); // delete any previous results - they may no longer match the settings


        },
        /**
         * Apply all template chapters sequentially
         * @param {*} callback runs after all chapters were applied (no input and return value not returned)
         * @param {*} startIndex from which chapter to start (parameter needed for recursion)
         * @return {void}
         */
        runTemplate (callback, startIndex = 0) {
            // recursive function - exit with callback after all chapters finished
            if (startIndex >= this.templateItems.length) {
                if (callback) {
                    // eslint-disable-next-line callback-return
                    callback();
                }
                return;
            }
            // run chapter, then restart this function with the next chapter
            this.applyChapter(startIndex, ()=>{
                this.runTemplate(callback, startIndex + 1);
            });

        },
        /**
         * apply chapter data selection, wait for data, run analysis
         * @param {*} templateItemsIndex index of chapter in templateItems
         * @param {*} finallyDo what to do in the end, no matter if applying the chapter worked or not (no input expected)
         * @return {void}
         */
        applyChapter (templateItemsIndex, finallyDo) {
            const chapter = this.templateItems[templateItemsIndex];

            // 1. set data selection
            this.setCurrentDataSelection(chapter.dataSelection)
            // 2. run analysis
                .then(()=>{
                    this.clearTemplateItemOutput(templateItemsIndex);
                    this.templateItems[templateItemsIndex].hasOutput = false;
                    return this.updateToolOutput(templateItemsIndex);
                })
                .then(()=>{
                    this.templateItems[templateItemsIndex].hasOutput = true;
                })
            // 3. alert on failure
                .catch(()=>{

                    this.addSingleAlert({
                        content: "Analyse Kapitel " + templateItemsIndex + " konnte eventuell nicht ausgefuehrt werden",
                        category: "Fehler",
                        displayClass: "error"
                    });
                })
            // 4. run callback once all finished
                .finally(()=>{
                    if (finallyDo) {
                        finallyDo();
                    }
                });
        },
        /**
         * run a different addon based on templateItem, store results
         * @param {integer} templateItemsIndex array index of the templateItem to run
         * @param {*} callbackAfterOutputReceived what to do after the results are commited back from the external tool to the reportTemplate store (receives no input)
         * @returns {Promise} a promise that resolves once the output is received, or is rejected after a timeOut
         */
        updateToolOutput (templateItemsIndex) {


            // check if tool settings are stored
            if (!this.templateItems[templateItemsIndex].hasSettings) {
                this.addSingleAlert({
                    content: "Keine Tool Einstellungen verfügbar",
                    category: "Fehler",
                    displayClass: "error"
                });
                // since updateToolOutput failed, directly return a rejected promise
                return Promise.reject(new Error("No toolBridge settings available for template item " + templateItemsIndex));
            }

            // in the end...
            // eslint-disable-next-line require-jsdoc
            const outputCallback = (output)=>{
                const itemID = templateItemsIndex;

                // ..commit the result to the store variable
                this.$store.commit("Tools/ReportTemplates/templateItemOutput", {output, itemID});
                // emit event that resolves the promise returned from updateToolOutput function
                this.$root.$emit("reportTemplates-received-output-" + templateItemsIndex);
            };


            // calls toolBridge to run the selected tool with the given settings
            // outputCallback then saves the results to this.templateItems
            this.runTool({
                toolName: this.templateItems[templateItemsIndex].tool, // the selected tool
                settings: this.templateItems[templateItemsIndex].settings, // the settings stored previously via the `updateToolSeetings()` method
                outputCallback: outputCallback
            });
            return promisedEvent.call(this,
                "reportTemplates-received-output-" + templateItemsIndex,
                5000);


        },

        exportTemplate () {
            if (this.selectedExportFormat === "Importierbares Template (json)") {
                this.downloadObjectAsJson(this.templateItems, "template");
            }
            if (this.selectedExportFormat === "HTML") {
                this.exportTemplateToHTML();
            }
            else if (this.selectedExportFormat === "PDF") {
                this.reportTemplateToPDF(this.templateItems); // from ExportPDF addon
            }
        },
        exportTemplateToHTML () {

            /** Don't allow html input by user, show it as plain text instead by escaping special html characters
             * @param {*} unsafe - todo
             * @return {String} save html
             */
            function escapeHtml (unsafe) {
                // make sure input is a string
                if (!(typeof unsafe === "string")) {
                    throw new Error("escapeHTML must be a string");
                }

                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }
            // manually assemble an html document.
            const exportedHtml = this.templateItems.map((item) => {

                    // for each chapter...
                    // set defaults
                    let resulthtml = "",
                        sourceInfo = "Quelleninformation fehlt.";// defaults
                    const tips = "<span style='color:orange;'>Weiterverarbeitung in Word: <ul><li>Neues Word Dokument öffnen</li><li>In Word Querformat einstellen</li><li>Inhalt dieser seite markieren (Strg+A) und in Word kopieren</li><li>Alles markieren und Schriftgröße verkleinern</li><li>Zeilenumbrüche in Kopfzeilen von Tabellen einfügen</li><li>Sollten Tabellen nach wie vor zu breit sein, Anzahl der Spalten bzw. ausgewählten Gebiete begrenzen</li><li>Spaltenbreite anpassen</li></ul></span>";

                    // make table or image html..
                    if (item.output.type === "table") {
                        resulthtml = tips + "<br>" + tableify(item.output.result); // tableify converts an js object to a (string) html table
                    }
                    if (item.output.type === "image") {
                        resulthtml = "<img src='" + item.output.result + "'>";
                    }
                    // add source info if it exists
                    if (item.output.sourceInfo) {
                        // // simplify nested object into array of arrays
                        // sourceInfo = Object.values(item.output.sourceInfo).map(Object.values).map(x=>{
                        //     return x.flat();
                        // });
                        // Experimental
                        sourceInfo = Object.values(item.output.sourceInfo).map((metadata) => { // for each meta data entry..
                            return Object.values(metadata).map((x, i) => { // for each piece of information in  the entry..
                                return Object.keys(metadata)[i] + ": " + x; // concatenate keys to values..
                            }).join("<br>"); // combine this metadata entry to single string..
                        }).join("<br><br><br>"); // combine all metadata entries together to single string
                    }
                    // put together in structured & styled HTML
                    return "<h1>" + escapeHtml(item.title) + "</h1><br>" + // title as h1 element
                    "<span>" + escapeHtml(item
                        .description) + "</span><br><br>" + // description as span element
                        resulthtml + "<br><br><span> <b>Quellen:</b><br><br><small>" + sourceInfo + "</small></span>";

                }).join("<br>") // concatenate resulting array of strings into a single string with line breaks
                // rotate table column headers
                + "<style>" +
                "tr{font-size:8pt;}" +
                "th{font-size:8pt;}" +
                "th {\n    height: 240px;\n    vertical-align: bottom;\n    text-align: left;\n    line-height: 1;\n  }" +
                "th {\n    width: 300px;\n    transform-origin: bottom left;\n    transform: translateX(75px) rotate(-45deg);\n  }" +
                "</style>",
                // open a new window and fill it with the constructed html

                win = window.open("", "Export", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=200,top=" + (screen.height - 400) + ",left=" + (screen.width - 840));

            win.document.body.innerHTML = exportedHtml;

            win.focus();

        },
        downloadObjectAsJson (exportObj, exportName) { // used to save the template as json
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj)),
                downloadAnchorNode = document.createElement("a");

            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", exportName + ".json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        },
        addEmptyTemplateItem () { // "+" button to add new chapters to the template
            const newID = 1 + Math.max(...this.templateItems.map(o => o.id)); // create an ID one larger than the highest id in array

            this.templateItems.push({title: "", description: "", tool: "Dashboard", settings: {}, hasSettings: false, output: {}, hasOutput: false, dataSelection: {}, dataSelectionApplied: false, hasDataSelection: false, id: newID});

        },
        deleteTemplateItem (id) { // id is the value for key "id" in the templateItem (stable & unique), not the array index (unstable)
            this.$store.state.Tools.ReportTemplates.templateItems = this.templateItems.filter(x => x.id !== id);
        },
        clearTemplateItemDataSelection (index) {
            this.templateItems[index].dataSelection = {};
            this.templateItems[index].hasDataSelection = false;

        },
        clearTemplateItemSettings (index) {
            this.templateItems[index].settings = {};
            this.templateItems[index].hasSettings = false;

        },
        clearTemplateItemOutput (index) {
            this.templateItems[index].output = {};
            this.templateItems[index].hasOutput = false;

        },

        // copy data selection from SelectionManager
        copyCurrentDataSelection (index) {

            this.templateItems[index].dataSelection = this.lastSelectionWithCurrentDataLayers;
            this.templateItems[index].hasDataSelection = true;


        },
        // add stored selection to  SelectionManager
        /**
         *
         * @param {*} dataSelection the data selection as retreived from selectionManager
         * @return {Promise} a promise that resolves when data is loaded, or gets rejected after a timeout
         */
        setCurrentDataSelection (dataSelection) {
            if (Object.keys(dataSelection).length === 0) {
                this.addSingleAlert({
                    content: "Gespeicherte Datenauswahl ist leer",
                    category: "Fehler",
                    displayClass: "error"
                });
                return null;
            }
            this.setAcceptSelection(null); // make sure watcher is triggered in next line
            this.setAcceptSelection(dataSelection); // commit to selectionManager
            // returns a promise that resolves when data is loaded (or gets rejected after timeout)
            return promisedEvent.call(
                this,
                "featureListUpdatedBy-setBBoxToGeom-updateSource",
                5000);

        },
        /**
         * either delete or copy data selection depending on which way the check box was toggled
         * @param {integer} index the array item index of the templateItem
         * @return {void}
         */
        hasDataToggle (index) {
            // copy data selection if turned on:
            if (this.templateItems[index].hasDataSelection) {
                this.copyCurrentDataSelection(index);
            }
            // otherwise delete data selection
            if (!this.templateItems[index].hasDataSelection) {
                this.clearTemplateItemDataSelection(index);
            }
        },
        /**
         * either delete or copy tool settings depending on which way the check box was toggled
         * @param {integer} index the array item index of the templateItem
         * @return {void}
         */
        hasSettingsToggle (index) {
            // copy data selection if turned on:
            if (this.templateItems[index].hasSettings) {
                this.updateToolSettings(index);
            }
            // otherwise delete data selection
            if (!this.templateItems[index].hasSettings) {
                this.clearTemplateItemSettings(index);
            }
        },
        /**
         * either delete or copy tool settings depending on which way the check box was toggled
         * @param {integer} index the array item index of the templateItem
         * @return {void}
         */
        hasOutputToggle (index) {
            // request output if turned on:
            if (this.templateItems[index].hasOutput) {
                this.updateToolOutput(index);
            }
            // otherwise delete data selection
            if (!this.templateItems[index].hasOutput) {
                this.clearTemplateItemOutput(index);
            }
        },
        /**
         * apply data selection and track which one is selected
         * @param {integer} index the array item index of the templateItem
         * @return {void}
         */
        dataSelectionAppliedToggle (index) {
            // if the dataselection is turned on...
            if (this.templateItems[index].dataSelectionApplied) {
                // set dataSelectionApplied to false for all templateItems except the selected one
                for (let i = 0; i < this.templateItems.length; i++) {
                    if (i !== index) {
                        this.templateItems[i].dataSelectionApplied = false;
                    }
                }
                // apply data selection
                this.setCurrentDataSelection(this.templateItems[index].dataSelection);
            }
            // if dataselection is turned of, nothing happens. Data selection is a one way street - we don't "unselect" data.

        },

        getSelectionAndSettings (index) {
            this.clearTemplateItemDataSelection(index);
            this.clearTemplateItemSettings(index);
            this.copyCurrentDataSelection(index);
            this.updateToolSettings(index);

        },
        /**
         * check if json format matches what is expected from reportTemplate(items) array
         * @param {*} reportTemplate a reportTemplate as Json (matching reportTemplateItems)
         * @returns {boolean} true if jsonObj is an array and each item has the required keys
         */
        templateItemJsonValid (reportTemplate) {

            // must be an array
            if (!Array.isArray(reportTemplate)) {
                console.warn("reportTemplate JSON is not an array");
                return false;
            }

            // each item must have the required keys (if not, return false)
            const requiredKeys = ["title", "description", "tool", "settings", "hasSettings", "output", "hasOutput", "dataSelection", "hasDataSelection", "dataSelectionApplied", "id"];

            for (const i in reportTemplate) {
                for (const j in requiredKeys) {
                    if (!(requiredKeys[j] in reportTemplate[i])) {
                        console.warn("reportTemplate JSON array item " + i + " does not contain key " + requiredKeys[j]);
                        return false;
                    }

                }
            }
            // if passed all checks
            return true;

        },
        openToolInterface (toolName) {
            this.$store.commit("Tools/" + toolName + "/setActive", true);
        },
        close () {
            this.setActive(false);
            const model = getComponent(this.id);

            if (model) {
                model.set("isActive", false);
            }
        }
    }
};
</script>

<template lang="html">
    <Tool
        :id="id"
        :title="$t('additional:modules.tools.cosi.reportTemplates.title')"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
    >
        <template #toolBody>
            <v-row v-if="editingTool.toolName">
                Hallo!
                <v-btn @click="abortEditingToolSettings()">
                    Abbrechen
                </v-btn>
                <v-btn @click="finishEditingToolSettings()">
                    übernehmen
                </v-btn>
            </v-row>
            <v-app
                v-else
                id="ReportTemplates-wrapper"
                absolute
            >
                <v-tabs
                    v-model="ui_tab"
                    fixed-tabs
                >
                    <v-tabs-slider color="amber darken-3" />
                    <v-tab
                        v-for="(item, index) in ui_items"
                        :key="item"
                        :class="{active: ui_currentTab === index}"
                        @click="ui_currentTab = index"
                    >
                        {{ item }}
                    </v-tab>
                </v-tabs>
                <v-tabs-items v-model="ui_tab">
                    <v-card flat>
                        <!-- tab: import -->
                        <div v-show="ui_currentTab === 0">
                            <v-container class="main_container">
                                <br><br>
                                <v-file-input
                                    v-model="uploadedTemplate"
                                    accept="application/JSON"
                                    label="Datei wählen.."
                                    dense
                                />
                            </v-container>
                        </div>

                        <!-- tab: edit -->
                        <div v-show="ui_currentTab === 1">
                            <v-divider />
                            <v-container class="main_container">
                                <v-row>
                                    <v-col cols="12">
                                        <!-- one v-card per chapter in the template -->
                                        <v-card
                                            v-for="(templateItem,index) in templateItems"
                                            :key="index"
                                            class="mt-5 mb-8"
                                            outlined
                                            tile
                                        >
                                            <v-container>
                                                <!-- delete item button -->
                                                <v-row>
                                                    <v-col
                                                        cols="12"
                                                        align="right"
                                                    >
                                                        #{{ index+1 }}
                                                        <v-icon
                                                            small
                                                            @click="deleteTemplateItem(templateItem.id)"
                                                        >
                                                            mdi-trash-can
                                                        </v-icon>
                                                    </v-col>
                                                </v-row>
                                                <!-- title -->
                                                <v-row>
                                                    <v-col cols="12">
                                                        <v-text-field
                                                            v-model="templateItem.title"
                                                            class="text-xl-h4 textfieldtitle"
                                                            label="Titel"
                                                            filled
                                                        />
                                                    </v-col>
                                                </v-row>
                                                <!-- description -->
                                                <v-row>
                                                    <v-col cols="12">
                                                        <br><br>
                                                        <v-textarea
                                                            v-model="templateItem.description"
                                                            label="Beschreibung"
                                                            class=""
                                                        />
                                                        <br><br>
                                                    </v-col>
                                                </v-row>
                                                <!-- tool selection -->
                                                <v-row>
                                                    <v-col cols="12">
                                                        <v-select
                                                            v-model="templateItem.tool"
                                                            label="Tool wählen"
                                                            :items="supportedTools"
                                                            item-text="title"
                                                            item-value="value"
                                                            @change="getSelectionAndSettings(index)"
                                                        />
                                                    </v-col>
                                                </v-row>
                                                <!-- get data selection -->

                                                <v-row class="mb-2">
                                                    <v-switch
                                                        v-model="templateItem.hasDataSelection"
                                                        label="Datenauswahl"
                                                        @change="hasDataToggle(index)"
                                                    />
                                                    <v-switch
                                                        v-model="templateItem.hasSettings"
                                                        label="Tool Einstellungen"
                                                        @change="hasSettingsToggle(index)"
                                                    />
                                                </v-row>
                                                <v-row class="mb-2">
                                                    <v-btn
                                                        dense
                                                        @click="startEditingToolSettings({toolName: templateItem.tool,templateItemsIndex: index})"
                                                    >
                                                        <!-- <v-icon>
                                                            mdi-map-marker-right
                                                        </v-icon> -->
                                                        Tool Einstellungen Bearbeiten
                                                    </v-btn><br><br>
                                                </v-row>
                                            </v-container>
                                        </v-card>
                                    </v-col>
                                </v-row>
                                <v-row class="mb-2">
                                    <v-col
                                        cols="12"
                                        align="right"
                                    >
                                        <v-icon
                                            @click="addEmptyTemplateItem"
                                        >
                                            mdi-note-plus
                                        </v-icon>
                                        <v-row />
                                    </v-col>
                                </v-row>
                            </v-container>
                        </div>
                        <!-- tab: apply -->

                        <div v-show="ui_currentTab === 2">
                            <v-container class="main_container">
                                <v-card
                                    v-for="(templateItem,index) in templateItems"
                                    :key="index"
                                    class="mt-5 mb-8 p-6"
                                    outlined
                                    tile
                                >
                                    <v-container>
                                        <v-row> <v-col><h1>{{ templateItem.title }}</h1></v-col></v-row>
                                        <v-row><v-col>{{ templateItem.description }}</v-col></v-row>
                                        <v-row v-if="templateItem.hasDataSelection">
                                            <v-col>
                                                <!-- <v-switch
                                                    v-model="templateItem.dataSelectionApplied"
                                                    :disabled="!templateItem.hasDataSelection"
                                                    label="Datenauswahl Anwendung"
                                                    @change="dataSelectionAppliedToggle(index)"
                                                /><br><br> -->
                                                <!-- set data selection -->
                                                <v-row class="mb-2">
                                                    <v-btn
                                                        dense
                                                        :disabled="!templateItem.hasDataSelection"
                                                        @click="setCurrentDataSelection(templateItem.dataSelection)"
                                                    >
                                                        <!-- <v-icon>
                                                            mdi-map-marker-right
                                                        </v-icon> -->
                                                        Datenauswahl anwenden
                                                    </v-btn><br><br>
                                                </v-row>
                                            </v-col>
                                        </v-row>
                                        <v-row v-if="templateItem.hasSettings">
                                            <!-- run tool -->
                                            <v-row class="mb-2">
                                                <v-switch
                                                    v-model="templateItem.hasOutput"
                                                    :disabled="!templateItem.hasSettings"
                                                    label="Ergebnisse"
                                                    @change="hasOutputToggle(index)"
                                                /><br><br>
                                            </v-row>
                                            <v-row class="mb-2">
                                                <v-btn

                                                    :disabled="!templateItem.hasSettings"
                                                    @click="applyChapter(index)"
                                                >
                                                    Ausfuehren
                                                </v-btn><br><br>
                                            </v-row>
                                        </v-row>
                                        <!-- display raw settings -->
                                        <!-- <v-row>
                                    <v-col cols="12">
                                        Einstellungen:
                                        <div
                                            class="limitSize rawData"
                                            v-html="JSON.stringify(templateItem.settings,undefined,2)"
                                        /><br>
                                    </v-col>
                                </v-row> -->
                                        <!-- display results -->
                                        <v-row class="mb-2">
                                            <div
                                                class="limitSize"
                                            >
                                                <!-- result might be a table, might be an image -->
                                                <div v-if="templateItem.output.type==='table'">
                                                    <div v-html="templateItem.output.result" />
                                                </div>
                                                <div v-if="templateItem.output.type==='image'">
                                                    <img
                                                        alt="template analysis result image"
                                                        :src="templateItem.output.result"
                                                    >
                                                </div>
                                            </div>
                                        </v-row>
                                    </v-container>
                                </v-card>
                                <v-row class="mb-2">
                                    <v-btn
                                        color="grey lighten-1"
                                        @click="runTemplate()"
                                    >
                                        Alle Ausfuehren
                                    </v-btn>
                                </v-row>
                            </v-container>
                        </div>
                        <!-- tab: export -->

                        <div v-show="ui_currentTab === 3">
                            <v-container class="main_container">
                                <v-row>
                                    <v-select
                                        v-model="selectedExportFormat"
                                        label="Export Format"
                                        :items="supportedExportFormats"
                                    />
                                </v-row>
                                <v-row class="mb-2">
                                    <v-btn
                                        color="grey lighten-1"
                                        @click="exportTemplate()"
                                    >
                                        Exportieren
                                    </v-btn>
                                </v-row>
                                <br>
                                <v-row><v-divider /></v-row>
                            </v-container>
                        </div>
                    </v-card>
                </v-tabs-items>
            </v-app>
        </template>
    </Tool>
</template>

<style lang="scss" scoped>

#reportTemplates{
    overflow-y: auto;
    height:100%;
}
    .textfieldtitle {
        font-size: 2em !important;

    }
    .textfieldtitle input {
        line-height: 2em;
        min-height:em;
    }
    .rawData{
        max-width:500px;
        max-height:50px;
        overflow:scroll;
    }
    .limitSize{
        max-width:500px;
        max-height:10em;
        overflow-y: scroll;
        overflow-x:hidden;
    }
    .templateItem{
        width:90%;
        left:5%;
        background:rgb(200, 200, 200);
    }

    // custom buttons
    .btn-done{
        background-color: green;
    }
   // toolbridge output table
   td{
        padding-right: 5px;
        border-right-style: solid;
        border-left-style:solid;
        background:rgb(131, 113, 71);
    }
    th{
        border-bottom-style: solid;
    }

</style>
