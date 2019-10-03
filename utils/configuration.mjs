import fs from 'fs';
import path from 'path';
import url from 'url';
import os from 'os';

import IpResolver from './ip-resolver.mjs';
import AppCsl from './app-csl.mjs';

const csl = new AppCsl('config');

class Configuration {
	constructor() {
		/**
		 * @type {string}
		 * @private
		 */
		this._filePath = path.resolve(__root, 'config.json');

		/** @type {?ConfigObj} */
		this.configuration = null;
	}

	/**
	 * Set a new configuration file path.
	 * @param {string} v The new path of the file.
	 * @note This function doesn't reload the configuration.
	 */
	set filePath(v) {
		if (v.charAt(0) === '~')
			v = v.replace('~', os.homedir());
		this._filePath = path.resolve(v);
	}

	/**
	 * Allow to know which kind of ip should be resolved.
	 * @returns {number} Will return IpResolver.V4 or IpResolver.V6 or IpResolver.V4 + IpResolver.V6
	 */
	get ipType() {
		const v4list = this.configuration.dnsEntries.filter(x => x.type === 4 && x.enable),
			v6list = this.configuration.dnsEntries.filter(x => x.type === 6 && x.enable);
		return (((v4list.length > 0) ? IpResolver.V4 : 0) + ((v6list.length > 0) ? IpResolver.V6 : 0));
	}

	/**
	 * Tries to load the configuration file.
	 * @returns {Promise<void>}
	 *      Return a promise, resolving when the configuration is loaded,
	 *      otherwise reject with the error occurred.
	 */
	async load() {
		csl.info(`Loading config from: ${this._filePath}`);
		try {
			const raw = await fs.promises.readFile(this._filePath, 'utf8');
			this.configuration = JSON.parse(raw);
		} catch (/** @type {Error}*/ err) {
			if (err.code === 'ENOENT') {
				this.configuration = {
					"serviceTimeout": 300000,
					"plugins": {},
					"dnsEntries": [],
					"ipPlugins": []
				}
			} else {
				csl.err(`Unable to load configuration.`);
				throw err;
			}
		}
	}

	/**
	 * Tries to save the configuration to the file.
	 * @returns {Promise<void>}
	 *      Return a promise, resolving when the configuration is saved,
	 *      otherwise, reject with the error occurred.
	 */
	async save() {
		csl.info(`Saving the configuration to: ${this._filePath}`);
		try {
			const data = JSON.stringify(this.configuration, null, '\t');
			await fs.promises.writeFile(this._filePath, data, 'utf8');
		} catch (err) {
			csl.err(`Unable to save configuration.`);
			throw err;
		}
	}

	/**
	 * Return the configuration for a specific plugin.
	 * if a new value is specified, then the new value will be assigned.
	 * @param {string} n Name of the plugin.
	 * @param {Object} [v] The new value for the plugin
	 * @returns {Object} The configuration of the named plugin.
	 */
	plugin(n, v) {
		if (!this.configuration.plugins)
			this.configuration.plugins = {};

		// If not assign, then just return the content of the plugin key.
		if (v == null)
			return this.configuration.plugins[n];

		// Assign the new values, and delete null values.
		if (this.configuration.plugins[n] == null)
			this.configuration.plugins[n] = {};
		Object.assign(this.configuration.plugins[n], v);
		for(let k in this.configuration.plugins[n]) {
			if (this.configuration.plugins[n][k] == null)
				delete this.configuration.plugins[n][k];
		}

		csl.verb(`New value of plugin ${n} is:`);
		csl.verb(this.configuration.plugins[n][k]);
	}

	dns(provider, record, type) {
		const self = this;
		if (provider == null || record == null || type == null) {
			return {
				/**
				 * Return the list of all the records.
				 * @returns {Array<DnsEntry>}
				 */
				get records() {
					return self.configuration.dnsEntries || [];
				},

				/**
				 * Add a record in the list.
				 * Is simply an alias for `config.dns().record.push(v);`
				 * @param {DnsEntry} v The new record to add.
				 */
				push(v) {
					this.records.push(v);
				},

			};
		} else {
			let rec = this.configuration.dnsEntries.find(x =>
				x.provider === provider &&
				x.record === record &&
				x.type === type);

			return {
				/**
				 * Get the DNS record.
				 * @returns {DnsEntry}
				 */
				get record() {
					return rec;
				},

				/**
				 * Update the DNS record.
				 * @param {DnsEntry} v The updated record.
				 */
				set record(v) {
					if (!rec) {
						rec = Object.assign({
							provider, record, type
						}, v);
						self.dns().push(rec);
					} else
						Object.assign(rec, v);
				},

				/**
				 * Set the record as-is.
				 * @param {DnsEntry} v The new value of the DNS record.
				 */
				set asIs(v) {
					// Just push if the record isn't found.
					if (!rec)
						self.dns().push(v);

					else {
						// Clear all properties.
						for (let p in rec) {
							if (rec.hasOwnProperty(p))
								rec[p] = undefined;
						}

						Object.assign(rec, v);
					}
				},

				/**
				 * Toggle the record on and off.
				 */
				toggle() {
					if (rec)
						rec.enable = !rec.enable;
					// Else no-op.
				},

				/**
				 * Delete the specified record.
				 */
				delete() {
					// Filter out the record found.
					if (rec) {
						const idx = self.configuration.dnsEntries.findIndex(x => Object.is(x, rec));
						self.configuration.dnsEntries.splice(idx, 1);
					} // else No-op
				}
			};
		}
	}
}

/** @type {Configuration} */
let config;

/**
 * Class allowing to get the configuration object.
 * @returns {Configuration}
 */
export default function getConfiguration() {
	if (config == null)
		config = new Configuration();
	return config;
}
