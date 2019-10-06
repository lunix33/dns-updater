import url from 'url';

import AppCsl from './app-csl.mjs';

const csl = new AppCsl('http');

//#region **** Errors ****
/**
 * Error occurring when the request encounter an error.
 */
class ReqError extends Error {
	constructor(err) {
		super(`Unable to complete the request.`);
		this.inner = err;
	}
}

/**
 * Error occurring when an unsupported protocol is given as an URL for the request.
 */
class UnsupportedProtocol extends Error {
	constructor() { super(`The protocol is not supported`); }
}

/**
 * Error occurring when an unsupported method is given to the request.
 */
class UnsupportedMethod extends Error {
	constructor() { super(`The method is not supported`); }
}

/**
 * Error occurring when the auth property is incorrectly set.
 */
class InvalidAuth extends Error {
	constructor(v) {
		super('The auth property must be a valid string ([user]:[password]) or an object with the corresponding properties.');
		this.auth = v;
	}
}

/**
 * Error occurring when the url property is incorrectly set.
 */
class InvalidURL extends Error {
	constructor(v) {
		super('The URL of the request is not valid.');
		this.url = v;
	}
}

class InvalidRequest extends Error {
	constructor() { super('The request is not valid. Be sure to have a proper url and request verb.'); }
}
//#endregion

export default class HttpRequest {
	//#region **** Static Fields ****
	/**
	 * An object with all the throwable errors by HttpRequeset.
	 */
	static err = {
		UnsupportedMethod,
		UnsupportedProtocol,
		ReqError,
		InvalidAuth,
		InvalidURL,
		InvalidRequest
	};

	/**
	 * Enum with the supported request verbs.
	 * @returns {Object<string,string>}
	 */
	static get verbs() {
		return {
			GET: 'GET',
			POST: 'POST',
			PUT: 'PUT',
			DELETE: 'DELETE',
			PATCH: 'PATCH'
		}
	}
	//#endregion

	//#region **** Fields ****
	/**
	 * @type {url.URL}
	 * @private
	 */
	_url;

	/**
	 * @type {string}
	 * @private
	 */
	_method = HttpRequest.verbs.GET;

	/** @type {string|null} */
	raw = null;

	/** @type {string|null} */
	data = null;

	/** @type {Object} */
	headers = {};

	/** @type {RequestResponse} */
	response = {
		body: null,
		headers: {},
		statusCode: 0
	};

	/**
	 * @type {string|null}
	 * @private
	 */
	_auth = null;

	/**
	 * @type {number|null}
	 * @private
	 */
	_version = null;
	//#endregion

	/**
	 * Create a new HTTP request.
	 * @param {string} method The HTTP method.
	 * @param {url.URL|string} uri The uri on which the HTTP request must be done.
	 */
	constructor(method, uri) {
		this.url = uri;
		this.method = method;
	}

	/**
	 * Execute HTTP request.
	 * @returns {Promise<boolean>}
	 */
	execute() {
		return new Promise((resolve, reject) => {
			// Make sure we have a valid URL and method.
			if (!(this._url instanceof url.URL) || typeof this._method !== 'string')
				this._onRequestError(reject, new InvalidRequest());

			this.response.body = '';
			const protocol = this._url.protocol.slice(0, -1);
			import(protocol).then((handler) => {
				csl.verb(`${this.method}: ${this.url.toString()}`);

				// Build request options.
				let options = { method: this._method };
				if (this._version)
					options.family = this._version;
				if (Object.keys(this.headers).length > 0)
					options.headers = this.headers;
				if (this._auth)
					options.auth = this._auth;

				// Make the HTTP Request object.
				const req = handler.request(
					this._url, options, this._RequestHandler.bind(this, resolve, reject));

				// Error on request.
				req.on('error', this._onRequestError.bind(this, reject));

				// Send data to server if any.
				if (this.data)
					req.write(this.data);

				req.end();
			}).catch((err) => {
				csl.err(err);
			});
		});
	}

	//#region **** Getters / Setters ****
	/**
	 * Get the request URL.
	 * @returns {url.URL} The request URL.
	 */
	get url() { return this._url; }

	/**
	 * Set the request URL.
	 * @param {url.URL|string} v The new request URL.
	 */
	set url(v) {
		if (typeof v === 'string')
			this._url = new url.URL(v);
		else if (v instanceof url.URL)
			this._url = v;
		else
			throw new InvalidURL(v);

		// Validate if URL protocol is HTTP(s).
		if (this.url.protocol !== 'http:' &&
			this.url.protocol !== 'https:') {
			this._url = null;
			throw new UnsupportedProtocol();
		}
	}

	/**
	 * Get the current IP version used for the request.
	 * @returns {number|null} The IP version used, or null if automatic.
	 */
	get version() { return this._version; }

	/**
	 * Set a new IP version to use for the request.
	 * @param {number} v The new IP version.
	 */
	set version(v) { this._version = v; }

	/**
	 * Get the request method.
	 * @returns {string} The current HTTP verb used.
	 */
	get method() { return this._method; }

	/**
	 * Set a new request method.
	 * @param {string} v The new method. (Support: GET, POST, PUT, DELETE and PATCH)
	 */
	set method(v) {
		// Validate if the method is supported.
		const verbs = Object.values(HttpRequest.verbs);
		if (!verbs.includes(v))
			throw new UnsupportedMethod();

		this._method = v;
	}

	/**
	 * Get a JSON parsed version of the data.
	 * @returns {Object|null} The JSON parsed data, null if the data isn't set or the data failed to be parsed.
	 */
	get json() {
		let parse = null;
		try {
			if (this.response.body)
				parse = JSON.parse(this.response.body);
		} catch (ex) {
			csl.err(ex);
		}

		return parse;
	}

	/**
	 * Set the request data as JSON.
	 * @param v The request data.
	 */
	set json(v) {
		this.data = JSON.stringify(v);
	}

	/**
	 * Set the Basic auth.
	 * @param v
	 */
	set auth(v) {
		// the value must be a string on the format: <User>:<Password>
		// Or it can be null.
		// Then use as-is.
		if ((typeof v === 'string' && v.match(/^([^:]*):(.*)$/)) || v === null)
			this._auth = v;

		// If the value is an object with a user string and a password string.
		// Compose the auth string.
		else if (v instanceof Object &&
			typeof v.user === 'string' &&
			typeof v.password === 'string')
				this._auth = `${v.user}:${v.password}`;

		else
			throw InvalidAuth(v);
	}
	//#endregion

	/**
	 * Handler for the HTTP request.
	 * @param {Function} resolve The resolve callback function.
	 * @param {Object} res The response object.
	 * @private
	 */
	_RequestHandler(resolve, reject, res) {
		res.setEncoding('utf8');

		this.response.headers = res.headers;
		this.response.statusCode = res.statusCode;

		// When data is received, save it.
		res.on('data', this._onResponseData.bind(this));

		// Finished to receive data, just resolve the promise.
		res.on('end', this._onResponseEnd.bind(this, resolve, reject));
	}

	/**
	 * Callback when the request send data.
	 * @param {string} data The data sent.
	 * @private
	 */
	_onResponseData(data) {
		this.response.body += data;
	}

	/**
	 * Callback when the request ends.
	 * @param {Function} resolve The resolve callback function.
	 * @private
	 */
	_onResponseEnd(resolve, reject) {
		if (this.response.statusCode !== 200)
			reject(new Error('The request has failed.'));
		resolve(true);
	}

	/**
	 * Callback when the request occur an error.
	 * @param reject The reject callback function.
	 * @param err The error occured.
	 * @private
	 */
	_onRequestError(reject, err) {
		this.response.body = null;
		reject(new ReqError(err));
	}
}

/**
 * The response data of the request
 * @typedef {Object} RequestResponse
 * @property {string} body The response body.
 * @property {number} statusCode The return code.
 * @property {Object} headers The response headers.
 */