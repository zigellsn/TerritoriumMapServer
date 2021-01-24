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
import {Renderer, RenderError} from './renderer/renderer';
import {DateTime} from 'luxon';
import * as amqp from 'amqplib/callback_api';

let url = process.env.RABBITMQ_URL;
if (url === undefined || url === '')
    url = 'amqp://tms:tms@localhost:5672/%2F';

function sendBuffer(dict, buffer, fileName: string, error: boolean, channel, sendQueue: string) {
    let result;
    let job = 'NO_JOB';
    if ('job' in dict)
        job = dict['job'];
    if (error) {
        result = {
            'job': job,
            'payload': buffer,
            'error': error
        };
    } else {
        result = {
            'job': job,
            'payload': buffer,
            'filename': fileName,
            'error': error
        };
    }
    channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify(result)));
    console.log('Result sent to queue');
}

function sendError(dict, message: string, channel, sendQueue: string) {
    let job = 'NO_JOB';
    if ('job' in dict)
        job = dict['job'];
    let buffer = Buffer.from(message, 'utf-8')
    sendBuffer(dict, buffer, '', true, channel, sendQueue)
    console.log(`Job ${job}: ${message}`);
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
                sendError(dict, 'Invalid JSON', channel, sendQueue);
                return;
            }
            if (!('payload' in dict) || !('polygon' in dict['payload'])) {
                sendError(dict, 'No payload or polygon available.', channel, sendQueue);
                return;
            }
            let buffer;
            try {
                buffer = renderer.map(dict['payload']['polygon']);
            } catch (e) {
                if (e instanceof RenderError) {
                    sendError(dict, e.message, channel, sendQueue);
                    return;
                }
            }
            console.log("Rendering finished");
            if (buffer !== undefined) {
                console.log("Buffer valid");
                let extension;
                if ('mediaType' in dict['payload']['polygon']
                    && dict['payload']['polygon']['mediaType'] === 'image/png')
                    extension = 'png';
                else if ('mediaType' in dict['payload']['polygon']
                    && dict['payload']['polygon']['mediaType'] === 'image/xml+svg')
                    extension = 'svg';
                else
                    extension = 'pdf';
                let name = 'map';
                if ('name' in dict['payload']['polygon'] && 'text' in dict['payload']['polygon']['name']
                    && dict['payload']['polygon']['name']['text'] !== '') {
                    name = dict['payload']['polygon']['name']['text'];
                }
                let date = DateTime.local()
                let dateString = date.toFormat('yyyyMMdd');
                let timeString = date.toFormat('HHmmss');
                let fileName = `${name}_${dateString}_${timeString}.${extension}`;
                if (extension === 'pdf') {
                    renderer.buildPdf(dict['payload']['polygon'], buffer, (_a, buffer, _b) => {
                        sendBuffer(dict, buffer, fileName, false, channel, sendQueue);
                    });
                } else {
                    sendBuffer(dict, buffer, fileName, false, channel, sendQueue);
                }
            }
        }, {
            noAck: true
        });
    });
});
