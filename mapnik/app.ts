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

import {Renderer as MockRenderer} from './renderer/mockRenderer';
import {Renderer} from './renderer/renderer';
import {DateTime} from 'luxon';
import * as amqp from 'amqplib/callback_api';
import {Message} from 'amqplib/callback_api';
import {buildPdf} from "./renderer/container";
import {v4 as uuidv4} from 'uuid';
import * as fs from 'fs';
import {Territorium} from "./index";
import Polygon = Territorium.Polygon;
import ResultBuffer = Territorium.ResultBuffer;

let url = process.env.RABBITMQ_URL;
if (url === undefined || url === '')
    url = 'amqp://tms:tms@localhost:5672/%2F?connection_attempts=10&retry_delay=5.0';

let dir = process.env.EXCHANGE_DIR;
if (dir === undefined || dir === '')
    dir = '/input/';

let mock = process.env.MOCK;
let renderer = null;
if (mock === undefined || mock === '')
    renderer = new Renderer();
else
    renderer = new MockRenderer();

function sendBuffer(dict: Territorium.Job, buffers: Array<Territorium.ResultBuffer>, error: boolean, channel: amqp.Channel, sendQueue: string, msg: Message) {
    let result: Territorium.Result = new class implements Territorium.Result {
        error: boolean;
        filename: string | undefined;
        job: string;
        mediaType: string | undefined;
        payload: string;
    };
    let job = 'NO_JOB';
    if (dict.job !== undefined)
        job = dict.job;
    channel.ack(msg);
    console.log(`ACK message ${msg.fields.deliveryTag}`);
    for (const buffer of buffers) {
        if (error) {
            result.job = job;
            result.payload = buffer.message;
            result.error = error;
        } else {
            let payload = uuidv4();
            try {
                fs.writeFileSync(`${dir}${payload}`, buffer.buffer);
            } catch (e) {
                let message = 'Error writing file';
                result.job = job;
                result.payload = message;
                result.error = true;
                console.log(message);
            } finally {
                result.job = job;
                result.payload = payload;
                result.filename = buffer.fileName;
                result.mediaType = buffer.mediaType;
                result.error = error;
            }
        }
        channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify(result)));
    }
    console.log('Result sent to queue');
}

function sendError(dict: Territorium.Job, message: string, channel: amqp.Channel, sendQueue: string, msg: Message) {
    let job = 'NO_JOB';
    if (dict.job !== undefined)
        job = dict.job;
    sendBuffer(dict, [{
        message: message,
        buffer: undefined,
        fileName: undefined,
        mediaType: undefined,
        size: undefined,
        name: undefined,
        ppi: undefined
    }], true, channel, sendQueue, msg)
    console.error(`Job ${job}: ${message}`);
}

amqp.connect(url, function (error0, connection) {

    if (error0) {
        console.error(url);
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

        channel.prefetch(1);
        channel.consume(recQueue, function (msg) {
            let payload = msg.content.toString();
            let dict: Territorium.Job
            try {
                dict = JSON.parse(payload)
            } catch (e) {
                sendError(dict, 'Invalid JSON', channel, sendQueue, msg);
                return;
            }
            if (dict.payload === undefined || dict.payload.polygon === undefined) {
                sendError(dict, 'No payload or polygon available.', channel, sendQueue, msg);
                return;
            }

            let buffers: Array<Territorium.ResultBuffer> = [];
            let date = DateTime.local()
            let dateString = date.toFormat('yyyyMMdd');
            let timeString = date.toFormat('HHmmss');
            try {
                let page: Territorium.Page = undefined;
                let extension: string = undefined;
                let polygons: Array<Polygon> = [];
                let count = 0;

                if (dict.payload.page !== undefined) {
                    page = dict.payload.page;
                    if (page.mediaType === 'application/pdf') {
                        extension = 'pdf';
                    }
                }
                if (!(dict.payload.polygon instanceof Array))
                    polygons.push(dict.payload.polygon);
                else
                    polygons = dict.payload.polygon;

                for (const polygon of polygons) {
                    let buffer = renderer.map(polygon);
                    console.log("Rendering finished");
                    if (buffer !== undefined) {
                        console.log("Buffer valid");
                        if (page === undefined)
                            if (polygon.mediaType !== undefined && polygon.mediaType === 'image/png')
                                extension = 'png';
                            else if (polygon.mediaType !== undefined && polygon.mediaType === 'image/svg+xml')
                                extension = 'svg';
                            else
                                extension = 'png';

                        let ppi = 72.0;
                        if (polygon.style !== undefined && polygon.style.ppi !== undefined)
                            ppi = polygon.style.ppi;

                        let name = 'map';
                        if (polygon.name !== undefined && polygon.name.text !== undefined && polygon.name.text !== '') {
                            name = polygon.name.text;
                        }
                        let fileName: string;
                        if (polygons.length <= 1)
                            fileName = `${name}_${dateString}_${timeString}.${extension}`;
                        else if (name == 'map')
                            fileName = `${name}_${count}_${dateString}_${timeString}.${extension}`;
                        else
                            fileName = `${name}_${dateString}_${timeString}.${extension}`;
                        buffers.push({
                            name: name, fileName: fileName, buffer: buffer, message: '',
                            size: polygon.size, mediaType: polygon.mediaType, ppi: ppi
                        });
                        count++;
                    } else {
                        sendError(dict, 'Buffer invalid', channel, sendQueue, msg);
                    }
                }
                if (page !== undefined) {
                    if (page.mediaType === 'application/pdf')
                        buildPdf(page, buffers, (_a, buffer, _b) => {
                            let buffers: Array<ResultBuffer> = [{
                                fileName: `map_${dateString}_${timeString}.pdf`,
                                buffer: buffer,
                                message: '',
                                mediaType: 'application/pdf',
                                name: undefined,
                                ppi: undefined,
                                size: undefined
                            }]
                            sendBuffer(dict, buffers, false, channel, sendQueue, msg);
                        });
                    else {
                        //TODO: xhtml-Export
                    }
                } else {
                    sendBuffer(dict, buffers, false, channel, sendQueue, msg);
                }
            } catch (e) {
                sendError(dict, e.message, channel, sendQueue, msg);
                return;
            }
        });
    });
});
