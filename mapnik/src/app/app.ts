/* * Copyright 2019-2025 Simon Zigelli
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

import * as amqp_l from 'amqplib';

import {
    availableParallelism,
    FixedThreadPool,
} from 'poolifier-web-worker'
import type { Inputs } from './rendererWorker.ts'
import type { Territorium } from './index.d.ts'

import path from 'node:path';
import * as fs from 'node:fs';

let url = process.env.RABBITMQ_URL;
if (url === undefined || url === '')
    url = 'amqp://tms:tms@localhost:5672/%2F?connection_attempts=10&retry_delay=5.0';

let dir = process.env.EXCHANGE_DIR;
if (dir === undefined || dir === '')
    dir = '/input/tmp/';
else
    dir = path.join(dir, 'tmp');

console.log('Using directory:', dir);
if (!fs.existsSync(dir)) {
    try {
        fs.mkdirSync(dir);
    } catch (e) {
        console.error('Error creating directory:', e);
    }
}

let recQueue = 'mapnik';
let sendQueue = 'maps';

const workerFileURL = new URL('./rendererWorker.ts', import.meta.url)

const fixedPool = new FixedThreadPool<Inputs, Territorium.JobResult | undefined>(
    availableParallelism(),
    workerFileURL,
    {
        errorEventHandler: (e: ErrorEvent) => {
            console.error(e);
        },
        messageEventHandler: (message: any) => {
            if (message.type === 'message' && message.data !== undefined)
                console.log('Message received from worker: ', message.data);
            else
                console.log('Message received from worker: ', message);
        }
    },
);

(async () => {
    let connection = await amqp_l.connect(url);
    let channel = await connection.createChannel();
    await channel.assertQueue(recQueue, {durable: true});
    await channel.assertQueue(sendQueue, {durable: true});
    await channel.prefetch(availableParallelism());
    console.log('Waiting for messages from queue %s.', recQueue);

    await channel.consume(recQueue, async function (msg) {
        if (msg === null) {
            return;
        }
        console.log('Rendering started.');
        try {
            const result = await fixedPool.execute({data: msg.content.toString(), directory: dir});
            console.log('Result:', result);
            if (result === undefined)
                channel.nack(msg, false, false);
            else {
                if (!channel.sendToQueue(sendQueue, Buffer.from(JSON.stringify(result))))
                    console.error('Error sending message to queue.');
                channel.ack(msg)
            }
        } catch (e) {
            console.error('A general Error occured:', e);
            channel.nack(msg, false, false);
        }
    });
})();
