/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

const iotsdk = require("aws-iot-device-sdk-v2");
const mqtt = iotsdk.mqtt;
const TextDecoder = require("util").TextDecoder;
const yargs = require("yargs");
const common_args = require("../../util/cli_args");

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
			// const decoder = new TextDecoder("utf8");
			// const on_publish = async (topic, payload, dup, qos, retain) => {
			// 	const json = decoder.decode(payload);
			// 	console.log(
			// 		`Publish received. topic:"${topic}" dup:${dup} qos:${qos} retain:${retain}`
			// 	);
			// 	// console.log(json);
			// 	console.log(JSON.stringify(JSON.parse(json), null, 2));
			// 	// const message = JSON.parse(json);
			// 	// if (message.sequence == argv.count) {
			// 	resolve();
			// 	// }
			// };

			// await connection.subscribe(
			// 	argv.topic,
			// 	mqtt.QoS.AtLeastOnce,
			// 	on_publish
			// );

			// for (let op_idx = 0; op_idx < 2; ++op_idx) {
			const publish = async () => {
				const msg = {
					state: {
						desired: { "Q..1:2-1": argv.message },
					},
					// message: argv.message,
					// sequence: op_idx + 1,
				};
				const json = JSON.stringify(msg);
				// console.log(JSON.stringify(JSON.parse(json), null, 2));
				try {
					await connection.publish(
						argv.topic,
						json,
						mqtt.QoS.AtLeastOnce
					);
				} catch (e) {
					console.log(e);
				}
				// connection.publish(argv.topic, json, mqtt.QoS.AtLeastOnce);
			};
			publish();
			resolve();
			// }
		} catch (error) {
			reject(error);
		}
	});
}

async function main(argv) {
	common_args.apply_sample_arguments(argv);

	const connection = common_args.build_connection_from_cli_args(argv);

	// force node to wait 60 seconds before killing itself, promises do not keep node alive
	// ToDo: we can get rid of this but it requires a refactor of the native connection binding that includes
	//    pinning the libuv event loop while the connection is active or potentially active.
	const timer = setInterval(() => {}, 60 * 1000);
	try {
		await connection.connect();
		await execute_session(connection, argv);
	} catch (e) {
		console.log(e);
	}
	// await connection.connect();
	// await execute_session(connection, argv);
	await connection.disconnect();

	// Allow node to die if the promise above resolved
	clearTimeout(timer);
}
