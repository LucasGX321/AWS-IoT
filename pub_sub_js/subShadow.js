/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

const iotsdk = require("aws-iot-device-sdk-v2");
const mqtt = iotsdk.mqtt;
const TextDecoder = require("util").TextDecoder;
const yargs = require("yargs");
const common_args = require("../../util/cli_args");

// const aux = {
// 	endpoint: "a2dw429gnpbb11-ats.iot.us-west-2.amazonaws.com",
// 	ca_file: "../certs/AmazonRootCA1.pem",
// 	cert: "../certs/0057f0d5f47bc19a6aaac3f45f2733e278337231bad7d2f2b2719944b7486237-certificate.pem.crt",
// 	key: "../certs/0057f0d5f47bc19a6aaac3f45f2733e278337231bad7d2f2b2719944b7486237-private.pem.key",
// 	topic: "$aws/things/LOGO-1-Autosolve/shadow/update/documents",
// };

yargs
	.command(
		"*",
		false,
		(yargs) => {
			common_args.add_direct_connection_establishment_arguments(yargs);
			common_args.add_topic_message_arguments(yargs);
		},
		main
	)
	.parse();

async function execute_session(connection, argv) {
	return new Promise(async (resolve, reject) => {
		try {
			const decoder = new TextDecoder("utf8");
			const on_publish = async (topic, payload, dup, qos, retain) => {
				const json = decoder.decode(payload);
				console.log(
					`Publish received. topic:"${topic}" dup:${dup} qos:${qos} retain:${retain}`
				);
				console.log(JSON.stringify(JSON.parse(json), null, 2));
				const message = JSON.parse(json);
				if (message.sequence == argv.count) {
					resolve();
				}
			};

			await connection.subscribe(
				argv.topic,
				mqtt.QoS.AtLeastOnce,
				on_publish
			);
		} catch (error) {
			reject(error);
		}
	});
}

async function main(argv) {
	common_args.apply_sample_arguments(argv);
	const connection = common_args.build_connection_from_cli_args(argv);

	await connection.connect();
	await execute_session(connection, argv);
}
