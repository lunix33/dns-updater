import debug from 'debug';

export default class AppCsl {
	/**
	 * The base namespace of the application.
	 * @type {string}
	 */
	static base = 'dnsup';

	constructor(ns) {
		const space = `${AppCsl.base}${(ns) ? `:${ns}` : ''}`;

		/**
		 * @type {debug.Debugger}
		 */
		this.info = debug(`${space}:info`);

		/**
		 * @type {debug.Debugger}
		 */
		this.warn = debug(`${space}:warn`);

		/**
		 * @type {debug.Debugger}
		 */
		this.err = debug(`${space}:err`);

		/**
		 * @type {debug.Debugger}
		 */
		this.verb = debug(`${space}:verb`);
	}
}