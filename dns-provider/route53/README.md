# OpenDNS (dns-updater / IP Plugin)

This plugin uses the [AWS CLI](https://aws.amazon.com/cli/) to update Route53 DNS records.

It is required to have the CLI application installed and setup in order to run this plugin.

# Dependancies

* [AWS CLI](https://aws.amazon.com/cli/)

# Installation

1. Head to the [AWS  Console](https://console.aws.amazon.com/console/home) and go into IAM (use the search in the console to find the tool).
2. ***The step is optional, but is recommended for additional security.***
	Create a new policy and use the following JSON policy:
```
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "RecordWrite",
			"Effect": "Allow",
			"Action": "route53:ChangeResourceRecordSets",
			"Resource": "arn:aws:route53:::hostedzone/*"
		},
		{
			"Sid": "HZList",
			"Effect": "Allow",
			"Action": "route53:ListHostedZones",
			"Resource": "*"
		}
	]
}
```
	This policy allows the user to list route 53 hosted zones and to edit the hosted zones records.

3. You'll need to setup a new user with `Programmatic access`
	and will need use the policy created during the last step.
	If you've skipped the policy creation, you can attach the following policy: `AmazonRoute53FullAccess`
	Once the user is created, make sure to take note of the user's Access key ID and Secret access key, since those will be needed later.

4. You'll need to [install Python](https://www.python.org/downloads/) to install the AWS CLI utility.
	Follow the official instructions to install Python for your specific environment.

5. In a commandline window run the following command:
	`pip install awscli`
	If the terminal indicates `pip` was not found, you might need to restart your terminal
	or python might not have been included in your PATH (which is essential).

6. Setup your AWS CLI by running the following command and follow the instructions on screen:
	`aws configure`

7. Done, you can now use this plugin properly.
