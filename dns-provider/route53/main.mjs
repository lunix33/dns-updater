import os from 'os';
import path from 'path';
import fs from 'fs';

import DnsProvider from '../../dns-provider.mjs'
import Command from '../../utils/command.mjs';
import AppCsl from '../../utils/app-csl.mjs';
import getConfiguration from '../../utils/configuration.mjs';

import { profileOpt, zoneIdOpt } from './recordfn.mjs';

//#region **** Errors ****
class AwsCliNotFount extends Error {
	constructor(err) {
		super('The AWS CLI was not found in PATH.');
		this.inner = err;
	}
}

class UpdateFail extends Error {
	constructor(err) {
		super('The AWS command failed to update');
		this.inner = err;
	}
}
//#endregion

export default class Route53 extends DnsProvider {
	static csl = new AppCsl('route53');

	/**
	 * The program name used by the update process.
	 * @returns {string} The name of the program.
	 */
	static get programName() { return 'aws'; }

	static get definition() {
		return Object.assign(super.definition, {
			name: 'AWS Route 53 (CLI)',
			version: '1.0.0',
			description: `This plugin uses the <a href="https://aws.amazon.com/cli/" target="_blank">AWS CLI</a> to update Route53 DNS records.
It is required to have the CLI application installed and setup in order to run this plugin.`,
			configurator:[{
				name: 'more',
				page: '/root/dns-provider/route53/more.html',
				script: '/root/dns-provider/route53/more.mjs',
				position: 'front'
			}],
			record: [{
				print: 'AWS CLI profile',
				name: 'profile',
				type: 'select',
				options: `!(${profileOpt.toString()})(%.dataset)`,
				required: true
			}, {
				print: 'Hosted zone ID',
				name: 'zoneId',
				type: 'select',
				options: `!(${zoneIdOpt.toString()})(%.dataset)`,
				tooltip: 'Be sure the profile has the rights to the hosted zone.',
				required: true
			}]
		});
	}

	static async update(record, ip) {
		Route53.csl.verb(`Updating ${record.record}...`);
		await Route53._validateAWSCLI();
		const args = Route53._buildArgs(record, ip);

		const aws = new Command(Route53.programName, args);
		try {
			await aws.execute();
			Route53.csl.info(`${record.record} updated.`);
		}
		catch (err) { throw new UpdateFail(null); }
	}

	/**
	 * Validate if the AWS CLI is correctly installed.
	 * @returns {Promise} Return a promise resolving if the CLI is correctly detected in the PATH, otherwise reject.
	 * @private
	 */
	static async _validateAWSCLI() {
		const process = new Command('aws', [ '--version' ]);
		try {
			await process.execute();
		} catch (err) {
			throw new AwsCliNotFount(err);
		}
	}

	/**
	 * Build the launch arguments of the AWS CLI.
	 * @param {DnsEntry} record The record updated.
	 * @param {Ip} ip The new ip.
	 * @returns {Array} The list of CLI arguments (Used by child-process.spawn)
	 * @private
	 */
	static _buildArgs(record, ip) {
		const recordType = Route53._getRecordType(record);
		const update = JSON.stringify({
			Changes: [{
				Action: "UPSERT",
				ResourceRecordSet: {
					Name: record.record,
					Type: recordType,
					TTL: record.ttl,
					ResourceRecords: [{ Value: ip[record.type] }]
				}
			}]
		});

		return [
			'--output', 'json',
			'--profile', record.profile,
			'route53', 'change-resource-record-sets',
			'--hosted-zone-id', record.zoneId,
			'--change-batch', update.replace(/"/g, '\\"')
		];
	}

	static registerBackRoutes(ws) {
		ws.get('/route53/data', Route53._onGetData.bind(Route53));
	}

	/**
	 * When a configurator request ask to fetch the user data for configuration.
	 * @param r The HTTP resources.
	 * @private
	 */
	static async _onGetData(r) {
		const data = {};
		const profiles = await Route53._getProfiles();
		for (let p of profiles) {
			data[p] = await Route53._getZones(p);
		}

		const config = getConfiguration();
		config.plugin('route53', data);
		await config.save();
		return r.res.writeJson(data);
	}

	static async _getProfiles() {
		const configpath = path.resolve(os.homedir(), '.aws', 'config');
		const awsconfig = (await fs.promises.readFile(configpath)).toString();
		const profiles = [];
		const regexp = /\[(\w+)]/g;
		let matches;
		while ((matches = regexp.exec(awsconfig)) != null)
			profiles.push(matches[1]);
		return profiles;
	}

	static async _getZones(p) {
		const args = [
			'--output', 'json',
			'--profile', p,
			'route53', 'list-hosted-zones'
		];

		const cmd = new Command('aws', args);
		const zones = {};

		await cmd.execute();
		const out = JSON.parse(cmd.stdout[0]);
		for (let z of out.HostedZones)
			zones[z.Name] = /\/(\w+)$/.exec(z.Id)[1];

		return zones;
	}
}