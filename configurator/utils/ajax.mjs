class PathError extends Error {
	constructor(path) {
		super(`The path ('${path}') is invalid.`);
		this.path = path;
	}
}

export default class Ajax {
	/**
	 * Get a file.
	 * @param path The path of the file to get.
	 */
	static file(path) {
		return {
			/**
			 * Get a file from the configurator assets folder.
			 * @returns {Promise}
			 */
			async asset() {
				if (/(\w+)\.(\w+)$/.test(path)) {
					const req = new Ajax(Ajax.verbs.GET, path);
					return req.execute();
				} else {
					throw PathError(path);
				}
			},

			/**
			 * Get a file in the project directory.
			 * @returns {Promise}
			 */
			async root() {
				return Ajax.file(`/root${path}`).asset();
			}
		}
	}

	/**
	 * Get the application configuration
	 * @returns {Promise<string>} Resolve with the configuration.
	 */
	static async getConfig() {
		const req = new Ajax(Ajax.verbs.GET, '/config');
		return req.execute();
	}

	/**
	 * Update the plugin configuration.
	 * @param {string} plugin The name of the plugin to update.
	 * @param {Object} data The new plugin configuration.
	 * @return {Promise} Resolve when successful, otherwise reject.
	 */
	static async putConfigPlugin(plugin, data) {
		const payload = {
			plugin,
			config: data
		};
		const req = new Ajax(Ajax.verbs.PUT, `/config/plugin`, payload);
		return req.execute()
	}

	/**
	 * Get the definition of the plugins.
	 * @returns {Promise<string>} resolve with the plugin definition.
	 */
	static async getPluginsDefinitions() {
		const req = new Ajax(Ajax.verbs.GET, '/plugins');
		return req.execute();
	}

	/**
	 * Update the service timout.
	 * @param {number} timeout The new timeout.
	 * @returns {Promise<void>} Resolve with a success message.
	 */
	static async postServiceTimeout(timeout) {
		const payload = { timeout };
		const req = new Ajax(Ajax.verbs.POST, '/config/timeout', payload);
		return req.execute();
	}

	/**
	 * Update the list of IP resolver to use.
	 * @param resolvers The new list of IP resolver.
	 * @returns {Promise}
	 */
	static async postIpResolver(resolvers) {
		const req = new Ajax(Ajax.verbs.POST, '/config/resolvers', resolvers);
		return req.execute();
	}

	/**
	 * Allow operations on DNS record.
	 * @param {DnsEntry} [record] The current record
	 * @returns {Object} Return an object with different dns record operations.
	 */
	static dns(record) {
		return {
			/**
			 * Toggle the 'enable' state of a dns record.
			 * @returns {Promise}
			 */
			async toggle() {
				const req = new Ajax(Ajax.verbs.POST, '/dns/toggle', record);
				return req.execute();
			},

			/**
			 * Update a DNS record.
			 * @param {DnsEntry} updated The new DNS record.
			 * @returns {Promise}
			 */
			async edit(updated) {
				const url = `/dns/${record.provider}/${record.record}/${record.type}`;
				const req = new Ajax(Ajax.verbs.PATCH, url, updated);
				return req.execute();
			},

			/**
			 * Add a record to the list of record.
			 * @param {DnsEntry} newRecord The record to add.
			 * @returns {Promise}
			 */
			async add() {
				const req = new Ajax(Ajax.verbs.PUT, '/dns', record);
				return req.execute();
			},

			/**
			 * Delete the given DNS
			 * @returns {Promise}
			 */
			async delete() {
				const url = `/dns/${record.provider}/${record.record}/${record.type}`;
				const req = new Ajax(Ajax.verbs.DELETE, url);
				return req.execute();
			},

			/**
			 * Execute the given DNS.
			 * If the DNS record is empty, then all the active record will be executed.
			 * @returns {Promise}
			 */
			async execute() {
				const payload = record || {};
				const req = new Ajax(Ajax.verbs.POST, '/dns/run', payload);
				return await req.execute();
			}
		}
	}

	static async loaded() {
		const payload = { path: location.pathname };
		const req = new Ajax(Ajax.verbs.POST, '/loaded', payload);
		return req.execute();
	}

	/**
	 * Constant with the list of HTTP verbs.
	 * @returns {Object}
	 */
	static get verbs() {
		return {
			GET: 'GET',
			POST: 'POST',
			PUT: 'PUT',
			DELETE: 'DELETE',
			PATCH: 'PATCH'
		};
	}

	/** @type {string} */
	method;

	/** @type {string} */
	url;

	/** @type {string} */
	_data;

	/** @type {Object|string} */
	response;

	constructor(method, url, data) {
		this.method = method;
		this.url = url;
		this.data = data;
	}

	get data() {
		 return this._data;
	}

	set data(v) {
		if (typeof v === 'string')
			this._data = v;
		else
			this._data = JSON.stringify(v);
	}

	/**
	 * Execute the request.
	 * @returns {Promise}
	 *      Returns a promise resolving when the request terminate with code 200,
	 *      Reject if the exit code is anything else than 200.
	 *      The response data is always returned.
	 */
	execute() {
		return new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.addEventListener('load', this._onRequestLoaded.bind(this, resolve, reject, request));

			request.open(this.method, this.url);
			request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			request.send(this.data);
		});
	}

	/**
	 * Action executed when the request complete.
	 * @param {Function} resolve The resolve callback function.
	 * @param {Function} reject The reject callback function.
	 * @param {XMLHttpRequest} request The request object.
	 * @private
	 */
	_onRequestLoaded(resolve, reject, request) {
		try {
			if (request.getResponseHeader('Content-Type') === 'application/json')
				this.response = JSON.parse(request.responseText);
			else
				this.response = request.responseText;
		} catch (err) {
			reject(err);
		}

		if (request.status === 200)
			resolve(this.response);
		else
			reject(this.response);
	}
}
