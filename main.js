#!/bin/env node

import path from 'path';
import url from "url";

import minimist from 'minimist';
import debug from 'debug';

import getConfiguration from './utils/configuration.mjs';
import AppCsl from './utils/app-csl.mjs';
import Updater from "./updater.mjs";
import Configurator from "./utils/configurator.mjs";
import SimpleWeb from "./simple-web.mjs";

const csl = new AppCsl();

(async function main(/** @type {Args} */argv) {
	const state = {
		once: argv.once || argv.o || false,
		service: argv.service || argv.s || false,
		config: argv.config || argv.c || false,
		gui: argv.gui || false,
		help: argv.help || argv.h || false
	};

	// Project root
	global.__root = path.dirname(url.fileURLToPath(import.meta.url));

	if (state.once || state.service || state.gui) {
		// Enable all debug message from the application.
		const enable = (process.env.NODE_ENV === 'development') ?
			`${AppCsl.base}:*` :
			`${AppCsl.base}:*,-${AppCsl.base}:*:verb`;
		debug.enable(enable);

		// Get configuration
		const config = getConfiguration();
		if (state.config)
			config.filePath = state.config;

		try {
			await config.load();
			if (state.gui) {
				const configurator = new Configurator(config);
				configurator.start();
			} else {
				const updater = new Updater(config, state.once);
				await updater.run();
			}
		} catch (err) {
			csl.err(err);
			process.exit(1);
		}
	} else if (state.help){
		const configurator = new Configurator();
		configurator.onPageLoaded = async () => {
			await configurator.stop();
			process.exit(0);
		};
		try { await configurator.open('help?hm=1'); }
		catch (err) {
			csl.err(err);
			process.exit(1);
		}
	} else {
		console.log(`
usage: dns-updater [...options]
Options:
	--usage :
		Show this help.
	--help or -h:
		Show the help page of the configurator.
	--once or -o :
		Update the configured DNS once.
	--service or -s :
		Run the application as a service.
		The update will happen at regular interval based on the 'serviceTimeout' option.
	--config or -c :
		Specify the location of the configuration file.
		The default location is in the same directory as the executable.
	--gui :
		Run the graphical configurator.
		You can only use '--config' at the same time.
`);
	}
})(minimist(process.argv.slice(2)));
