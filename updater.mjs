import AppCsl from "./utils/app-csl.mjs";
import IpResolver from './utils/ip-resolver.mjs'

export default class Updater {
	static csl = new AppCsl('updater');

	/** @type {Configuration} */
	config;

	/** @type {boolean} */
	single = true;

	/** @type {Ip|null} */
	lastIp = {4: null, 6: null};

	/** @type {number} */
	timer = null;

	/**
	 * Create a new updater.
	 * @param {Configuration} config The application configuration
	 * @param {boolean} single True if the the update process is only run once, otherwise false for a service.
	 */
	constructor(config, single) {
		this.config = config;
		this.timeout = config.configuration.serviceTimeout || 300000 /* 5 mins */;
		this.single = single || false;
	}

	/**
	 * Stop the service.
	 */
	stop() {
		clearTimeout(this.timer);
	}

	/**
	 * Run the updater process.
	 * @returns {Promise<void>}
	 */
	async run() {
		const resolver = new IpResolver(this.config.ipType, this.config.configuration.ipPlugins || []);
		const ip = await resolver.resolve();

		const toUpdate = {
			4: (this.lastIp['4'] !== ip['4']),
			6: (this.lastIp['6'] !== ip['6'])
		};
		this.lastIp = ip;

		for (let e of this.config.dns().records) {
			try {
				if (e.enable && toUpdate[e.type]) {
					const provider = (await import(`./dns-provider/${e.provider}/main.mjs`)).default;
					await provider.update(e, ip);
				}
			} catch(err) {
				Updater.csl.err(`Unable to update DNS`);
				Updater.csl.err(err);
			}
		}

		if (!this.single)
			this.timer = setTimeout(this.run.bind(this), this.timeout);
	}
}