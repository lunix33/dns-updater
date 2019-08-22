import BasicControl from './basic-control.mjs';
import { pluginDefinitions } from '../main.js';

export default class DnsTable extends BasicControl {
	$entries;

	$tools;

	$toggle;

	_init() {
		// Validation
		this.$entries = (this.$entries instanceof Array) ? this.$entries : [];
		this.$tools = (this.$tools instanceof Array) ? this.$tools : [];
		this.$toggle = (this.$toggle instanceof Function) ? this.$toggle : null;
	}

	_html() {
		// Reset before generation.
		const fc = this._hook.firstChild;
		if (fc)
			this._hook.removeChild(fc);

		// Create doc fragment.
		const doc = document.createDocumentFragment();

		// Base table.
		const table = document.createElement('table');
		table.classList.add('table', 'table-striped');

		//#region ** Header **
		// Compose header.
		const thead = document.createElement('thead');
		const theadtr = document.createElement('tr');
		const theadenable = document.createElement('th');
		theadenable.innerText = 'Enable';
		const theadprovider = document.createElement('th');
		theadprovider.innerText = 'Provider';
		const theadrecord = document.createElement('th');
		theadrecord.innerText = 'Record';
		const theadtype = document.createElement('th');
		theadtype.innerText = 'Type';
		const theadttl = document.createElement('th');
		theadttl.innerText = 'TTL';

		let theadtool;
		if (this.$tools && this.$tools.top) {
			theadtool = document.createElement('th');
			for (let t of this.$tools.top) {
				const tooli = document.createElement('i');
				tooli.classList.add('fas', `fa-${t.icon}`);
				if (t.tooltip) {
					tooli.title = t.tooltip;
					$(tooli).tooltip();
				}
				tooli.addEventListener('click', t.fn.bind(t, tooli));
				theadtool.appendChild(tooli);
			}
		}

		// Add head to table.
		theadtr.appendChild(theadenable);
		theadtr.appendChild(theadprovider);
		theadtr.appendChild(theadrecord);
		theadtr.appendChild(theadtype);
		theadtr.appendChild(theadttl);
		if (theadtool)
			theadtr.appendChild(theadtool);
		thead.appendChild(theadtr);
		table.appendChild(thead);
		//#endregion

		//#region ** Body **
		const tbody = document.createElement('tbody');

		// No entries
		if (this.$entries.length === 0) {
			const tbodytr = document.createElement('tr');
			const td = document.createElement('td');
			td.classList.add('text-center');
			td.colSpan = 6;
			td.innerText = 'No entries';
			tbodytr.appendChild(td);
			tbody.appendChild(tbodytr);
		}

		// Entries present.
		else {
			for(let e of this.$entries) {
				// Compose entry.
				const tbodytr = document.createElement('tr');
				if (!e.enable)
					tbodytr.classList.add('disabled');
				const tdenable = document.createElement('td');
				let enable;
				if (this.$toggle instanceof Function) {
					enable = document.createElement('input');
					enable.type = 'checkbox';
					enable.checked = e.enable;
					enable.addEventListener('click', this._onEntryToggle.bind(this, e));
				} else {
					enable = document.createElement('i');
					enable.classList.add('fas', (e.enable) ? 'fa-check-square' : 'fa-square');
				}
				const tdprovider = document.createElement('td');
				tdprovider.innerText = pluginDefinitions.find(x=>x.sysname === e.provider).name;
				const tdrecord = document.createElement('td');
				tdrecord.innerText = e.record;
				const tdtype = document.createElement('td');
				tdtype.innerText = `IPv${e.type}`;
				const tdttl = document.createElement('td');
				tdttl.innerText = `${e.ttl} s`;

				let tdtool;
				if (this.$tools.length > 0) {
					tdtool = document.createElement('td');
					for (let t of this.$tools) {
						const tooli = document.createElement('i');
						tooli.classList.add('fas', `fa-${t.icon}`);
						if (t.tooltip) {
							tooli.title = t.tooltip;
							$(tooli).tooltip();
						}
						tooli.addEventListener('click', t.fn.bind(t, e, tooli));
						tdtool.appendChild(tooli);
					}
				}

				// Add row to table body.
				tdenable.appendChild(enable);
				tbodytr.appendChild(tdenable);
				tbodytr.appendChild(tdprovider);
				tbodytr.appendChild(tdrecord);
				tbodytr.appendChild(tdtype);
				tbodytr.appendChild(tdttl);
				if (tdtool)
					tbodytr.appendChild(tdtool);
				tbody.appendChild(tbodytr);
			}
		}

		// Add body to table.
		table.appendChild(tbody);
		//#endregion

		// Insert table in document.
		doc.appendChild(table);
		this._hook.appendChild(doc);
	}

	async _onEntryToggle(entry, event) {
		entry.enable = !entry.enable;

		const result = await this.$toggle(entry);

		if (result) {
			const tr = event.target.parentNode.parentNode;
			tr.classList.toggle('disabled', !entry.enable)
		} else {
			entry.enable = !entry.enable;
			event.target.checked = entry.enable;
		}
	}
}
