# DNS Updater

This program allows you to use regular DNS service as a dynamic ip service provider.

DNS Updater is able to run on any os able to run NodeJS.

**Some aspect of this utility are still unfinished.**

# Dependancies

* [NodeJS](https://nodejs.org/) >= 12.0.0

# How to install

1. Clone the repository (or download as a zip and extract).
2. Using a terminal navigate to the project location.
3. Run the command `npm install`.
4. Enjoy!

# Modules

There exists two kind of modules in this application.

1. IP Plugins (located in the `/ip-plugin/` folder)
	Those modules are used to get the external IP address of the computer.
2. DNS Providers (located in the `/dns-provider/` folder)
	Those modules are used to update DNS records (A or AAAA).

If you want to know how to make your own module, don't hesitate to take a look at the wiki (still not documented...) or take a look at the existing modules.

If you make a module don't hesitate to submite your module git repositry, it will be my presure to promote it.

# Usage

```
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
```

For the full usage and help, see the `--help` option page and the individual module pages.

# Note

This application makes use of of the `--experimental-modules` of NodeJS.
Therefore you won't be able to start the application without the flag when using node directly.

This is the reason the the scripts in the `/bin/` folder were created.
To work properly the executable of NodeJS must be in your system PATH.

Also some IP Plugin and DNS Providers might not be compatible with every operating systems or might have some special dependancies which needs to be added to the project see the README of the module for more detail.

