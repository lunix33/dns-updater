import HttpRequest from '../../utils/http-request.mjs';
import IpPlugin from '../../ip-plugin.mjs';

import AppCsl from '../../utils/app-csl.mjs';

export default class MyExternalIp extends IpPlugin {
	static csl = new AppCsl('myexternalip');

	static get definition() {
		return Object.assign(super.definition, {
			name: 'MyExternalIp',
			version: '1.0.0',
			description: `This plugin uses the <a href="https://www.myexternalip.com/" target="_blank">MyExternalIp</a> web API to get the computer's public IP.
This plugin support both IPv4 and IPv6 without any configuration.`,
			configurator: [{
				name: 'more',
				page: '/root/ip-plugin/myexternalip/about.html'
			}],
			v4: true,
			v6: true
		});
	}

	static url = 'https://www.myexternalip.com/json';

	static async ip() {
		const rtn = { 4: null, 6: null };

		// Fetch IPv4
		MyExternalIp.csl.verb(`Getting IPv4...`);
		try {
			const v4Request = new HttpRequest(HttpRequest.verbs.GET, MyExternalIp.url);
			v4Request.version = 4;
			await v4Request.execute();
			rtn['4'] = v4Request.json.ip;
			MyExternalIp.csl.verb(`Got: ${rtn['4']}`);
		} catch(err) { MyExternalIp.csl.warn('Unable to get IPv4. (You might just not have one...)'); }

		// Fetch IPv6
		MyExternalIp.csl.verb(`Getting IPv6...`);
		try {
			const v6Request = new HttpRequest(HttpRequest.verbs.GET, MyExternalIp.url);
			v6Request.version = 6;
			await v6Request.execute();
			rtn['6'] = v6Request.json.ip;
			MyExternalIp.csl.verb(`Got: ${rtn['6']}`);
		} catch(err) { MyExternalIp.csl.warn('Unable to get IPv6. (You might just not have one...)'); }

		MyExternalIp._validateIp(rtn);

		return rtn;
	}
}