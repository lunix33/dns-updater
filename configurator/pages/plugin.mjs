import CfgField from '../controls/cfg-field.mjs';
import { config, pluginDefinitions } from '../main.js';
import DisplayManager from '../display-manager.mjs';

export default async function PluginPage(viewData) {
	const sysname = this.match[1];
	const plugin = pluginDefinitions.find(x => x.sysname === sysname);

	viewData.plugin = plugin;

	return html(plugin);
}

/**
 * Generate the page HTML.
 * @param plugin The plugin definition.
 * @returns {Promise<void>} Resolve when the page is fully generated.
 */
async function html(plugin) {
	// Set title
	const title = document.querySelector('#pluginTitle');
	const titleDoc = document.createDocumentFragment();
	const titleSpan = document.createElement('span');
	titleSpan.innerText = plugin.name;
	const titleSmall = document.createElement('small');
	titleSmall.classList.add('text-muted');
	titleSmall.innerText = `(${plugin.version})`;
	titleDoc.appendChild(titleSpan);
	titleDoc.appendChild(titleSmall);
	title.appendChild(titleDoc);

	// Generate info
	const infoEle = document.querySelector('#description');
	infoEle.innerHTML = plugin.description;

	// IP Plugin resolve info.
	if (plugin.type === 'ip') {
		const resolveContainer = document.querySelector('#ipsupport');
		const ipv4InfoDiv = document.createElement('div');
		ipv4InfoDiv.classList.add('col');
		ipv4InfoDiv.innerText = `IPv4 support: ${plugin.v4}`;
		const ipv6InfoDiv = document.createElement('div');
		ipv6InfoDiv.classList.add('col');
		ipv6InfoDiv.innerText = `IPv6 support: ${plugin.v6}`;
		resolveContainer.appendChild(ipv4InfoDiv);
		resolveContainer.appendChild(ipv6InfoDiv);
	}

	// Generate form
	const pluginCfgForm = document.querySelector('#plugincfg');
	if (plugin.config.length > 0) {
		// Create title
		const cfgTitle = document.createElement('h3');
		cfgTitle.innerText = 'Plugin configuration';
		pluginCfgForm.appendChild(cfgTitle);

		// Create fields
		const cfg = config.plugins[plugin.sysname] || {};
		for (let c of plugin.config) {
			const field = CfgField.generateTag(c, cfg[c.name]);
			pluginCfgForm.appendChild(field);
		}

		// Submit button
		const submitbtn = document.createElement('button');
		submitbtn.classList.add('btn', 'btn-primary');
		submitbtn.innerText = 'Submit';
		submitbtn.addEventListener('click', onCfgSubmit);
		pluginCfgForm.appendChild(submitbtn);
	}

	// More
	const moreContainer = document.querySelector('#more');
	return DisplayManager.renderNamed(`${plugin.sysname}.more`, moreContainer);
}

/**
 * Action executed when the submit button of the form is clicked.
 * @param {Event} event The triggered event.
 */
function onCfgSubmit(event) {
	event.preventDefault();
	const formEles = event.target.form.elements;
	const data = {};
	for (let e of formEles) {
		if (e.nodeName === 'BUTTON')
			continue;
		data[e.name] = (e.nodeName === 'checkbox') ? e.checked : e.value;
	}

	// TODO: On form submit.
}