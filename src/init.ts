import * as layer from "./layer";
import * as pgExport from "./export.js";
import * as menu from "./menu";
import * as tools from "./tools";
import * as input from "./input";
import * as undo from "./undo";
import * as launchQueue from "./filesio/launchQueue";
import * as i18n from "./i18n";
import * as pgDocument from "./document";

import paper from "paper";
import {setup as configSetup, get} from "./filesio/configManagement";
import { setupCustomRenderer } from "./render";
import { initColors } from "./objectDefs.js";
import colorDefs from "./res/color-defs.json";
import { maybeShowGetStartedDialog } from "./getStarted";
import { updateSaveHandler } from "./filesio/saveManagement/saveManagement.js";

export function init() {
	paper.setup('paperCanvas');

	configSetup();
	layer.setup();
	pgExport.setup();
	menu.setup();
	tools.setup();
	input.setup();
	undo.snapshot("init");
	launchQueue.setup();
	i18n.setup();
	pgDocument.setup();
	setupCustomRenderer();
	initColors(colorDefs);
	updateSaveHandler(get("saveHandler"));

	maybeShowGetStartedDialog();
}

