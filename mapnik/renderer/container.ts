/*
 * Copyright 2019-2021 Simon Zigelli
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

import {Margins, PageOrientation, PageSize, TDocumentDefinitions} from "pdfmake/interfaces";
import {DateTime} from 'luxon';
import {Territorium} from "../index";

import * as SIZES from 'pdfmake/src/standardPageSizes';
import PdfPrinter = require('pdfmake');

let fontsDirectory = process.env.FONT_DIRECTORY;
if (fontsDirectory === undefined || fontsDirectory === '')
    fontsDirectory = 'fonts';

export function buildPdf(page: Territorium.Page, buffers: Array<Territorium.ResultBuffer>, cb: (...args: any[]) => void) {

    function getDoc(pdfDoc, cb: (...args: any[]) => void) {
        let chunks = [];
        pdfDoc.on('data', (chunk) => {
            chunks.push(chunk);
        });
        pdfDoc.on('end', () => {
            let result = Buffer.concat(chunks);
            cb(null, result, pdfDoc._pdfMakePages);
        });
        pdfDoc.on('error', cb);
        pdfDoc.end();
    }

    let pageSize = 'A4';
    let pageOrientation = 'portrait';
    let pageMargins: number | [number, number] | [number, number, number, number] = [36, 36, 36, 36];
    let mediaType = 'image/png';
    let pageDecoration = true;
    if (page.pageSize !== undefined)
        pageSize = page.pageSize;
    if (page.orientation !== undefined)
        pageOrientation = page.orientation;
    if (page.margins !== undefined)
        pageMargins = page.margins as number | [number, number] | [number, number, number, number];
    if (page.pageDecoration !== undefined)
        pageDecoration = page.pageDecoration;

    let content = [];
    let name;
    let keywords = '';

    let pageMeasure = SIZES[pageSize];
    if (pageOrientation === 'landscape') {
        let tmp = pageMeasure[0];
        pageMeasure[0] = pageMeasure[1];
        pageMeasure[1] = tmp;
    }

    if (!(pageMargins instanceof Array)) {
        pageMeasure[0] = pageMeasure[0] - 2 * pageMargins;
        pageMeasure[1] = pageMeasure[1] - 2 * pageMargins;
    } else if (pageMargins.length === 2) {
        pageMeasure[0] = pageMeasure[0] - 2 * pageMargins[0];
        pageMeasure[1] = pageMeasure[1] - 2 * pageMargins[1];
    } else {
        pageMeasure[0] = pageMeasure[0] - pageMargins[0] - pageMargins[2];
        pageMeasure[1] = pageMeasure[1] - pageMargins[1] - pageMargins[3];
    }

    for (const buffer of buffers) {
        let ppi = 72.0;
        if (buffer.mediaType !== undefined)
            mediaType = buffer.mediaType;
        if (buffer.ppi !== undefined)
            ppi = buffer.ppi;
        keywords = `${keywords}${buffer.name}, `;
        if (pageDecoration)
            name = {text: buffer.name}

        let width = (buffer.size[0] / ppi * 72.0);
        let height = (buffer.size[1] / ppi * 72.0);

        let q_w = pageMeasure[0] / width;
        let q_h = pageMeasure[1] / height;
        if (q_w < 1 || q_h < 1) {
            let q = q_w;
            if (q_h < q_w)
                q = q_h;
            width = width * q;
            height = height * q;
        }

        if (mediaType === 'image/svg+xml') {
            content.push({
                stack: [
                    name,
                    {
                        svg: buffer.buffer,
                        width: width,
                        height: height,
                        options: {
                            assumePt: true,
                        }
                    }], unbreakable: true
            })
        } else {
            content.push({
                stack: [
                    name,
                    {
                        image: buffer.buffer,
                        width: width,
                        height: height,
                        options: {
                            assumePt: true,
                        }
                    }], unbreakable: true
            })
        }
        content.push({text: '\n'})
    }

    if (content.length > 1)
        content.pop();

    let docDefinition: TDocumentDefinitions = {
        info: {
            title: 'Territory Maps',
            author: 'Territorium Map Server',
            subject: 'Territory Maps',
            keywords: keywords.slice(0, -2)
        },
        pageSize: pageSize as PageSize,
        pageOrientation: pageOrientation as PageOrientation,
        pageMargins: pageMargins as Margins,
        content: content
    };
    let date = DateTime.local()
    let dateString = date.toFormat('yyyy/MM/dd');
    let timeString = date.toFormat('HH:mm:ss');

    if (pageDecoration)
        docDefinition.footer = function (currentPage, pageCount) {
            return {
                margin: [pageMargins[0], 0, pageMargins[2], 0],
                columns: [{
                    alignment: 'left',
                    text: `${dateString} ${timeString}`,
                }, {
                    alignment: 'right',
                    text: `${currentPage.toString()} of ${pageCount.toString()}`
                }]
            }
        };

    let fonts = {
        Roboto: {
            normal: `${fontsDirectory}/Roboto-Regular.ttf`,
            bold: `${fontsDirectory}/Roboto-Medium.ttf`,
            italics: `${fontsDirectory}/Roboto-Italic.ttf`,
            bolditalics: `${fontsDirectory}/Roboto-MediumItalic.ttf`
        }
    };
    const printer = new PdfPrinter(fonts);
    let pdfDoc = printer.createPdfKitDocument(docDefinition);
    getDoc(pdfDoc, cb);
}