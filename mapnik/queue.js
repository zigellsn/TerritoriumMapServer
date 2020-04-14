'use strict';

const amqp = require('amqplib/callback_api');
const Renderer = require('./renderer/renderer');

amqp.connect('amqp://192.168.159.128', function (error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        let recQueue = 'mapnik';
        let sendQueue = 'maps';

        channel.assertQueue(recQueue, {
            durable: false
        });

        channel.assertQueue(sendQueue, {
            durable: false
        });

        let renderer = new Renderer();
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", recQueue);
        channel.consume(recQueue, function (msg) {
            let payload = msg.content.toString();
            let dict = JSON.parse(payload);

            let buffer = renderer.map(dict['payload']['polygon']);
            if (buffer !== undefined) {
                let result = {'job': dict['job'], 'payload': buffer.toString(), 'filename': 'map.txt'};
                channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify(result)));
            }
        }, {
            noAck: true
        });

    });
});