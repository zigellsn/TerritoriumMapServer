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

import {createCanvas, Image} from "canvas";
import * as turf from "@turf/turf";

const copyright = '© OpenStreetMap contributors';

export function addCopyrightTextRaster(src: Buffer, width: number, height: number): Buffer {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.onerror = err => {
        throw err
    };
    img.src = src;
    ctx.font = '10px DejaVu Sans Book';
    let text = ctx.measureText(copyright);
    ctx.fillText(copyright, 10, height - text.emHeightAscent);
    return canvas.toBuffer();
}

export function addCopyrightTextVector(src: string, _width: number, height: number): string {
    let len = src.length;
    return `${src.slice(0, len - 7)}<text fill="#0" font-size="10" font-family="sans-serif" x="10" y="${height - 24}"><tspan dy="18.2" x="10">${copyright}</tspan></text>${src.slice(len - 7, len)}`;
}

export function createLayers(polygon): Array<any> {
    let layers = [];
    let globalStyle = 'defaultStyle';
    if ('style' in polygon && polygon['style'] !== undefined) {
        if (polygon['style']['name'] === 'defaultStyle') {
            globalStyle = '_defaultStyle_';
        } else {
            globalStyle = polygon['style']['name'];
        }
    }
    if ('way' in polygon && polygon['way'] !== undefined) {
        layers.push({way: polygon['way'], name: polygon['name'], styleName: globalStyle});
    }
    if ('subpolygon' in polygon && polygon['subpolygon'] !== undefined) {
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

export function createUniqueStyles(polygon): Array<any> {
    let styles = [];
    if ('style' in polygon && polygon['style'] !== undefined)
        styles.push(polygon['style']);
    if ('subpolygon' in polygon && polygon['subpolygon'] !== undefined) {
        let subPolygons = polygon['subpolygon'];
        for (const layer of subPolygons) {
            if ('style' in layer && layer['style'] !== undefined)
                styles.push(layer['style'])
        }
    }
    return getUnique(styles, 'name');
}

function getUnique(arr: Array<any>, comp: string): Array<any> {
    return arr
        .map(e => e[comp])
        .map((e, i, final) => final.indexOf(e) === i && i)
        .filter(e => arr[e]).map(e => arr[e]);
}

export function createStyles(styles: Array<any>): string {
    let s = '<Map>';
    let textSize = 0.0;
    for (const style of styles) {
        let name = style.name;
        if (name === 'defaultStyle')
            name = '_defaultStyle_';
        s += `<Style name="${name}">`;
        s += ` <Rule><LineSymbolizer stroke="${style.color}" stroke-width="${style.width}" stroke-opacity="${style.opacity}"/></Rule>`;
        s += '</Style>';
        if ('size' in style && style['size'] !== undefined) {
            textSize = style['size'];
        }
    }
    if (s.length == 0) {
        s += '<Style name="defaultStyle">';
        s += ` <Rule><LineSymbolizer stroke="#FF0000" stroke-width="6" stroke-opacity="0.33"/></Rule>`;
        s += '</Style>';
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

export function getInline(layers: Array<any>): string {
    let nameString = 'name,x,y\n';
    for (const layer of layers) {
        if (!('name' in layer || layer['name'] === undefined))
            continue;
        if ('visible' in layer['name'] && layer['name']['visible'] !== undefined && layer['name']['visible'] === false) {
            continue;
        }
        if ('text' in layer['name'] && layer['name']['text'] !== undefined) {
            if ('position' in layer['name'] && layer['name']['position'] !== undefined)
                nameString += `"${layer['name']['text']}",${layer['name']['position'][0]},${layer['name']['position'][1]}\n`;
            else {
                if ('way' in layer && layer['way'] !== undefined) {
                    let centroid = turf.centroid(layer['way']);
                    nameString += `"${layer['name']['text']}",${centroid.geometry.coordinates[0]},${centroid.geometry.coordinates[1]}\n`;
                }
            }
        }
    }
    return nameString;
}