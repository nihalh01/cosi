import {generateSimpleMutations} from "../../../../src/app-store/utils/generators";
import ReportTemplatesState from "./stateReportTemplates";
const mutations = {
    ...generateSimpleMutations(ReportTemplatesState),
    templateItemOutput (state, {output, itemID}) { // to overwrite a specific key of a specific array item
        state.templateItems[itemID].output = output;
        state.templateItems[itemID].hasOutput = true;

    },
    // open tool window in template mode (let it know which chapter is being edited)
    startEditingToolSettings (state, payload) {
        if (!payload.toolName) {
            throw new Error("Kein tool zum bearbeiten gewählt");

        }
        // close all other tools and stop their editing mode
        this.commit("Tools/ReportTemplates/closeToolsInTemplateMode");
        // open selected tool in editing mode
        this.commit("Tools/" + payload.toolName + "/setReportTemplateMode", payload.templateItemsIndex);
        this.commit("Tools/" + payload.toolName + "/setActive", true);
        // remember which tool we are editing for which chapter
        state.editingTool = {toolName: payload.toolName, templateItemsIndex: payload.templateItemsIndex};
        // close report templates window
        // state.active = false;
    },
    closeToolsInTemplateMode (state) {
        // close all tools and stop their editing mode
        for (const i in state.supportedTools) {
            this.commit("Tools/" + state.supportedTools[i].value + "/setReportTemplateMode", false);
            this.commit("Tools/" + state.supportedTools[i].value + "/setActive", false);
        }
        // remember that we are not editing any tool for any chapter right now
        // return to reporttemplates window
        // state.active = true;
    },
    abortEditingToolSettings (state) {
        // stop editing mode
        this.commit("Tools/ReportTemplates/closeToolsInTemplateMode");
        // let reportTemplates know that editing is over but edits are not accepted
        state.editingTool = {toolName: null, templateItemsIndex: null, accepted: false}; // watcher on editingTool handles rest
    },
    finishEditingToolSettings (state) {
        // stop editing mode
        this.commit("Tools/ReportTemplates/closeToolsInTemplateMode");
        // let reportTemplates know that editing is over and edits are accepted
        state.editingTool = {toolName: null, templateItemsIndex: null, accepted: true}; // watcher on editingTool handles rest
    }
};

export default mutations;
