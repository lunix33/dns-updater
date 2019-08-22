import dns from 'dns';
import util from 'util';

import AppCsl from '../../utils/app-csl.mjs';
import IpPlugin from '../../ip-plugin.mjs';

export default class Opendns extends IpPlugin{
	static csl = new AppCsl('OpenDNS');

	static get definition() {
		return Object.assign(super.definition, {
			name: 'OpenDNS',
			version: '1.0.0',
			description: `This plugin uses the <a href="https://www.opendns.com/" target="_blank">OpenDNS</a> DNS servers to get the computer's public IP.
This plugin support both IPv4 and IPv6 without any configuration.`,
			configurator: [{
				name: "more",
				page: "/root/ip-plugin/opendns/about.html",
				position: 'front'
			}],
			v4: true,
			v6: true
		});
	}

	static address = 'myip.opendns.com';
	static v4resolvers = [
		'208.67.222.222', // resolver1.opendns.com
		'208.67.220.220', // resolver2.opendns.com
		'208.67.222.220', // resolver3.opendns.com
		'208.67.220.222'  // resolver4.opendns.com
	];
	static v6resolvers = [
		'2620:119:35::35', // resolver1.opendns.com
		'2620:119:53::53'  // resolver2.opendns.com
	];

	static async ip() {
		const rtn = { 4: null, 6: null };
		const resolver = new dns.Resolver();
		const resolve = util.promisify(resolver.resolve.bind(resolver));

		// Get IPv4
		Opendns.csl.verb('Getting IPv4...');
		try {
			resolver.setServers(Opendns.v4resolvers);
			let resRsp = await resolve(Opendns.address, 'A');
			rtn['4'] = resRsp[0] || null;
		} catch(err) { Opendns.csl.warn('Unable to get IPv4. (You might just not have one...)'); }

		// get IPv6
		Opendns.csl.verb('Getting IPv6...');
		try {
			resolver.setServers(Opendns.v6resolvers);
			let resRsp = await resolve(Opendns.address, 'AAAA');
			rtn['6'] = resRsp[0];
		} catch (err) { Opendns.csl.warn('Unable to get IPv6. (You might just not have one...)'); }

		// Validate.
		Opendns._validateIp(rtn);

		return rtn;
	}
}