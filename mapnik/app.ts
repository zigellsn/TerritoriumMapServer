/* * Copyright 2019-2020 Simon Zigelli
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// import {Renderer} from './renderer/mockRenderer';
import {Renderer} from './renderer/renderer';
import {DateTime} from 'luxon';
import * as amqp from 'amqplib/callback_api';

let url = process.env.RABBITMQ_URL;
if (url === undefined || url === '')
    url = 'amqp://tms:tms@localhost:5672/%2F';

function sendBuffer(dict, buffer, name: string, dateString, timeString, extension: string, channel, sendQueue: string) {
    let result = {
        'job': dict['job'],
        'payload': buffer,
        'filename': `${name}_${dateString}_${timeString}.${extension}`
    };
    channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify(result)));
    console.log('Result sent to queue');
}

amqp.connect(url, function (error0, connection) {

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
        channel.consume(recQueue, function (msg) {
            let payload = msg.content.toString();
            let dict
            try {
                dict = JSON.parse(payload)
            } catch (e) {
                console.log('Invalid JSON');
                return;
            }
            let buffer = renderer.map(dict['payload']['polygon']);
            console.log("Rendering finished");
            if (buffer !== undefined) {
                console.log("Buffer valid");
                let extension = '';
                if (dict['payload']['polygon']['mediaType'] === 'image/png')
                    extension = 'png';
                else if (dict['payload']['polygon']['mediaType'] === 'image/xml+svg')
                    extension = 'svg';
                else
                    extension = 'pdf';
                let name = '';
                if (dict['payload']['polygon'].hasOwnProperty('name')) {
                    name = dict['payload']['polygon']['name']['text'];
                }
                if (name === '')
                    name = 'map';
                let date = DateTime.local()
                let dateString = date.toFormat('yyyyMMdd');
                let timeString = date.toFormat('HHmmss');
                if (extension === 'pdf') {
                    renderer.buildPdf(dict['payload']['polygon'], buffer, (_a, buffer, _b) => {
                        sendBuffer(dict, buffer, name, dateString, timeString, extension, channel, sendQueue);
                    });
                } else {
                    sendBuffer(dict, buffer, name, dateString, timeString, extension, channel, sendQueue);
                }
            }
        }, {
            noAck: true
        });
    });
});
