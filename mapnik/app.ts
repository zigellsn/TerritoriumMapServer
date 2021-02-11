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

import {Renderer} from './renderer/mockRenderer';
// import {Renderer} from './renderer/renderer';
import {DateTime} from 'luxon';
import * as amqp from 'amqplib/callback_api';
import {buildPdf} from "./renderer/container";

let url = process.env.RABBITMQ_URL;
if (url === undefined || url === '')
    url = 'amqp://tms:tms@localhost:5672/%2F?connection_attempts=10&retry_delay=5.0';

function sendBuffer(dict, buffers: Array<any>, error: boolean, channel, sendQueue: string) {
    let result;
    let job = 'NO_JOB';
    if ('job' in dict)
        job = dict['job'];
    for (const buffer of buffers) {
        if (error) {
            result = {
                'job': job,
                'payload': buffer['buffer'],
                'error': error
            };
        } else {
            result = {
                'job': job,
                'payload': buffer['buffer'],
                'filename': buffer['fileName'],
                'mediaType': buffer['mediaType'],
                'error': error
            };
        }
        channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify(result)));
    }
    console.log('Result sent to queue');
}

function sendError(dict, message: string, channel, sendQueue: string) {
    let job = 'NO_JOB';
    if ('job' in dict)
        job = dict['job'];
    let buffers = [Buffer.from(message, 'utf-8')]
    sendBuffer(dict, buffers, true, channel, sendQueue)
    console.error(`Job ${job}: ${message}`);
}

amqp.connect(url, function (error0, connection) {

    if (error0) {
        console.error(error0.toString());
        return;
    }
    connection.createChannel(function (error1, channel) {
        if (error1) {
            console.error(error1.toString());
            return;
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

            let buffers = [];
            let date = DateTime.local()
            let dateString = date.toFormat('yyyyMMdd');
            let timeString = date.toFormat('HHmmss');
            try {
                let page = undefined;
                if ('page' in dict['payload'] && dict['payload']['page'] !== undefined)
                    page = dict['payload']['page'];

                let polygons = [];
                if (!(dict['payload']['polygon'] instanceof Array))
                    polygons.push(dict['payload']['polygon']);
                else
                    polygons = dict['payload']['polygon'];

                let count = 0;
                for (const polygon of polygons) {
                    let buffer = renderer.map(polygon);
                    console.log("Rendering finished");
                    if (buffer !== undefined) {
                        console.log("Buffer valid");
                        let extension;
                        if ('mediaType' in polygon && polygon['mediaType'] === 'image/png')
                            extension = 'png';
                        else if ('mediaType' in polygon && polygon['mediaType'] === 'image/xml+svg')
                            extension = 'svg';
                        else
                            extension = 'png';
                        if (page !== undefined) {
                            if ('mediaType' in page && page['mediaType'] === 'application/pdf') {
                                extension = 'pdf';
                            }
                        }

                        let ppi = 72.0;
                        if ('style' in polygon && 'ppi' in polygon['style'] && polygon['style']['ppi'] !== undefined)
                            ppi = polygon['style']['ppi'];

                        let name = 'map';
                        if ('name' in polygon && 'text' in polygon['name'] && polygon['name']['text'] !== '') {
                            name = polygon['name']['text'];
                        }
                        let fileName;
                        if (polygons.length <= 1)
                            fileName = `${name}_${dateString}_${timeString}.${extension}`;
                        else if (name == 'map')
                            fileName = `${name}_${count}_${dateString}_${timeString}.${extension}`;
                        else
                            fileName = `${name}_${dateString}_${timeString}.${extension}`;
                        buffers.push({
                            name: name, fileName: fileName, buffer: buffer,
                            size: polygon['size'], mediaType: polygon['mediaType'], ppi: ppi
                        });
                        count++;
                    } else {
                        sendError(dict, 'Buffer invalid', channel, sendQueue);
                    }
                }
                if (page !== undefined) {
                    buildPdf(page, buffers, (_a, buffer, _b) => {
                        let buffers = [{
                            fileName: `map_${dateString}_${timeString}.pdf`,
                            buffer: buffer, mediaType: 'application/pdf'
                        }]
                        sendBuffer(dict, buffers, false, channel, sendQueue);
                    });
                } else {
                    sendBuffer(dict, buffers, false, channel, sendQueue);
                }
            } catch (e) {
                sendError(dict, e.message, channel, sendQueue);
                return;
            }
        }, {
            noAck: true
        });
    });
});
