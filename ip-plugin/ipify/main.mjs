import HttpRequest from '../../utils/http-request.mjs';
import IpPlugin from '../../ip-plugin.mjs';

import AppCsl from '../../utils/app-csl.mjs';

export default class Ipify extends IpPlugin {
	static csl = new AppCsl('ipify');

	static get definition() {
		return Object.assign(super.definition, {
			name: 'IPify',
			version: '1.0.0',
			description: `This plugin uses the <a href="https://www.ipify.org/" target="_blank">IPify</a> web API to get the computer's public IP.
This plugin support both IPv4 and IPv6 without any configuration.`,
			configurator: [{
				name: "more",
				page: "/root/ip-plugin/ipify/about.html",
				position: 'front'
			}],
			v4: true,
			v6: true
		});
	}

	static v4address = 'https://api.ipify.org?format=json';
	static v6address = 'https://api6.ipify.org?format=json';

	static async ip() {
		const rtn = { 4: null, 6: null };

		// Fetch IPv4
		Ipify.csl.verb(`Getting IPv4...`);
		const v4Request = new HttpRequest(HttpRequest.verbs.GET, Ipify.v4address);
		await v4Request.execute();
		rtn['4'] = v4Request.json.ip;

		// Fetch IPv6
		Ipify.csl.verb(`Getting IPv6...`);
		const v6Request = new HttpRequest(HttpRequest.verbs.GET, Ipify.v6address);
		await v6Request.execute();
		rtn['6'] = v6Request.json.ip;

		Ipify._validateIp(rtn);

		return rtn;
	}
}