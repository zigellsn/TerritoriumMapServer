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

import {Margins, PageOrientation, PageSize, TDocumentDefinitions} from "pdfmake/interfaces";
import {DateTime} from 'luxon';
import {Territorium} from "../index";

let pdfmake = require('pdfmake');

let fontsDirectory = process.env.FONT_DIRECTORY;
if (fontsDirectory === undefined || fontsDirectory === '')
    fontsDirectory = '/input/fonts';

// From pdfmake/js/standardPageSizes.js
const standardPageSizes = {
    '4A0': [4767.87, 6740.79],
    '2A0': [3370.39, 4767.87],
    A0: [2383.94, 3370.39],
    A1: [1683.78, 2383.94],
    A2: [1190.55, 1683.78],
    A3: [841.89, 1190.55],
    A4: [595.28, 841.89],
    A5: [419.53, 595.28],
    A6: [297.64, 419.53],
    A7: [209.76, 297.64],
    A8: [147.40, 209.76],
    A9: [104.88, 147.40],
    A10: [73.70, 104.88],
    B0: [2834.65, 4008.19],
    B1: [2004.09, 2834.65],
    B2: [1417.32, 2004.09],
    B3: [1000.63, 1417.32],
    B4: [708.66, 1000.63],
    B5: [498.90, 708.66],
    B6: [354.33, 498.90],
    B7: [249.45, 354.33],
    B8: [175.75, 249.45],
    B9: [124.72, 175.75],
    B10: [87.87, 124.72],
    C0: [2599.37, 3676.54],
    C1: [1836.85, 2599.37],
    C2: [1298.27, 1836.85],
    C3: [918.43, 1298.27],
    C4: [649.13, 918.43],
    C5: [459.21, 649.13],
    C6: [323.15, 459.21],
    C7: [229.61, 323.15],
    C8: [161.57, 229.61],
    C9: [113.39, 161.57],
    C10: [79.37, 113.39],
    RA0: [2437.80, 3458.27],
    RA1: [1729.13, 2437.80],
    RA2: [1218.90, 1729.13],
    RA3: [864.57, 1218.90],
    RA4: [609.45, 864.57],
    SRA0: [2551.18, 3628.35],
    SRA1: [1814.17, 2551.18],
    SRA2: [1275.59, 1814.17],
    SRA3: [907.09, 1275.59],
    SRA4: [637.80, 907.09],
    EXECUTIVE: [521.86, 756.00],
    FOLIO: [612.00, 936.00],
    LEGAL: [612.00, 1008.00],
    LETTER: [612.00, 792.00],
    TABLOID: [792.00, 1224.00]
}

export function buildPdf(page: Territorium.Page, buffers: Array<Territorium.ResultBuffer>, cb: (...args: any[]) => void) {

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
    let name: { text: string; };
    let keywords = '';

    let pageMeasure = standardPageSizes[pageSize];
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
        defaultStyle: {
            font: 'NotoSans'
        },
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
        NotoSans: {
            normal: `${fontsDirectory}/NotoSans-Regular.ttf`,
            bold: `${fontsDirectory}/NotoSans-Bold.ttf`,
            italics: `${fontsDirectory}/NotoSans-Italic.ttf`,
            bolditalics: `${fontsDirectory}/NotoSans-Bold.ttf`
        }
    };

    pdfmake.setFonts(fonts);
    pdfmake.createPdf(docDefinition).getBuffer().then((buffer: any) => {
        cb(buffer);
    }, (err: any) => {
        console.error(err);
    });
}