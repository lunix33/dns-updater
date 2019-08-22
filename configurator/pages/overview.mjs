import { config, pluginDefinitions, displayManager } from '../main.js';
import Ajax from '../utils/ajax.mjs';
import { backgroundTimeout, blinkInput, errorDialog } from '../utils/tools.mjs';

export default async function OverviewPage(viewData) {
	viewData.dns = config.dnsEntries;
	viewData.dnstools = [{
		icon: 'play',
		tooltip: 'Execute',
		fn: onDnsExecute
	}, {
		icon: 'pen',
		tooltip: 'Edit record',
		fn: onDnsEdit
	}, {
		icon: 'trash',
		tooltip: 'Delete record',
		fn: onDnsDelete
	}];
	viewData.dnstools.top = [{
		icon: 'fast-forward',
		tooltip: 'Execute all enabled',
		fn: onDnsExecute.bind(null, {})
	}, {
		icon: 'plus',
		tooltip: 'New record',
		fn: onDnsAdd
	}];
	viewData.dnstoggleaction = onDnsToggle;
	viewData.serviceTimeout = config.serviceTimeout || 300000;

	// Set all the IP plugin
	viewData.ipResolvers = pluginDefinitions
		.filter(x => x.type === 'ip');

	// Get only the active IP plugin and sort them in proper order
	viewData.activeResolver = viewData.ipResolvers
		.filter(x => config.ipPlugins.indexOf(x.sysname) >= 0)
		.sort((e1, e2) => {
			return config.ipPlugins.indexOf(e1.sysname) - config.ipPlugins.indexOf(e2.sysname);
		});

	document.querySelector('#resolver-apply').addEventListener('click', onResolverApply.bind(viewData));

	return () => {
		const serviceTimeoutInput =
			document.querySelector('#serviceTimeout');
		serviceTimeoutInput.addEventListener('input',
			backgroundTimeout.bind(
				this, 3000, serviceTimeoutInput, 'hsla(60, 100%, 50%, 0.5)', null, null,
				onUpdateServiceTimeout.bind(this, serviceTimeoutInput)));
	}
}

/**
 * Action executed when the checkbox in the DNS row is clicked.
 * @param {DnsEntry} dnsEntry The DNS record.
 */
async function onDnsToggle(dnsEntry) {
	try {
		await Ajax.dns(dnsEntry).toggle();

		return true;
	} catch (err) {
		errorDialog(err);
		console.error(err);

		return false;
	}
}

/**
 * Action executed when the run button in the DNS table is clicked.
 * @param {DnsEntry} dnsEntry The DNS record
 * @param {HTMLElement} toolElement The tool element.
 */
async function onDnsExecute(dnsEntry, toolElement) {
	if (!toolElement.running) {
		toolElement.running = true;
		toolElement.classList.add('text-muted');
		let error = null;
		try {
			await Ajax.dns(dnsEntry).execute();
		} catch (err) {
			error = err;
		} finally {
			toolElement.classList.remove('text-muted');
			toolElement.running = null;
		}

		if (error) {
			blinkInput(toolElement, 'danger-blink', 500);

			errorDialog(error);
			console.error(error);
		} else
			blinkInput(toolElement, 'success-blink', 500);
	} else {
		blinkInput(toolElement, 'danger-blink', 100);
	}
}

/**
 * Callback when user change the service timeout.
 * @param input The input field.
 */
async function onUpdateServiceTimeout(input) {
	try {
		const v = input.value;
		await Ajax.postServiceTimeout(v);
		config.serviceTimeout = v;
		blinkInput(input, 'bg-success');
	} catch (err) {
		input.value = config.serviceTimeout;
		blinkInput(input, 'bg-danger');

		errorDialog(err);
		console.error(err);
	}
}

/**
 * When user click the edit button of a DNS entry.
 * @param {DnsEntry} dnsEntry The Dns entry
 * @param {HTMLElement} toolElement The element.
 */
function onDnsEdit(dnsEntry, toolElement) {
	$(toolElement).tooltip('hide');
	displayManager.go(`/dns/${dnsEntry.provider}/${dnsEntry.record}/${dnsEntry.type}`);
}

/**
 * When the user click the add button in the table.
 * @param {HTMLElement} toolElement The tool element.
 */
function onDnsAdd(toolElement) {
	$(toolElement).tooltip('hide');
	displayManager.go('/dns');
}

/**
 * Action executed when the delete button in the dns table is clicked.
 * @param {DnsEntry} dnsEntry The DNS record.
 * @param {HTMLElement} toolElement The tool element.
 */
async function onDnsDelete(dnsEntry, toolElement) {
	try {
		await Ajax.dns(dnsEntry).delete();
		const idx = config.dnsEntries.findIndex(x => Object.is(x, dnsEntry));
		config.dnsEntries.splice(idx, 1);

		$(toolElement).tooltip('hide');
		const tr = toolElement.parentNode.parentNode;
		const tbody = tr.parentNode;
		tbody.removeChild(tr);
	} catch (err) {
		blinkInput(toolElement, 'danger-blink', 500);

		errorDialog(err);
		console.error(err);
	}
}

async function onResolverApply(e) {
	const btn = e.target;

	try {
		const resolvers = this.activeResolver.map(x => x.sysname);
		await Ajax.postIpResolver(resolvers);
		config.ipPlugins = resolvers;
		blinkInput(btn, 'btn-success', 1000);
	} catch (err) {
		this.activeResolver = this.ipResolvers.filter(x => config.ipPlugins.indexOf(x.sysname) >= 0);
		document.querySelector('organizer').control.rerender();
		blinkInput(btn, 'btn-danger', 1000);

		errorDialog(err);
		console.error(err);
	}
}
