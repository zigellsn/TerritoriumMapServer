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

'use strict';

import {v4 as uuidv4} from 'uuid';
import * as fs from 'fs';
import {createCanvas, Image} from 'canvas';
import {Margins, PageOrientation, PageSize} from 'pdfmake/interfaces';
import * as turf from '@turf/turf'
import PdfPrinter = require('pdfmake');

const mapnik = require('mapnik');

let fontsDirectory = process.env.FONT_DIRECTORY;
if (fontsDirectory === undefined || fontsDirectory === '')
    fontsDirectory = 'fonts';

let osmStyle = process.env.STYLE;
if (osmStyle === undefined || osmStyle === '')
    osmStyle = '/input/osm.xml';
else if (osmStyle === 'de')
    osmStyle = '/input/osm-de.xml';

export class RenderError extends Error {

    constructor(public message: string) {
        super(message);
        this.name = "RenderError";
        this.stack = (<any>new Error()).stack;
    }
}

export class Renderer {

    private srs = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over';
    private copyright = '© OpenStreetMap contributors';
    private merc

    constructor() {
        console.log(mapnik.versions);
        this.merc = new mapnik.Projection(this.srs);
        mapnik.register_system_fonts();
        mapnik.register_default_input_plugins();
    }

    private addCopyrightTextRaster(src, width, height) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.onerror = err => {
            throw err
        };
        img.src = src;
        ctx.font = '10px DejaVu Sans Book';
        let text = ctx.measureText(this.copyright);
        ctx.fillText(this.copyright, 10, height - text.emHeightAscent - 10);
        return canvas.toBuffer();
    }

    private addCopyrightTextVector(src, _width, height) {
        let len = src.length;
        return `${src.slice(0, len - 7)}<text fill="#0" font-size="10" font-family="sans-serif" x="10" y="${height - 32}"><tspan dy="18.2" x="10">${this.copyright}</tspan></text>${src.slice(len - 7, len)}`;
    }

    private addAdditionalLayers(m, layers, styles, inline) {

        m.fromStringSync(styles);

        let i = 0;
        //TODO: Merge layers with the same style
        for (const l of layers) {
            let ds = new mapnik.Datasource({
                type: 'geojson',
                inline: JSON.stringify(l['way'])
            });
            let layer = new mapnik.Layer(`border${i}`, this.srs);
            layer.datasource = ds;
            let styleName = 'names_style';
            layer.styles = [l['styleName']];
            m.add_layer(layer);
            i++;
        }

        let ds_names = new mapnik.Datasource({
            type: 'csv',
            inline: inline
        });
        let layer = new mapnik.Layer('names', this.srs);
        layer.datasource = ds_names;
        layer.styles = ['names_style'];
        m.add_layer(layer);
    }

    map(polygon) {

        function createLayers(polygon) {
            let layers = [];
            let globalStyle = '';
            if ('way' in polygon && polygon['way'] !== undefined) {
                if ('style' in polygon && polygon['style'] !== undefined) {
                    globalStyle = polygon['style']['name'];
                }
                layers.push({way: polygon['way'], name: polygon['name'], styleName: globalStyle});
            }
            if ('subpolygon' in polygon) {
                let subPolygons = polygon['subpolygon'];
                for (const layer of subPolygons) {
                    if ('way' in layer && layer['way'] !== undefined) {
                        let style = globalStyle;
                        if ('style' in layer && layer['style'] !== undefined) {
                            style = layer['style']['name'];
                        }
                        layers.push({way: layer['way'], name: layer['name'], styleName: style});
                    }
                }
            }
            return layers;
        }

        function createUniqueStyles(polygon) {
            let styles = [];
            if ('style' in polygon)
                styles.push(polygon['style']);
            if ('subpolygon' in polygon) {
                let subPolygons = polygon['subpolygon'];
                for (const layer of subPolygons) {
                    if ('style' in layer)
                        styles.push(layer['style'])
                }
            }
            return getUnique(styles, 'name');
        }

        function getUnique(arr, comp) {
            return arr
                .map(e => e[comp])
                .map((e, i, final) => final.indexOf(e) === i && i)
                .filter(e => arr[e]).map(e => arr[e]);
        }

        function getInline(layers) {
            let nameString = 'name,x,y\n';
            for (const layer of layers) {
                if (!('name' in layer))
                    continue;
                if ('visible' in layer['name'] && layer['name']['visible'] === false) {
                    continue;
                }
                if ('text' in layer['name']) {
                    if ('position' in layer['name'])
                        nameString += `"${layer['name']['text']}",${layer['name']['position'][0]},${layer['name']['position'][1]}\n`;
                    else {
                        if ('way' in layer) {
                            let centroid = turf.centroid(layer['way']);
                            nameString += `"${layer['name']['text']}",${centroid[0]},${centroid[1]}\n`;
                        }
                    }
                }
            }
            return nameString;
        }

        function createStyles(layers) {
            let s = '<Map>';
            let textSize = 0.0;
            for (const layer of layers) {
                s += `<Style name="${layer.name}">`;
                s += ` <Rule><LineSymbolizer stroke="${layer.color}" stroke-width="${layer.width}" stroke-opacity="${layer.opacity}"/></Rule>`;
                s += '</Style>';
                if ('size' in layer) {
                    textSize = layer['size'];
                }
            }
            if (textSize === 0.0)
                textSize = 12.0;
            s += '<Style name="names_style">';
            s += ' <Rule>';
            s += `  <TextSymbolizer face-name="DejaVu Sans Book" size="${textSize}" fill="white" halo-fill="black" halo-radius="2" horizontal-alignment="middle">[name]</TextSymbolizer>`;
            s += ' </Rule>';
            s += '</Style>';
            s += '</Map>';
            return s;
        }

        try {
            let layers = createLayers(polygon);
            let uniqueStyles = createUniqueStyles(polygon);
            let styles = createStyles(uniqueStyles);
            let inline = getInline(layers);

            let m = new mapnik.Map(polygon['size'][0], polygon['size'][1]);
            m.loadSync(osmStyle);
            m.zoomToBox(polygon['bbox']);
            this.addAdditionalLayers(m, layers, styles, inline);
            let src;
            if (polygon['mediaType'] === 'image/xml+svg') {
                if (!mapnik.supports.cairo) {
                    console.log('So sad... no Cairo');
                    return undefined;
                }
                let filename = uuidv4();
                m.renderFileSync(filename, {format: 'svg'});
                src = fs.readFileSync(filename);
                fs.unlinkSync(filename);
                src = this.addCopyrightTextVector(src, m.width, m.height);
            } else {
                src = m.renderSync({format: 'png'});
                src = this.addCopyrightTextRaster(src, m.width, m.height);
            }
            return src;
        } catch (e) {
            throw new RenderError(e.toString());
        }
    }

    buildPdf(polygon, buffer, cb) {

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

        let ppi = 72.0;
        let pageSize = 'A4';
        let pageOrientation = 'portrait'
        let pageMargins = [36, 36, 36, 36];
        if ('page' in polygon && polygon['page'] !== undefined) {
            if ('ppi' in polygon['page'] && polygon['page']['ppi'] !== undefined)
                ppi = polygon['page']['ppi'];
            if ('pageSize' in polygon['page'] && polygon['page']['pageSize'] !== undefined)
                pageSize = polygon['page']['pageSize'];
            if ('orientation' in polygon['page'] && polygon['page']['orientation'] !== undefined)
                pageOrientation = polygon['page']['orientation'];
            if ('margins' in polygon['page'] && polygon['page']['margins'] !== undefined)
                pageMargins = polygon['page']['margins'];
        }
        let docDefinition = {
            pageSize: pageSize as PageSize,
            pageOrientation: pageOrientation as PageOrientation,
            pageMargins: pageMargins as Margins,
            content: [
                polygon['name'],
                {
                    svg: buffer,
                    width: (polygon['size'][0] / ppi * 72.0),
                    options: {
                        assumePt: true,
                    }
                },
            ]
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
}
