import DnsProvider from '../../dns-provider.mjs';
import AppCsl from '../../utils/app-csl.mjs'
import HttpRequest from '../../utils/http-request.mjs';
import getConfiguration from '../../utils/configuration.mjs';

//#region **** Errors ****
class GoDaddyConfigNotSet extends Error {
	constructor() {
		super('The GoDaddy configuration is not set.');
	}
}

class GoDaddyInvalidSchema extends Error {
	constructor(req) {
		const body = req.json;
		let message = `${body.code}: ${body.message}\n`;
		for (let f of body.fields) {
			message += `- ${f.path}: ${f.code}: ${f.message}\n`;
		}

		super(message);
	}
}
//#endregion

export default class GoDaddy extends DnsProvider {
	static csl = new AppCsl('godaddy');

	/**
	 * The root of the production API URL
	 * @type {string}
	 * @private
	 */
	static _rootURL = 'https://api.godaddy.com';

	/**
	 * The method to be used when adding/updating a record with the API.
	 * @type {string}
	 * @private
	 */
	static _recordMethod = HttpRequest.verbs.PUT;

	static get definition() {
		return Object.assign(super.definition, {
			name: 'GoDaddy',
			version: '1.0.0',
			description: `This plugin uses the <a href="https://godaddy.com" target="_blank">GoDaddy</a>'s Web API to update DNS records hosted in GoDaddy's zones.`,
			config: [{
				print: 'API Key',
				name: 'api-key',
				type: 'text',
				required: true
			}, {
				print: 'API Secret',
				name: 'api-sec',
				type: 'text',
				required: true
			}],
			configurator: [{
				name: "more",
				page: "/root/dns-provider/godaddy/about.html"
			}]
		});
	}

	static async update(record, ip) {
		const match = GoDaddy._matchRecord(record);
		const sub = (match[1] != null) ? match[1] : '@';
		const dom = match[2];
		const type = GoDaddy._getRecordType(record);
		const url = `${GoDaddy._rootURL}/v1/domains/${dom}/records/${type}/${sub}`;
		const payload = [{
			data: ip[record.type],
			ttl: record.ttl
		}];

		const config = getConfiguration();
		const cfg = config.plugin('godaddy');

		if (!(cfg && cfg['api-key'] && cfg['api-sec']))
			throw new GoDaddyConfigNotSet();

		const req = new HttpRequest(GoDaddy._recordMethod, url);
		req.json = payload;
		req.headers = {
			'Authorization': `sso-key ${cfg['api-key']}:${cfg['api-sec']}`,
			'Content-Type': 'application/json'
		};

		try {
			await req.execute();
		} catch(err) {
			const respBody = req.json;
			if (req.response.statusCode == 422)
				throw new GoDaddyInvalidSchema(req);
			else
				throw new Error(`Failed to update with error:
${req.json}`);
		}
	}
}