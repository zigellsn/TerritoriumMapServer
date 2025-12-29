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

import {ThreadWorker} from 'poolifier-web-worker'
import {parentPort} from 'node:worker_threads';
import {v4 as uuidv4} from 'uuid';
import type {AbstractRenderer, Territorium} from "./index.d.ts";
import * as fs from 'node:fs';
import {Renderer} from "./renderer/renderer.ts";
import {Renderer as MockRenderer} from './renderer/mockRenderer.ts';
import {DateTime} from "luxon";
import {buildPdf} from "./renderer/container.ts";
import * as path from "node:path";

let mock = process.env.MOCK;

let renderer: AbstractRenderer;

if (mock === undefined || mock === '') {
    renderer = new Renderer();
} else {
    renderer = new MockRenderer();
}

export interface Inputs {
    data: string;
    directory: string
}

class RendererWorker extends ThreadWorker<Inputs, Territorium.JobResult | undefined> {
    constructor() {
        super(async (data?: Inputs) => await this.process(data), {
            maxInactiveTime: 60000,
        })
    }

    private async process(data?: Inputs): Promise<Territorium.JobResult | undefined> {
        let job: Territorium.Job;
        try {
            job = JSON.parse(data?.data!) as Territorium.Job;
        } catch
            (e: any) {
            parentPort?.postMessage({error: true, message: 'Invalid JSON: ' + e.toString()});
            return;
        }

        if (job.payload === undefined || job.payload === null || job.payload.polygon === undefined || job.payload.polygon === null) {
            parentPort?.postMessage({error: true, message: 'No payload or polygon available.'});
            return;
        }

        let buffers: Array<Territorium.ResultBuffer> = [];
        let date = DateTime.local()
        let dateString = date.toFormat('yyyyMMdd');
        let timeString = date.toFormat('HHmmss');

        let page: Territorium.Page | undefined = undefined;
        let extension: string | undefined = undefined;
        let polygons: Array<Territorium.Polygon> = [];
        let count = 0;

        if (job.payload.page !== undefined && job.payload.page !== null) {
            page = job.payload.page;
            if (page.mediaType === 'application/pdf') {
                extension = 'pdf';
            }
        }
        if (!(job.payload.polygon instanceof Array))
            polygons.push(job.payload.polygon);
        else
            polygons = job.payload.polygon;

        for (const polygon of polygons) {
            let comp = await renderer.map(polygon);
            let buffer = comp.map;
            let worldFile = comp.worldFile;
            parentPort?.postMessage("Rendering finished");
            if (buffer !== undefined) {
                parentPort?.postMessage(`Buffer size of ${polygon.name.text}: ${(buffer.length / 1024 / 1024).toFixed(3)} MB`);
                if (page === undefined)
                    if (polygon.mediaType !== undefined && polygon.mediaType !== null)
                        if (polygon.mediaType === 'image/png')
                            extension = 'png';
                        else if (polygon.mediaType === 'image/svg+xml')
                            extension = 'svg';
                        else if (polygon.mediaType === 'application/pdf')
                            extension = 'pdf';
                        else
                            extension = 'png';
                    else
                        extension = 'png';

                let ppi = 72.0;
                if (polygon.style !== undefined && polygon.style !== null && polygon.style.ppi !== undefined && polygon.style.ppi !== null)
                    ppi = polygon.style.ppi;

                let name = 'map';
                if (polygon.name.text !== undefined && polygon.name.text !== null && polygon.name.text !== '') {
                    name = polygon.name.text;
                }
                let fileName: string;
                if (polygons.length <= 1)
                    fileName = `${name}_${dateString}_${timeString}.${extension}`;
                else if (name == 'map')
                    fileName = `${name}_${count}_${dateString}_${timeString}.${extension}`;
                else
                    fileName = `${name}_${count}_${dateString}_${timeString}.${extension}`;
                let outputWorldFile = undefined;
                if (polygon.generateWorldFile)
                    outputWorldFile = worldFile;
                buffers.push({
                    name: name, fileName: fileName, buffer: buffer, worldFile: outputWorldFile,
                    message: '', size: polygon.size, mediaType: polygon.mediaType, ppi: ppi
                });
                count++;
            } else {
                parentPort?.postMessage({error: true, job: job, message: 'Buffer invalid'});
            }
        }
        if (page !== undefined) {
            if (page.mediaType === 'application/pdf') {
                let buffer = await buildPdf(page, buffers);
                let pdfDocuments: Array<Territorium.ResultBuffer> = [{
                    fileName: `map_${dateString}_${timeString}.pdf`,
                    buffer: buffer,
                    worldFile: undefined,
                    message: '',
                    mediaType: 'application/pdf',
                    name: undefined,
                    ppi: undefined,
                    size: undefined
                }]
                for (const pdfDocument of pdfDocuments) {
                    if (pdfDocument.buffer === undefined)
                        continue;
                    parentPort?.postMessage(`PDF-Document size: ${(pdfDocument.buffer.length / 1024 / 1024).toFixed(3)} MB`);
                }
                parentPort?.postMessage('PDF build finished');
                return new Promise((resolve: any) => {
                    resolve(this.createResult(job, pdfDocuments, data?.directory!, false));
                });
            } else {
                //TODO: epub-Export
            }
        } else {
            return new Promise((resolve: any) => {
                resolve(this.createResult(job, buffers, data?.directory!, false));
            });
        }
    }

    private createResult(job: Territorium.Job, buffers: Array<Territorium.ResultBuffer>, directory: string, error: boolean): Territorium.JobResult {
        let jobId = job.job || 'NO_JOB';
        let resultsToSend: Array<Territorium.Result> = [];

        let jobResult: Territorium.JobResult = {
            job: jobId,
            error: false,
            result: []
        };

        for (const buffer of buffers) {
            let result: Territorium.Result = {} as Territorium.Result;
            if (error) {
                result.payload = buffer.message;
                result.error = error;
                jobResult.error = true;
                parentPort?.postMessage({
                    error: true, message: `Job ${jobId}: Error processing buffer for ${buffer.fileName}`
                });
            } else {
                let payload = uuidv4();
                try {
                    let worldFile: string | undefined = undefined;
                    if (buffer.worldFile !== undefined && buffer.worldFile !== null) {
                        worldFile = buffer.worldFile.toString('base64')
                    }
                    fs.writeFileSync(path.join(directory, payload), buffer.buffer);
                    result.payload = payload;
                    result.worldFile = worldFile;
                    result.filename = buffer.fileName;
                    result.mediaType = buffer.mediaType;
                    result.error = error;
                } catch (e) {
                    result.payload = 'Error writing file';
                    result.error = true;
                    jobResult.error = true;
                }
            }
            resultsToSend.push(result);
        }
        jobResult.result = resultsToSend;
        return jobResult;
    }
}

export default new RendererWorker()