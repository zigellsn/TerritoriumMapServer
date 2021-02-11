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
import PdfPrinter = require('pdfmake');

let fontsDirectory = process.env.FONT_DIRECTORY;
if (fontsDirectory === undefined || fontsDirectory === '')
    fontsDirectory = 'fonts';

export function buildPdf(page, buffers, cb) {

    function getDoc(pdfDoc, cb) {
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
    let pageOrientation = 'portrait'
    let pageMargins = [36, 36, 36, 36];
    let mediaType = 'image/png';
    let pageDecoration = true;
    if ('pageSize' in page && page['pageSize'] !== undefined)
        pageSize = page['pageSize'];
    if ('orientation' in page && page['orientation'] !== undefined)
        pageOrientation = page['orientation'];
    if ('margins' in page && page['margins'] !== undefined)
        pageMargins = page['margins'];
    if ('mediaType' in page && page['mediaType'] !== undefined)
        mediaType = page['mediaType'];
    if ('pageDecoration' in page && page['pageDecoration'] !== undefined)
        pageDecoration = page['pageDecoration'];

    let content = [];

    for (const buffer of buffers) {
        let ppi = 72.0;
        if ('ppi' in buffer && buffer['ppi'] !== undefined)
            ppi = buffer['ppi'];
        if (pageDecoration)
            content.push({text: buffer['name']})
        if (mediaType === 'image/xml+svg') {
            content.push({
                svg: buffer['buffer'],
                width: (buffer['size'][0] / ppi * 72.0),
                options: {
                    assumePt: true,
                }
            })
        } else {
            content.push({
                image: buffer['buffer'],
                width: (buffer['size'][0] / ppi * 72.0),
                options: {
                    assumePt: true,
                }
            })
        }
        content.push({text: '\n'})
    }

    if (content.length > 1)
        content.pop();

    let docDefinition: TDocumentDefinitions = {
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
                margin: pageMargins as Margins,
                height: 30,
                text: currentPage.toString() + ' of ' + pageCount + ' ' + dateString + ' ' + timeString
            };
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
    getDoc(pdfDoc, cb)
}