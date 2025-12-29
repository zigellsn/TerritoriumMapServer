/*
 * Copyright 2019-2025 Simon Zigelli
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

import type {Territorium} from "../index.d.ts";

let url = process.env.PDF_EMITTER_URL;
if (url === undefined || url === '')
    url = 'http://pdfemitter:8080';

let VERSION = "0.1.0-alpha01"

export async function buildPdf(page: Territorium.Page, buffers: Array<Territorium.ResultBuffer>) {

    const buffersBase64 = buffers.map(item => ({
        ...item,
        buffer: item.buffer ? item.buffer.toString('base64') : '',
        worldFile: item.worldFile ? item.worldFile.toString('base64') : ''
    }));

    const data: Territorium.Container = {
        page: page,
        buffers: buffersBase64,
        version: VERSION
    };

    let jsonString = JSON.stringify(data);

    const stream = new Blob([jsonString]).stream().pipeThrough(new CompressionStream('gzip'));
    const compressedBody = await new Response(stream).blob();

    const response = await fetch(`${url}/api/build`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
        },
        body: compressedBody,
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();

    return Buffer.from(arrayBuffer);
}
