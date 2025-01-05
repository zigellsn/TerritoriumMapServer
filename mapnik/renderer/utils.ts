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

import {createCanvas, deregisterAllFonts, Image, registerFont} from "canvas";
import * as turf from "@turf/turf";
import {Territorium} from "../index";
import * as path from "node:path";

const copyright = '© OpenStreetMap contributors';

let fontsDirectory = process.env.FONT_DIRECTORY;
if (fontsDirectory === undefined || fontsDirectory === '')
    fontsDirectory = '/input/fonts';

export function addCopyrightTextRaster(src: Buffer, width: number, height: number, font_dir: string = fontsDirectory, font: string = 'NotoSans-Regular.ttf', family: string = 'NotoSans'): Buffer {
    registerFont(path.join(font_dir, font), {family: family});
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.onerror = err => {
        throw err
    };
    img.src = src;
    ctx.font = `10px ${family}`;
    let text = ctx.measureText(copyright);
    ctx.fillText(copyright, 10, height - text.actualBoundingBoxAscent);
    let buf = canvas.toBuffer();
    deregisterAllFonts();
    return buf;
}

export function addCopyrightTextVector(src: string, _width: number, height: number): string {
    let len = src.length;
    return `${src.slice(0, len - 7)}<text fill="#0" font-size="10" font-family="sans-serif" x="10" y="${height - 24}"><tspan dy="18.2" x="10">${copyright}</tspan></text>${src.slice(len - 7, len)}`;
}

export function createLayers(polygon: Territorium.Polygon): Array<Territorium.Layer> {
    let layers: Array<Territorium.Layer> = [];
    let globalStyle = 'defaultStyle';
    if (polygon.style !== undefined && polygon.style.name !== undefined) {
        if (polygon.style.name === 'defaultStyle') {
            globalStyle = '_defaultStyle_';
        } else {
            globalStyle = polygon.style.name;
        }
    }
    if (polygon.way !== undefined) {
        layers.push({way: polygon.way, name: polygon.name, styleName: globalStyle});
    }
    if (polygon.subpolygon !== undefined) {

        let subPolygons: Array<Territorium.SubPolygon> = []
        if (polygon.subpolygon instanceof Array)
            subPolygons = polygon.subpolygon;
        else
            subPolygons.push(polygon.subpolygon)

        for (const layer of subPolygons) {
            if (layer.way !== undefined) {
                let style = globalStyle;
                if (layer.style !== undefined && layer.style.name !== undefined) {
                    style = layer.style.name;
                }
                layers.push({way: layer.way, name: layer.name, styleName: style});
            }
        }
    }
    return layers;
}

export function mergeLayers(layers: Array<Territorium.Layer>): Array<any> {
    const mergedLayers: Map<String, Array<any>> = new Map();
    layers.map((layer, _) => {
        const key = layer.styleName;
        if (!mergedLayers.has(key))
            if (layer.way.type === 'GeometryCollection') {
                mergedLayers.set(key, layer.way.geometries);
            } else {
                mergedLayers.set(key, [layer.way]);
            }
        else {
            if (layer.way.type === 'GeometryCollection') {
                for (const geometry of layer.way.geometries) {
                    mergedLayers.get(key).push(geometry);
                }
            } else {
                mergedLayers.get(key).push(layer.way);
            }
        }
    });
    const mergedLayersCollection: Map<String, any> = new Map();
    mergedLayers.forEach((value: Array<any>, new_key: String) => {
        mergedLayersCollection.set(new_key, {
            way: turf.featureCollection([turf.geometryCollection(value)]),
            name: new_key,
            styleName: new_key
        });
    });
    return Array.from(mergedLayersCollection.values());
}

export function createUniqueStyles(polygon: Territorium.Polygon): Array<Territorium.Style> {
    let styles: Array<Territorium.Style> = [];
    if (polygon.style !== undefined)
        styles.push(polygon.style);
    if (polygon.subpolygon !== undefined) {

        let subPolygons: Array<Territorium.SubPolygon> = []
        if (polygon.subpolygon instanceof Array)
            subPolygons = polygon.subpolygon;
        else
            subPolygons.push(polygon.subpolygon)

        for (const layer of subPolygons) {
            if (layer.style !== undefined)
                styles.push(layer.style)
        }
    }
    return getUnique(styles, 'name');
}

function getUnique(arr: Array<Territorium.Style>, comp: string): Array<Territorium.Style> {
    return arr
        .map(e => e[comp])
        .map((e, i, final) => final.indexOf(e) === i && i)
        .filter(e => arr[e]).map(e => arr[e]);
}

export function createStyles(styles: Array<Territorium.Style>): string {
    let s = '';
    for (const style of styles) {
        let name = style.name;
        if (name === 'defaultStyle')
            name = '_defaultStyle_';
        s += `<Style name="${name}">`;
        s += ` <Rule><LineSymbolizer stroke="${style.color}" stroke-width="${style.width}" stroke-opacity="${style.opacity}"/></Rule>`;
        s += '</Style>';
    }
    if (s.length == 0) {
        s += '<Style name="defaultStyle">';
        s += ` <Rule><LineSymbolizer stroke="#FF0000" stroke-width="6" stroke-opacity="0.33"/></Rule>`;
        s += '</Style>';
    }
    return s;
}

export function createTextStyle(polygon: Territorium.Polygon): string {
    let s = '';
    let textSize = 12.0;
    let fontName = 'DejaVu Sans Book';
    let fontColor = 'white';

    if (polygon.name === undefined)
        return '';

    if (polygon.name.size !== undefined)
        textSize = polygon.name.size
    if (polygon.name.size !== undefined)
        fontName = polygon.name.fontName
    if (polygon.name.size !== undefined)
        fontColor = polygon.name.color

    s += '<Style name="names_style">';
    s += ' <Rule>';
    s += `  <TextSymbolizer face-name="${fontName}" size="${textSize}" fill="${fontColor}" halo-fill="black" halo-radius="${textSize * 0.1}" horizontal-alignment="middle">[name]</TextSymbolizer>`;
    s += ' </Rule>';
    s += '</Style>';
    return s;
}

export function getInline(layers: Array<Territorium.Layer>): string {
    let nameString = 'name,x,y\n';
    for (const layer of layers) {
        if (layer.name === undefined)
            continue;
        if (layer.name.visible === undefined || layer.name.visible === false) {
            continue;
        }
        if (layer.name.text !== undefined) {
            if (layer.name.position !== undefined)
                nameString += `"${layer.name.text}",${layer.name.position[0]},${layer.name.position[1]}\n`;
            else {
                if (layer.way !== undefined) {
                    let centroid = turf.centroid(layer.way);
                    nameString += `"${layer.name.text}",${centroid.geometry.coordinates[0]},${centroid.geometry.coordinates[1]}\n`;
                }
            }
        }
    }
    return nameString;
}