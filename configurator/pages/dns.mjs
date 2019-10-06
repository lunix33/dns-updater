import { pluginDefinitions, config } from "../main.js";
import { emptyNode, initControls, objectRecompose, blinkInput, errorDialog } from '../utils/tools.mjs';
import CfgField from '../controls/cfg-field.mjs';
import Ajax from '../utils/ajax.mjs';

export default async function DnsPage(viewData) {
	const matches = this.url.exec(location.pathname.slice(1));
	viewData.new = (matches[1] == null);
	if (viewData.new) {
		viewData.dns = {
			enable: true
		};
	} else {
		const dns = config.dnsEntries.find(x =>
			x.provider == matches[1] &&
			x.record == matches[2] &&
			x.type == matches[3]);
		viewData.dns = Object.assign({}, dns);
		viewData.curDns = dns;
	}

	// Buildtin fields definition
	viewData.builtInFields = {
		provider: { name: 'provider', print: 'Provider', type: 'string', required: true },
		record: { name: 'record', print: 'Record', type: 'string', required: true },
		ttl: { name: 'ttl', print: 'Time-to-live', type: 'number', required: true, default: 500 },
		type: { name: 'type', print: 'IP type', type: 'number', required: true, default: 4 }
	};

	// Ip type dropdown options.
	viewData.ipTypes = [{
		text: 'IPv4',
		value: 4
	}, {
		text: 'IPv6',
		value: 6
	}];

	// Provider dropdown options.
	viewData.providers = pluginDefinitions.filter(x => x.type === 'dns')
		.map(x => {
			return {
				text: x.name,
				value: x.sysname
			}
		});
	viewData.providers.unshift({
		text: '-- Select a provider --'
	});

	viewData.validateDomain = (dom) => {
		if (/^(?:([a-zA-Z0-9\-\.]+)\.)?([a-zA-Z0-9\-]+\.[a-zA-Z0-9\-]{2,10})\.?$/.test(dom)) {
				return true;
		}
		return false;
	};

	// Set the viewdata for the provider config.
	document.querySelector('#providercfg').data = {
		dns: viewData.dns
	};

	// Render HTML
	html(viewData);
	window.x = viewData;
}

function html(viewData) {
	// Set the page title
	const title = document.querySelector('#title');
	title.innerText = (viewData.new) ?
		`New DNS record` : `Edit DNS record`;

	// Generate the provider config, only if not a new record.
	if (!viewData.new) {
		onProviderChanged.bind(viewData)(null);
	}

	// Add a watch on the provider input.
	document.querySelector('cfg-field[name="provider"]')
		.addEventListener('input', onProviderChanged.bind(viewData));

	// Add the form submit event.
	document.querySelector('#submit')
		.addEventListener('click', onFormSubmit.bind(viewData));
}

function onProviderChanged(event) {
	const provider = this.dns.provider;
	const container = document.querySelector('#providercfg');

	// Clear old data properties.
	if (container.data.cfg) {
		const fields = container.querySelectorAll('cfg-field');
		for (let f of fields) {
			const {obj, prop} = f.control.unbind();
			obj[prop] = undefined;
		}
	}

	if (provider != "null") {
		// Set the provider view data.
		container.data.dataset = config.plugins[provider];

		// Set the new provider config.
		container.data.cfg = pluginDefinitions
			.find(x => x.sysname === provider).record;

		// Generate fields.
		for (let f of container.data.cfg) {
			const tagCfg = {
				print: f.print,
				name: f.name,
				type: f.type,
				_value: `dns.${f.name}`,
				default: f.default,
				bound: '',
				tooltip: f.tooltip
			};
			if (f.required)
				tagCfg.required = '';
			if (tagCfg.type === 'select')
				tagCfg._options = f.options;

			const tag = CfgField.generateTag(tagCfg);
			container.appendChild(tag);
		}
		initControls(container);
	} else {
		container.data.dataset = null;
		container.data.cfg = null;
		emptyNode(container);
	}
}

async function onFormSubmit(event) {
	event.preventDefault();

	const btn = document.querySelector('#submit');
	const dns = objectRecompose(this.dns);

	// Validation
	const pluginContainer = document.querySelector('#providercfg');
	const pluginFields = pluginContainer.data.cfg;
	let valErr = false;
	for (let f of [...Object.values(this.builtInFields), ...pluginFields]) {
		const ctl = document.querySelector(`cfg-field[name=${f.name}]`).control;
		if (!ctl.valid) {
			valErr = true;
			break;
		}
	}

	// Submit data
	if (!valErr) {
		try {
			// Add the new dns record
			if (this.new)
				await Ajax.dns(dns).add();

			// Edit existing record.
			else
				await Ajax.dns(this.curDns).edit(dns);

			location.href = '/';
		} catch (err) {
			blinkInput(btn, 'btn-danger', 1000);

			errorDialog(err);
			console.error(err);
		}
	}
}
