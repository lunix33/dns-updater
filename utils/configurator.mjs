import fs from 'fs';
import path from 'path';

import open from 'open';

import AppCsl from './app-csl.mjs';
import Updater from '../updater.mjs';
import IpResolver from '../utils/ip-resolver.mjs';
import SimpleWeb from "../simple-web.mjs";

export default class Configurator {
	//#region **** Fields ****
	static _csl = new AppCsl('configurator');

	/**
	 * @type {Configuration}
	 * @private
	 */
	_config;

	/**
	 * @type {Updater}
	 * @private
	 */
	_updater;

	/**
	 * @type {string}
	 * @private
	 */
	_assets;

	/**
	 * @type {PluginDef}
	 * @private
	 */
	_pluginsDefs = null;

	/**
	 * @type {SimpleWeb}
	 */
	_webServer;

	port = 3000;

	onPageLoaded = async () => {};
	//#endregion

	/**
	 * Create a new configurator.
	 * @param {Configuration} config The application configuration.
	 */
	constructor(config) {
		this._config = config;
		if (config)
			this._updater = new Updater(config, true);
		this._assets = path.resolve(__root, 'configurator');
	}

	async start() {
		try {
			this._webServer = new SimpleWeb(this.port,
				SimpleWeb.defaultFile(
					path.resolve(this._assets, 'index.html')), true);
			await this._loadPlugins();
			this._registerRoutes();
			Configurator._csl.info(`Navigate to this URL in your web browser: http://localhost:${this.port}`);
		} catch(err) {
			Configurator._csl.err('Unable to start the configurator.');
			Configurator._csl.err(err);
			await this.stop();
		}
	}

	async open(path) {
		await this.start();

		path = (path.charAt(0) !== '/') ? `/${path}` : path;
		await open(`http://localhost:${this.port}${path}`);
	}

	async stop() {
		this._webServer.close();
		this._webServer = null;
	}

	/**
	 * Load the plugins and their routes in the configurator.
	 * @returns {Promise<void>} Resolve once everything is loaded correctly, otherwise reject.
	 * @private
	 */
	async _loadPlugins() {
		const ipPluginsFolder = await fs.promises.readdir(path.resolve(__root, 'ip-plugin'));
		const dnsProviderFolder = await fs.promises.readdir(path.resolve(__root, 'dns-provider'));

		const pluginsDefs = [];
		for (let pn of [...ipPluginsFolder, ...dnsProviderFolder]) {
			let plugin = null;
			let type = null;
			try {
				plugin = (await import(`../ip-plugin/${pn}/main.mjs`)).default;
				type = 'ip';
			}
			catch (err) {
				plugin = (await import(`../dns-provider/${pn}/main.mjs`)).default;
				type = 'dns';
			}

			const def = plugin.definition;
			def.sysname = pn;
			def.plugin = plugin;
			def.type = type;
			def.configurator.forEach(x => {
				x.this = plugin;
				if (x.name)
					x.name = `${pn}.${x.name}`;
			});
			pluginsDefs.push(def);
		}

		this._pluginsDefs = pluginsDefs;
		this._pluginRoutes = pluginsDefs
			.map(x => x.configurator).flat()
			.filter(x => x.position == null);
	}

	//#region **** Request actions ****
	_registerRoutes() {
		// GET: **/*.*
		// Get a file by name.
		// If the file path starts with '/root/', then fetch from the project root.
		// If the path starts with '/root/configurator/', redirect to the correct asset.
		this._webServer.get('*.*$', async (r) => {
			const filePath = r.req.path.pathname;
			if (/^\/root\/configurator/.test(filePath))
				return r.res.redirect(`/${filePath.slice(19)}`);

			const file = (/^\/root\//.test(filePath)) ?
				path.resolve(__root, filePath.slice(6)) :
				path.resolve(this._assets, filePath.slice(1));
			try {
				await r.res.writeFile(file);
			} catch (err) {
				await r.res.notFound();
			}
		});

		// GET: /plugin
		// Get the list of plugin definitions.
		this._webServer.get('/plugins', async (r) => {
			return r.res.writeJson(this._pluginsDefs);
		});

		// GET: /config
		// Get the application configuration.
		this._webServer.get('/config', async (r) => {
			if (this._config)
				return r.res.writeJson(this._config.configuration);
			else
				return r.res.writeJson({});
		});

		// POST: /config/timeout
		// Set a new service timeout.
		// Request data:
		//      { timeout: Number }
		this._webServer.post('/config/timeout', async (r) => {
			const newTimeout = parseInt(r.req.json.timeout, 10);
			const oldTimeout = this._config.configuration.serviceTimeout;

			if (Number.isFinite(newTimeout)) {
				this._config.configuration.serviceTimeout = newTimeout;

				try {
					await this._config.save();
					return r.res.writeJson({status: 'ok'});
				} catch (err) {
					this._config.configuration.serviceTimeout = oldTimeout;
					return r.res.internalError(err);
				}
			}

			// The timeout is not a valid number.
			else {
				return r.res.internalError({
					message: 'Invalid timeout value.'
				});
			}
		});

		// POST: /config/resolvers
		// Set the new list of IP resolvers.
		// Request data:
		//      [ ...string ]
		this._webServer.post('/config/resolvers', async (r) => {
			const newResolverList = r.req.json;
			const oldResolverList = this._config.configuration.ipPlugins;

			this._config.configuration.ipPlugins = newResolverList;

			try {
				await this._config.save();
				return r.res.writeJson({ status: 'ok' });
			} catch (err) {
				this._config.configuration.ipPlugins = oldResolverList;
				return r.res.internalError(err);
			}
		});

		// POST: /dns/run
		// Run the dns configuration specified in the body of the request.
		// If the body of the request is an empty JSON object, all enabled configuration are executed.
		this._webServer.post('/dns/run', async (r) => {
			/** @type {DnsEntry} */
			const body = r.req.json;

			// Run all dns.
			if (body.provider == null) {
				try {
					await this._updater.run();
					return r.res.writeJson({ success: 'ok' });
				} catch (err) {
					return r.res.internalError(err);
				}
			}

			// Run specific dns.
			else {
				try {
					const resolver = new IpResolver(body.type, this._config.configuration.ipPlugins);
					const ip = await resolver.resolve();

					const provider = (await import(`../dns-provider/${body.provider}/main.mjs`)).default;
					await provider.update(body, ip);

					return r.res.writeJson({ success: 'ok' });
				} catch (err) {
					return r.res.internalError(err);
				}
			}
		});

		// POST: /dns/toggle
		// Toggle (active state) a DNS entry.
		this._webServer.post('/dns/toggle', async (r) => {
			/** @type {DnsEntry} */
			const body = r.req.json;

			this._config
				.dns(body.provider, body.record, body.type)
				.toggle();
			await this._config.save();
			return r.res.writeJson({ success: 'ok' });
		});

		// PUT: /dns
		// Add a new DNS record
		// Need to have a valid DNS record in the request body.
		this._webServer.put('/dns', async (r) => {
			this._config
				.dns()
				.push(r.req.json);
			await this._config.save();
			return r.res.writeJson({ success: 'ok' });
		});

		// DELETE: /dns/(provider)/(record)/(type)
		// Remove the specified DNS record.
		this._webServer.delete('/dns/:provider:/:record:/:type:', async (r) => {
			const p = r.req.params;

			// Remove the DNS record.
			this._config
				.dns(p.provider, p.record, parseInt(p.type))
				.delete();

			await this._config.save();
			return r.res.writeJson({ success: 'ok' });
		});

		// PATCH: /dns/(provider)/(record)/(type)
		// Edit an existing DNS record
		this._webServer.patch('/dns/:provider:/:record:/:type:', async (r) => {
			const p = r.req.params;

			// Edit the record.
			this._config
				.dns(p.provider, p.record, parseInt(p.type))
				.record = r.req.json;

			await this._config.save();
			return r.res.writeJson({ success: 'ok' });
		});

		// POST: /loaded
		// Report to the application a page was loaded.
		// Request body: { path: [STRING] }
		// path: The path of the page.
		this._webServer.post('/loaded', async (r) => {
			await this.onPageLoaded(r.req.json.path);
			r.res.writeJson({ success: 'ok' });
		});

		// Register plugins routes
		for(let pdef of this._pluginsDefs)
			pdef.plugin.registerBackRoutes(this._webServer);
	}
	//#endregion
}