import IpPlugin from '../ip-plugin.mjs';
import AppCsl from './app-csl.mjs';

const csl = new AppCsl('resolver');

export default class IpResolver {

	/**
	 * Indicate a IPv4 address.
	 * @type {number}
	 */
	static V4 = 4;

	/**
	 * Indicate a IPv6 address.
	 * @type {number}
	 */
	static V6 = 6;

	/**
	 * Create a new Ip resolver
	 * @param {number} resolve_type
	 *      The type of IP which should be fetched.
	 *      Use IpResolver.V4 or IpResolver.V6 or IpResolver.V4 + IpResolver.V6
	 * @param {Array<string>} resolve_plugins The list of ip plugins which should be used to fet the ips.
	 */
	constructor(resolve_type, resolve_plugins) {
		/** @type {number} */
		this.resolve_type = resolve_type;

		/** @type {Array<string>} */
		this.resolve_plugins = resolve_plugins;
	}

	/**
	 * Get the IP address.
	 * @returns {Ip}
	 */
	async resolve() {
		/** @type {Ip} */
		let rtnIp = {4: null, 6: null};
		for (let p of this.resolve_plugins) {
			try {
				/** @type {Ip} */
				let pIp = {4: null, 6: null};
				/** @type {IpPlugin} */
				const plugin = (await import(`../ip-plugin/${p}/main.mjs`)).default;
				/** @type {PluginDef} */
				const pdef = plugin.definition;

				try {
					// Get the ip from the plugin if it is compatible and we don't already have the ip.
					if ((this.resolve_type === IpResolver.V4 && pdef.v4 && !rtnIp['4']) ||
						(this.resolve_type === IpResolver.V6 && pdef.v6 && !rtnIp['6']) ||
						(this.resolve_type === (IpResolver.V4 + IpResolver.V6) &&
							((pdef.v4 && !rtnIp['4']) || (pdef.v6 && !rtnIp['6'])))) {
						csl.info(`Getting IP with ${p}...`);
						pIp = await plugin.ip();
					}
				} catch(err) {
					csl.warn(`Unable to resolve ip using plugin: ${p}.`);
					csl.err(err);
				}

				// Assign the plugin ip to the return object.
				rtnIp['4'] = (pIp['4']) ? pIp['4'] : rtnIp['4'];
				rtnIp['6'] = (pIp['6']) ? pIp['6'] : rtnIp['6'];
			} catch (err) {
				csl.warn(`Unable to load plugin: ${p}.`);
				csl.err(err);
			}

			// Stop trying to resolve if done.
			if ((this.resolve_type === IpResolver.V4 && rtnIp['4']) ||
				(this.resolve_type === IpResolver.V6 && rtnIp['6']) ||
				(this.resolve_type === IpResolver.V4 + IpResolver.V6 && rtnIp['4'] && rtnIp['6']))
				break;
		}

		// Log if the resolver wasn't able to find one of the required ips.
		if ((this.resolve_type === IpResolver.V4 ||
			this.resolve_type === IpResolver.V4 + IpResolver.V6) &&
			!rtnIp['4'])
			csl.warn('The resolver was unable to resolve the public IPv4.');
		if ((this.resolve_type === IpResolver.V6 ||
			this.resolve_type === IpResolver.V4 + IpResolver.V6) &&
			!rtnIp['6'])
			csl.warn('The resolver was unable to resolve the public IPv6.');

		return rtnIp;
	}
}