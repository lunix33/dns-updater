import DnsProvider from '../../dns-provider.mjs';
import AppCsl from '../../utils/app-csl.mjs'
import HttpRequest from '../../utils/http-request.mjs';

//#region **** Errors ****
//#endregion

export default class GoDaddy extends DnsProvider {
	static csl = new AppCsl('godaddy');

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

	}
}