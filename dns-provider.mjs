import BasePlugin from './base-plugin.mjs';
import AppCsl from './utils/app-csl.mjs';

class NoDnsUpdate extends Error {
	constructor() { super(`The DNS update(class.update(record)) isn't implemented.`); }
}

export default class DnsProvider extends BasePlugin {
	static csl = new AppCsl('dns_provider');

	/**
	 * Get the dns provider definition.
	 * @returns {DnsProviderDef} The dns provider definition.
	 */
	static get definition() {
		return Object.assign(super.definition, {
			record: []
		});
	}

	/**
	 * Update the specified DNS Entry
	 * @param {DnsEntry} record The record to be updated.
	 * @returns {Promise<void>} Return a promise resolving once the record is updated, otherwise will reject with the error.
	 */
	static async update(record) {
		throw new NoDnsUpdate();
	}

	/**
	 * Match the subdomain and the domain in the record string.
	 * @param {DnsEntry} record The record object.
	 * @return {RegExpExecArray}
	 * @private
	 */
	static _matchRecord(record) {
		return /^(?:([a-zA-Z0-9\-\.]+)\.)?([a-zA-Z0-9\-]+\.[a-zA-Z0-9\-]{2,10})\.?$/.exec(record.record);
	}

	/**
	 * Find the actual DNS record type from the IP type.
	 * @param {DnsEntry} record The record object.
	 * @returns {string|null} The type of DNS record, null if the ip type is not valid.
	 * @private
	 */
	static _getRecordType(record) {
		return (record.type === 4) ? 'A' :
			(record.type === 6) ? 'AAAA' : null;
	}
}