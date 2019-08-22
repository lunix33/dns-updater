/**
 * Program Arguments
 * @typedef {Object} Args
 * @property {string} [config] The path to the configuration file.
 * @property {string} [c] shorthand for 'config'.
 * @property {boolean} [service] True if the application should run as a service.
 * @property {boolean} [s] shorthand for 'service'.
 * @property {boolean} [setup] Start the setup utility.
 */

//#region **** Configuration ****
/**
 * The configuration object.
 * @typedef {Object} ConfigObj
 * @property {number} serviceTimeout Time between service run.
 * @property {Array<string>} ipPlugins The list of IP plugin to be used.
 * @property {Array<DnsEntry>} dnsEntries The list of DNS entries to update.
 * @property {Object} plugins Object with the configuration options for the plugins.
 */

/**
 * The configuration of each DNS entries.
 * @typedef {Object} DnsEntry
 * @property {string} provider The dns provider plugin name.
 * @property {boolean} enable True if the entry needs to be updated, otherwise false.
 * @property {string} record The name of the record to be updated.
 * @property {number} type The type of record (4: IPv4 (A); 6: IPv6 (AAAA)).
 * @property {number} ttl The desired record TTL (If the provider has a minimum TTL, it must match).
 */
//#endregion

//#region **** Plugins ****
/**
 * Object storing the IPs.
 * @typedef {Object} Ip
 * @property {string} 4 The IPv4 Address.
 * @property {string} 6 the IPv6 Address.
 */

/**
 * @typedef {Object} PluginFieldConfig
 * @property {string} name The name of the field.
 * @property {string} print The configurator printed name.
 * @property {string} type The type of field (text, number, select, checkbox)
 * @property {Array<*>} [selectOptions] The possible values.
 * @property {string} [tooltip] A tooltip to display in the configurator.
 * @property {boolean} [required=false] True if the field is required, otherwise false.
 * @property {*} [default] The default value of the field.
 */

/**
 * @typedef {Object} PluginDef
 * @property {string} name The name of the plugin.
 * @property {string} version The version of the plugin.
 * @property {string} description The description of the plugin.
 * @property {string} [sysname] The system name of the plugin (Only present in the configurator).
 * @property {Array<PluginFieldConfig>} config The list of field for general configuration.
 * @property {Array<SimpleWebRoute|ConfiguratorFrontRoute>} configurator A list of configurator routes.
 */

/**
 * @typedef {PluginDef} IpPluginDef
 * @property {boolean} v4 True if the plugin support IPv4.
 * @property {boolean} v6 True if the plugin support IPv6.
 */

/**
 * @typedef {PluginDef} DnsProviderDef
 * @property {Array<PluginFieldConfig>} record The configuration for a dns record.
 */


//#endregion

/**
 * @typedef {Object} HTTPAuth
 * @property {string} user The username.
 * @property {string} password The user password.
 */

/**
 * @typedef {Object} SimpleWebRoute
 * @property {RegExp} url A regexp to match the request URL.
 * @property {string} method The HTTP request verb.
 * @property {Function} fn The function resolving the request.
 */

/**
 * @typedef {Object} ConfiguratorFrontRoute
 * @property {RegExp} [url] The url matcher of the route. (required if 'name' isn't supplied.)
 * @property {string} [name] The name of the file route. (required if 'url' isn't supplied.)
 * @property {string} page The path to the html file.
 * @property {string} script The script of the page.
 * @property {string} [position='front'] Identify the router of this route.
 */
