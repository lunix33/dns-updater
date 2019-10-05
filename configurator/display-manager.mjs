import Ajax from './utils/ajax.mjs';
import { routes } from './routes.mjs';
import { pluginDefinitions } from './main.js';

import { initControls } from './utils/tools.mjs';

/**
 * A view manager.
 * Allow to load views and their script.
 * There should not be more than one view manager at a time since it controls the overall navigation.
 * But the static functions are safe to call.
 */
export default class DisplayManager {
	/**
	 * Assemble a list with all the frontend routes.
	 * @returns {Array<ConfiguratorFrontRoute>} The frontend routes of the plugins.
	 * @private
	 */
	static get _routes() {
		return pluginDefinitions
			.map(x => x.configurator).flat();
	}

	/**
	 * Render a route by name.
	 * @param {string} name The fully qualified name of the route.
	 * @param {HTMLElement} hook The element in which the view will be rendered.
	 * @returns {Promise<void>}
	 */
	static async renderNamed(name, hook) {
		const route = DisplayManager._routes.find(x => x.name === name);
		if (route)
			return await DisplayManager.render(route, hook);
	}

	/**
	 * Render a route within a page.
	 * @param {ConfiguratorFrontRoute} route The route to render
	 * @param {HTMLElement} hook The element in which the view is rendered.
	 * @param {Object} data The data to apply to the route.
	 * @returns {Promise<void>}
	 */
	static async render(route, hook, data) {
		// Load the page content if not already loaded.
		if (!route.content)
			route.content = await Ajax.file(route.page).asset();

		// Load the page function if not already loaded.
		if (typeof route.script === 'string' && route.script !== '')
			route.script = (await import(route.script)).default.bind(route); // Import page main function.
		else if (!route.script)
			route.script = async ()=>{}; // No op.

		// Apply and run.
		hook.data = data || {};
		hook.innerHTML = route.content;
		const postRender = await route.script(hook.data);

		// Render the custom controls in the page.
		initControls(hook);

		setTimeout(() => {
			if (postRender)
				postRender();

			// Report page loaded
			Ajax.loaded();
		});
	}

	/** @type {string} */
	_path;

	/** @type {HTMLElement} */
	_hook;

	/** @type {Object} */
	_renderData;

	/**
	 * Create a new display manager.
	 * @param hook Where the content of the page should be rendered.
	 */
	constructor(hook) {
		this._hook = hook;
		hook.manager = this;
		this._path = location.pathname;

		document.addEventListener('click', this._onNavigate.bind(this), true);
		window.addEventListener('popstate', this._onBack.bind(this));
	}

	/**
	 * Get the currently rendered path.
	 * @returns {string} The path.
	 */
	get path() { return this._path; }

	/**
	 * Change the rendered path.
	 * Does not add to the history or change the browser URL.
	 * @param {string} v The new path.
	 */
	set path(v) {
		if (this._path !== v) {
			this._path = v;
			this.display().catch(err => {
				console.error(err);
			});
		}
	}

	/**
	 * Navigate to a new url
	 * Simulate a link click.
	 * @param {string} url The new url.
	 * @param {Object} data The data apply to the next render.
	 */
	go(url, data) {
		if (data)
			this._renderData = data;
		history.pushState(null, null, url);
		this.path = url;
	}

	/**
	 * Render the page in the hook.
	 */
	async display() {
		const pluginRoutes = DisplayManager._routes.filter(x => x.url instanceof RegExp);
		for(let r of [...routes, ...pluginRoutes]) {
			if (r.match = r.url.exec(this._path.slice(1))) {
				await DisplayManager.render(r, this._hook, this._renderData);
				this._renderData = null;
				return;
			}
		}
		this.path = '/404';
	}

	/**
	 * CAllback when a user tries to click any link in the page.
	 * @param {Event} event The fired event.
	 * @private
	 */
	async _onNavigate(event) {
		if (document.activeElement.nodeName === 'A') {
			const a = document.activeElement;

			if (a.host === location.host) {
				event.preventDefault();
				this.go(a.pathname);
			}
		}
	}

	/**
	 * Callback when user navigate back in the history.
	 * @private
	 */
	async _onBack() {
		this.path = location.pathname;
	}
}