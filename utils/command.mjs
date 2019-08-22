import child_process from 'child_process';

export default class Command {
	//#region **** Fields ****
	/** @type {string} */
	command = '';

	/** @type {Array<string>} */
	args;

	/** @type {Object} */
	env;

	/**
	 * The NodeJS child process object spawned.
	 * @type {ChildProcess|null}
	 */
	process = null;

	/**
	 * The process exit code.
	 * Is null until the process complete.
	 * @type {number|null}
	 */
	code = null;

	/**
	 * The process termination signal.
	 * Is null until the process complete.
	 * @type {string}
	 */
	signal = null;

	/**
	 * The output of the command.
	 * @type {Array}
	 */
	output = [];
	//#endregion

	/**
	 * Create a new command runner.
	 * @param {string} app The path to the command to run.
	 * @param {Array<string>} [args] The arguments to the command
	 * @param {Object} [env] An object with the environment variable.
	 */
	constructor(app, args, env) {
		this.command = app;
		this.args = args || [];
		this.env = env || process.env;
	}

	/**
	 * The data sent by the process in the standard output channel.
	 * @returns {Array<string>}
	 */
	get stdout() {
		return this.output.filter(x => /^S:/.test(x));
	}

	/**
	 * The data sent by the process in the standard error channel.
	 * @returns {Array<string>}
	 */
	get stderr() {
		return this.output.filter(x => /^E:/.test(x));
	}

	/**
	 * Execute the command with the specified arguments.
	 * @returns {Promise}
	 *      Return a promise resolving when the process exit successfully, otherwise reject.
	 *      If the reject error is undefined, it means the process finished with a non-zero error code.
	 *      If the error is defined, then a critical error happened when spawning the process.
	 */
	execute() {
		return new Promise((resolve, reject) => {
			this.process = child_process.spawn(this.command, this.args, { shell: true, env: this.env });
			this.process.stdout.on('data', this._onStdoutData.bind(this));
			this.process.stderr.on('data', this._onStderrData.bind(this));
			this.process.on('close', this._onProcessExit.bind(this, resolve, reject));
			this.process.on('error', this._onProcessError.bind(this, resolve, reject));
		});
	}

	//#region **** Event listeners ****
	/**
	 * Action executed when a message on stdout is received.
	 * @param {string} data The message sent by the command.
	 * @private
	 */
	_onStdoutData(data) {
		data = (data instanceof Buffer) ? data.toString() : data;
		this.output.push(`S: ${data}`);
	}

	/**
	 * Action executed when a message on stderr is received.
	 * @param {string} data The message sent by the command.
	 * @private
	 */
	_onStderrData(data) {
		data = (data instanceof Buffer) ? data.toString() : data;
		this.output.push(`E: ${data}`);
	}

	/**
	 * Action executed when the child process terminate.
	 * @param {Function} resolve The resolve callback
	 * @param {Function} reject The reject callback.
	 * @param {number} code The process exit code.
	 * @param {string} signal The termination signal.
	 * @private
	 */
	_onProcessExit(resolve, reject, code, signal) {
		this.code = code;
		this.signal = signal;

		if (code !== 0)
			reject();
		else
			resolve();
	}

	/**
	 * Action executed when an error occur in the process.
	 * @param {Function} resolve The resolve callback.
	 * @param {Function} reject The reject callback.
	 * @param {Error} err Some error.
	 * @private
	 */
	_onProcessError(resolve, reject, err) {
		this.code = -1;
		reject(err);
	}
	//#endregion
}