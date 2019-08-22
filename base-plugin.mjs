import AppCsl from './utils/app-csl.mjs';

export default class BasePlugin {
	static csl = new AppCsl('plugin');

	/**
	 * Get the plugin definition.
	 * @returns {PluginDef} The plugin definition.
	 */
	static get definition() {
		return {
			name: 'unnamed',
			version: '1.0.0',
			description: 'No description available.',
			config: [],
			configurator: []
		};
	}

	/**
	 * Register the routes with
	 * @param {SimpleWeb} ws
	 */
	static registerBackRoutes(ws) { }
}