import Ajax from './utils/ajax.mjs';
import DisplayManager from './display-manager.mjs';
import { registerControl, errorDialog } from './utils/tools.mjs';

import DnsTable from './controls/dns-table.mjs';
import CfgField from './controls/cfg-field.mjs';
import Organizer from './controls/organizer.mjs'

/** @type {ConfigObj} */
export let config = {};

/** @type {Array<PluginDef>} */
export let pluginDefinitions = {};

/** @type {DisplayManager} */
export let displayManager = null;

(async function main() {
	// Get plugin list
	try {
		pluginDefinitions = await Ajax.getPluginsDefinitions();
	} catch(err) {
		errorDialog(err);
		console.error(err);
	}

	// Get application config.
	try {
		config = await Ajax.getConfig();
	} catch(err) {
		errorDialog(err);
		console.error(err);
	}

	window.c = config;
	window.pd = pluginDefinitions;

	let params = new URLSearchParams(location.search);
	if (!params.get('hm')) {
		// Generate nav
		generateNav(document.querySelector('#pluginlist'));
	} else {
		// Hide menu
		const menu = document.querySelector('nav').parentNode;
		menu.classList.add('d-none');
	}

	// Set the custom controls
	registerControl(DnsTable);
	registerControl(CfgField);
	registerControl(Organizer);

	// Set the display manager.
	const dmHook = document.querySelector('page');
	displayManager = new DisplayManager(dmHook);
	await displayManager.display();
})();

function generateNav(nav) {
	const list = document.createElement('ul');
	for (let e of pluginDefinitions) {
		const ele = document.createElement('li');

		const a = document.createElement('a');
		a.href = `/plugin/${e.sysname}`;
		a.classList.add('d-block');
		a.innerText = e.name;

		const small = document.createElement('small');
		small.classList.add('text-muted');
		small.innerText = `v${e.version} (${e.type})`;

		ele.appendChild(a);
		ele.appendChild(small);
		list.appendChild(ele);
	}
	nav.appendChild(list);
}
