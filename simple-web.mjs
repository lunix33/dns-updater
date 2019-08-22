import http from 'http';
import fs from 'fs';
import url from 'url';

import mime from 'mime-types';

import AppCsl from "./utils/app-csl.mjs";

export default class SimpleWeb {
	static _csl = new AppCsl('web');

	/**
	 * Shim Node's request and response objects with with convenient methods.
	 */
	static shim() {
		const sres = http.ServerResponse;
		Object.assign(sres.prototype, {
			/**
			 * Send a error 404 (not found) to the client.
			 * @returns {Promise}
			 */
			async notFound() {
				if (!this.finished) {
					// Write headers and finish
					this.writeHead(404, {
						'Content-Type': 'text/plain'
					});
					this.end('The page was not found.');
					SimpleWeb._csl.verb('404: NOT FOUND > client');
				}
			},

			/**
			 * Send an error 500 (internal error) to the client.
			 * @param {Error} err The error occurred.
			 * @returns {Promise}
			 */
			async internalError(err) {
				if (!this.finished) {
					// Write headers and finish
					this.writeHead(500, {
						'Content-Type': 'application/json'
					});
					this.end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
					SimpleWeb._csl.verb(`500: INTERNAL ERROR > client`);
				}
			},

			/**
			 * Redirect the request to another resource.
			 * @param {string} location The new resource location.
			 * @returns {Promise}
			 */
			async redirect(location) {
				// Write headers and finish.
				this.writeHead(302, {
					'Location': location
				});
				this.end();
				SimpleWeb._csl.verb(`302: ${location} (Redirect) > client`);
			},

			/**
			 * Write the an object as a JSON response.
			 * @param {Object|string} obj The object to send.
			 * @returns {Promise}
			 */
			async writeJson(obj) {
				if (!this.finished) {
					// If obj is not a string, convert the object to JSON.
					if (typeof obj !== 'string')
						obj = JSON.stringify(obj);

					// Write headers and finish
					this.writeHead(200, {
						'Content-Type': 'application/json'
					});
					this.end(obj);
					SimpleWeb._csl.verb(`200: application/json > client`);
				}
			},

			/**
			 * Send the content of a file as the request response.
			 * @param {string} filePath Path to the file.
			 * @returns {Promise}
			 */
			async writeFile(filePath) {
				if (!this.finished) {
					// Read file.
					const file = await fs.promises.readFile(filePath);

					// Write headers and finish
					const mt = mime.contentType(filePath);
					this.writeHead(200, {
						'Content-Type': mt
					});
					this.end(file);
					SimpleWeb._csl.verb(`200: ${filePath} (${mt}) > client`);
				}
			}
		});

		const sreq = http.IncomingMessage;
		Object.defineProperties(sreq.prototype, {
			json: {
				/**
				 * Parse the request body to JSON.
				 * @returns {Object}
				 */
				get: function() {
					return JSON.parse(this.body || '{}');
				}
			},
			xhr: {
				/**
				 * Allow to know if the request is a AJAX request.
				 * To be correctly detected, the request needs to have the 'X-Requested-With' header set to 'XMLHttpRequest'.
				 * @returns {boolean} True if the request is AJAX, otherwise false.
				 */
				get: function() {
					return (this.headers['x-requested-with'] === 'XMLHttpRequest');
				}
			},
			path: {
				/**
				 * The full path definition.
				 * @returns {URL} The path definition
				 */
				get: function() {
					return new url.URL(`http://${this.headers.host}${this.url}`);
				}
			}
		});
		Object.assign(sreq.prototype, {
			/**
			 * Get the body of the request.
			 * @returns {Promise}
			 */
			fetchBody() {
				return new Promise((resolve, reject) => {
					if (this.method === 'POST' || this.method === 'PUT' || this.method === 'PATCH') {
						let data = [];
						this.on('data', (chunk) => {
							data.push(chunk);
						});

						this.on('end', () => {
							this.body = Buffer.concat(data).toString();
							resolve();
						});
					}

					else
						resolve();
				});
			}
		});
	}

	//#region **** Default route ****
	/**
	 * Default route which is always returning the same file.
	 * @param file The file to return.
	 * @param xhrNotFound If true, the XHR requests will give an error 404.
	 * @returns {Function} The default route function.
	 */
	static defaultFile(file, xhrNotFound) {
		return async function DefaultFileDefaultRoute(r) {
			if (r.req.xhr && xhrNotFound)
				return r.res.notFound();
			else
				return r.res.writeFile(file);
		}
	}

	/**
	 * Default route which is always returning a 404 error.
	 * @returns {Function} The default route function.
	 */
	static defaultNotFound() {
		return async function DefaultNotFoundDefaultRoute(r) {
			return r.res.notFound;
		}
	}
	//#endregion

	//#region **** Fields ****
	/**
	 * @type {http.Server}
	 * @private
	 */
	_http = null;

	/**
	 * @type {Array<SimpleWebRoute>}
	 * @private
	 */
	_routes = [];

	/**
	 * @type {Function}
	 * @private
	 */
	_defaultRoute;
	//#endregion

	constructor(port, defaultRoute) {
		this._http = http.createServer(this._onRequest.bind(this));
		this._http.listen(port);
		this._defaultRoute = defaultRoute;
	}

	close() {
		this._http.close();
	}

	/**
	 * Action executed when a request comes in the server.
	 * @param req The request object.
	 * @param res The response object.
	 * @returns {Promise<void>} --
	 * @private
	 */
	async _onRequest(req, res) {
		SimpleWeb._csl.verb(`client > ${req.method}: ${req.url}`);

		await req.fetchBody();

		// Find if a function is available for the specified path.
		for (let r of this._routes) {
			const match = r.url.exec(req.path.pathname);
			if ((r.method === '*' || r.method === req.method) && match != null) {
				// Assigne route parameters.
				req.params = {};
				for (let i = 0; i < r.params.length; i++)
					req.params[r.params[i]] = match[i+1];

				// Try to run the route associated function.
				try {
					//const fn = r.fn.bind(r.this || r, req, res, match);
					await r.fn({req, res});
					return;
				}
				catch (err) { await res.internalError(err); }
			}
		}

		try {
			await this._defaultRoute({req, res});
		} catch (err) {
			await res.internalError(err);
		}
	}

	//#region **** Routes ****
	/**
	 * Makes the route matcher and parameter list.
	 * @param {string} route The route to transform.
	 * @returns {{matcher: RegExp, params: Array<string>}}
	 * @private
	 */
	static _buildRouteMatcher(route) {
		// Find the name of all params.
		const paramRegex = /:(\w+):/g;
		const params = [];
		let p;
		while((p = paramRegex.exec(route)) != null)
			params.push(p[1]);

		// Make regex url matcher
		let regexStr = route
		// Replace parameters by '([\w.-]+)'
			.replace(paramRegex, '([\\w.-]+)')
			// Escape the slashes.
			.replace(/\//g, '\\/')
			// Escape the does.
			.replace(/\./g, '\\.')
			// Replace '*' by '\w+'
			.replace(/\*/g, '\\w+');

		// -- If the url matcher starts by '^' or '$' skip,
		// -- Otherwise add '^' at the beg. and '$' at the end.
		if (!(regexStr.charAt(0) === '^' ||
				regexStr.charAt(regexStr.length - 1) === '$'))
			regexStr = `^${regexStr}$`;

		const matcher = new RegExp(regexStr);

		return { matcher, params }
	}

	/**
	 * Register a new route.
	 * @param {string} method The method of the route.
	 * @param {string} route The route.
	 * @param {Function} callback The callback function.
	 */
	registerRoute(method, route, callback) {
		const { matcher, params } = SimpleWeb._buildRouteMatcher(route);
		this._routes.push({
			url: matcher,
			method,
			fn: callback,
			params
		});
	}

	/**
	 * Register a GET route.
	 * @param {string} route The route.
	 * @param {Function} callback The callback function.
	 */
	get(route, callback) {
		this.registerRoute('GET', route, callback);
	}

	/**
	 * Register a POST route.
	 * @param {string} route The route.
	 * @param {Function} callback The callback function.
	 */
	post(route, callback) {
		this.registerRoute('POST', route, callback);
	}

	/**
	 * Register a DELETE route.
	 * @param {string} route The route.
	 * @param {Function} callback The callback function.
	 */
	delete(route, callback) {
		this.registerRoute('DELETE', route, callback);
	}

	/**
	 * Register a PUT route.
	 * @param {string} route The route.
	 * @param {Function} callback The callback function.
	 */
	put(route, callback) {
		this.registerRoute('PUT', route, callback);
	}

	/**
	 * Register a PATCH route.
	 * @param {string} route The route.
	 * @param {Function} callback The callback function.
	 */
	patch(route, callback) {
		this.registerRoute('PATCH', route, callback);
	}
	//#endregion
}