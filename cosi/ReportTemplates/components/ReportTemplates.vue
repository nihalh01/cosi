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
            ui_items: ["Importieren", "Bearbeiten", "Anwenden", "Exportieren"],
            uiModes: {
                startingTemplateSelected: false
            },
            exportLoading: false // true if currently applying a template and exporting
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/ReportTemplates", Object.keys(getters)),
        ...mapGetters("Tools/ToolBridge", ["currentSettings"]),
        ...mapGetters("Maps", {getMapView: "getView"}),
        ...mapGetters("Tools/SelectionManager", ["lastSelectionWithCurrentDataLayers"]),
        ...mapGetters("Tools/DistrictSelector", ["selectedDistrictNames"])


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
                this.uiModes.startingTemplateSelected = false;
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
            this.uiModes.startingTemplateSelected = true;
        },
        editingTool (newValue, oldValue) {
            const stopEditing = newValue.toolName === null,
                startEditing = !stopEditing,
                editsAccepted = newValue.accepted;

            if (startEditing) {
                // update tool interface based on stored settings via toolbridge (without actually applying the tool)
                this.runTool({
                    toolName: this.templateItems[newValue.templateItemsIndex].tool, // the selected tool
                    settings: this.templateItems[newValue.templateItemsIndex].settings, // the settings stored previously via the `updateToolSeetings()` method
                    // eslint-disable-next-line no-empty-function
                    outputCallback: ()=>{},
                    updateInterfaceOnly: true
                });
            }

            // if we just finished editing and edits were accepted...
            if (stopEditing & editsAccepted) {
                // copy settings from tool
                this.updateToolSettings(oldValue.templateItemsIndex);
                // copy data selection
                // if no data selection can be applied, only throw a warning - this may be okay depending on what tool is used.
                try {
                    this.copyCurrentDataSelection(oldValue.templateItemsIndex);
                }
                catch (error) {
                    console.warn(error);
                }


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

            // 1. set data selection (or give resolved promise if none)
            let dataSelected = Promise.resolve();

            if (Object.keys(chapter.dataSelection).length !== 0) {
                dataSelected = this.setCurrentDataSelectionLayersOnly(chapter.dataSelection);
            }

            // 2. run analysis
            dataSelected.then(()=>{
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
                        content: "Analyse Kapitel " + (templateItemsIndex + 1) + " dauert mehr als 15 Sekunden und konnte eventuell nicht ausgefuehrt werden. Bitte überprüfen Sie die Tool Einstellungen.",
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
                15000);


        },

        exportTemplate () {
            this.exportLoading = true;
            if (this.selectedExportFormat === "Importierbares Template (json)") {
                this.exportTemplateJSON();
                this.exportLoading = false;
                return;
            }
            this.runTemplate(()=>{
                if (this.selectedExportFormat === "HTML") {
                    this.exportTemplateToHTML();
                }
                else if (this.selectedExportFormat === "PDF") {
                    this.reportTemplateToPDF(this.templateItems); // from ExportPDF addon
                }
                this.exportLoading = false;
            });
        },
        exportTemplateJSON () {
            this.downloadObjectAsJson(this.templateItems, "template");

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
        emptyTemplate () {
            this.$store.state.Tools.ReportTemplates.templateItems = [];
            this.uploadedTemplate = null;
            this.addEmptyTemplateItem();
        },
        addEmptyTemplateItem () { // "+" button to add new chapters to the template
            const newID = 1 + Math.max(...this.templateItems.map(o => o.id)); // create an ID one larger than the highest id in array

            this.templateItems.push({title: "Neues Kapitel...", description: "", tool: "Dashboard", settings: {}, hasSettings: false, output: {}, hasOutput: false, dataSelection: {}, dataSelectionApplied: false, hasDataSelection: false, id: newID});

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
                return Promise.resolve();
            }
            this.setAcceptSelection(null); // make sure watcher is triggered in next line
            this.setAcceptSelection(dataSelection); // commit to selectionManager
            // returns a promise that resolves when data is loaded (or gets rejected after timeout)
            return promisedEvent.call(
                this,
                "featureListUpdatedBy-setBBoxToGeom-updateSource",
                15000);

        },
        setCurrentDataSelectionLayersOnly (dataSelection) {
            // get the current data selection from selectionmanager for the geometry..
            const lastSelection = this.lastSelectionWithCurrentDataLayers,
                newSelection = lastSelection;

            // replace the selected data layers with whats in the dataSelection provided as parameters
            newSelection.storedLayers = dataSelection.storedLayers;
            // apply it
            return this.setCurrentDataSelection(newSelection);

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
        openToolInterface (toolName, closeReportTemplates = true) {
            this.$store.commit("Tools/" + toolName + "/setActive", true);
            if (closeReportTemplates) {
                this.$store.commit("Tools/ReportTemplates/setActive", false);
            }
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
            <v-app>
                <v-container class="main_container">
                    <!-- IMPORT / START NEW -->

                    <v-row>
                        <v-col>
                            <v-row>
                                <h4>Template wählen</h4>
                            </v-row>
                            <v-row class="ml-5">
                                Sie können entweder ein bestehendes Report Template hochladen, oder ein neues Template erstellen.
                            </v-row>
                            <v-row class="ml-5">
                                <v-file-input
                                    v-model="uploadedTemplate"
                                    accept="application/JSON"
                                    label="Datei wählen.."
                                    dense
                                />
                                <v-btn
                                    dense
                                    small
                                    tile
                                    color="grey lighten-1"
                                    @click="emptyTemplate();uiModes.startingTemplateSelected=true"
                                >
                                    <v-icon>mdi-plus</v-icon>
                                </v-btn>
                            </v-row>
                            <v-divider />
                        </v-col>
                    </v-row>
                    <!-- EDITING -->
                    <v-row v-if="uiModes.startingTemplateSelected">
                        <v-col>
                            <v-row>
                                <h4>Template Bearbeiten</h4>
                            </v-row>
                            <v-row>
                                <v-col cols="12">
                                    <!-- one v-card per chapter in the template -->
                                    <v-card
                                        v-for="(templateItem,index) in templateItems"
                                        :key="index"
                                        class="mt-5 mb-8 ml-5"
                                        color="light gray"
                                        tile
                                    >
                                        <v-card-title>Kapitel {{ index+1 }}</v-card-title>

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
                                                        label="Titel"
                                                    />
                                                </v-col>
                                            </v-row>
                                            <!-- description -->
                                            <v-row>
                                                <v-col cols="12">
                                                    <v-textarea
                                                        v-model="templateItem.description"
                                                        label="Beschreibung"
                                                    />
                                                </v-col>
                                            </v-row>
                                            <!-- tool selection -->
                                            <v-row>
                                                <v-col cols="8">
                                                    <v-select
                                                        v-model="templateItem.tool"
                                                        label="Tool wählen"
                                                        :items="supportedTools"
                                                        item-text="title"
                                                        item-value="value"
                                                    />
                                                </v-col>
                                                <v-col cols="4">
                                                    <v-btn
                                                        dense
                                                        @click="startEditingToolSettings({toolName: templateItem.tool,templateItemsIndex: index})"
                                                    >
                                                        <v-icon>mdi-pen</v-icon>
                                                    </v-btn><br><br>
                                                </v-col>
                                            </v-row>
                                            <v-row v-if="!templateItem.hasToolSettings & templateItem.tool">
                                                <v-card
                                                    color="orange"
                                                    class="m-3 p-3"
                                                >
                                                    <v-card-text>Keine Tool Einstellungen gewählt. Bitte klicken Sie auf den Stift, und stellen Sie das Tool ein</v-card-text>
                                                </v-card>
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
                            <v-row>
                                <v-btn
                                    color="grey lighten-1"
                                    dense
                                    small
                                    tile
                                    @click="exportTemplateJSON"
                                >
                                    Speichern
                                </v-btn>
                            </v-row>
                        </v-col>
                    </v-row>
                    <!-- EXPORT -->
                    <v-row
                        v-if="uiModes.startingTemplateSelected"
                        class="mt-4"
                    >
                        <v-col>
                            <v-row><v-divider /></v-row>
                            <v-row>
                                <h4>Auf Gebiet anwenden</h4>
                            </v-row>
                            <v-row height="5px" />
                            <v-row v-if="selectedDistrictNames.length===0">
                                <v-card
                                    class=""
                                    color="orange"
                                    width="400px"
                                >
                                    <v-card-text>Keine Gebiete gewählt. Öffnen Sie die Gebietsauswahl, und wählen Sie die Gebiete, auf die Sie das Report Template anwenden wollen. Kehren Sie dann zum Report Template tool zurück, um es auf die gewählten Gebiete anzuwenden.</v-card-text>
                                    <v-card-actions>
                                        <v-btn @click="openToolInterface('DistrictSelector')">
                                            zur Gebietsauswahl
                                        </v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-row>
                            <ul v-if="selectedDistrictNames.length>0">
                                <li
                                    v-for="(districtName,index) in selectedDistrictNames"
                                    :key="index"
                                >
                                    {{ districtName }}
                                </li>
                            </ul>
                            <v-row v-if="selectedDistrictNames.length>0">
                                <v-select
                                    v-model="selectedExportFormat"
                                    label="Export Format"
                                    :items="supportedExportFormats"
                                />
                            </v-row>
                            <v-row
                                v-if="selectedDistrictNames.length>0"
                                class="mb-2"
                            >
                                <v-btn
                                    color="light green"
                                    @click="exportTemplate"
                                >
                                    <div v-if="!exportLoading">
                                        Exportieren
                                    </div>
                                    <div v-else>
                                        <v-progress-circular indeterminate />
                                    </div>
                                </v-btn>
                            </v-row>
                        </v-col>
                    </v-row>
                </v-container>
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
