/**
 * The built-in configurator routes.
 * @type {ConfiguratorFrontRoute}
 */
export let routes = [
	{
		// Not found page.
		// /404
		url: /^404$/,
		page: '/pages/404.html'
	}, {
		url: /^help$/,
		page: '/pages/help.html'
	}, {
		// Home page.
		// /
		url: /^$/,
		script: '/pages/overview.mjs',
		page: '/pages/overview.html'
	}, {
		// Plugin page.
		// /plugin/<Plugin sysname>
		url: /^plugin\/([\w-]+)$/,
		script: '/pages/plugin.mjs',
		page: '/pages/plugin.html'
	}, {
		// Create new DNS record page.
		// /dns

		// Edit DNS record page.
		// /dns/<Provider>/<Record>/<IP Type>
		url: /^dns(?:\/(\w+)\/([a-zA-Z0-9.-]+\.\w+)\/(\d))?$/,
		script: '/pages/dns.mjs',
		page: '/pages/dns.html'
	}
];
