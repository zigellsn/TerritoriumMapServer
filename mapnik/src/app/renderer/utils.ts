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

import * as turf from "@turf/turf";
import type {Territorium} from "../index.d.ts";
import sharp from "sharp";

const COPYRIGHT_TEXT = '© OpenStreetMap contributors';

let fontsDirectory = process.env.FONT_DIRECTORY;
if (fontsDirectory === undefined || fontsDirectory === '')
    fontsDirectory = '/input/fonts';

export async function addCopyrightTextRaster(src: string | Buffer<ArrayBufferLike>, width: number, height: number, font_dir: string = fontsDirectory!, font: string = 'NotoSans-Regular.ttf', family: string = 'NotoSans'): Promise<Buffer> {
    const fontSize = 8;
    const margin = 10;

    const svgOverlay = Buffer.from(`
        <svg width="${width}" height="${height}">
            <style>
                .attr { 
                    fill: rgba(0, 0, 0, 0.6); 
                    font-family: ${family}; 
                    font-size: ${fontSize} px; 
                    font-weight: bold;
                }
                .bg {
                    fill: rgba(255, 255, 255, 0.4);
                }
            </style>
            <text x="${margin}" y="${height - margin}" class="attr">${COPYRIGHT_TEXT}</text>
        </svg>
    `);

    return sharp(src)
        .composite([{ input: svgOverlay, top: 0, left: 0 }])
        .png()
        .toBuffer();
}

export function addCopyrightTextVector(src: string | Buffer<ArrayBufferLike>, _width: number, height: number): string {
    let len = src.length;
    return `${src.slice(0, len - 7)}<text fill="#0" font-size="10" font-family="sans-serif" x="10" y="${height - 24}"><tspan dy="18.2" x="10">${COPYRIGHT_TEXT}</tspan></text>${src.slice(len - 7, len)}`;
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
        layers.push({way: polygon.way, projection: polygon.projection, name: polygon.name, styleName: globalStyle});
    }

    if (polygon.subpolygon !== null && polygon.subpolygon !== undefined) {

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
                layers.push({way: layer.way, projection: polygon.projection, name: layer.name, styleName: style});
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
                    if (mergedLayers.get(key) !== undefined)
                        mergedLayers.get(key)!.push(geometry);
                }
            } else {
                if (mergedLayers.get(key) !== undefined)
                    mergedLayers.get(key)!.push(layer.way);
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
    if (polygon.subpolygon !== undefined && polygon.subpolygon !== null) {

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

function getUnique(arr: Array<Territorium.Style>, comp: keyof Territorium.Style): Array<Territorium.Style> {
    const seen = new Set();
    return arr.filter(item => {
        const val = item[comp];
        if (seen.has(val)) {
            return false;
        }
        seen.add(val);
        return true;
    });
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
    if (polygon.name.fontName !== undefined)
        fontName = polygon.name.fontName
    if (polygon.name.color !== undefined)
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
        if (layer.name.visible === undefined || !layer.name.visible) {
            continue;
        }
        if (layer.name.text !== undefined) {
            if (layer.name.position !== undefined && layer.name.position !== null)
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

export function generateWorldFile(bbox: number[], m_width: number, m_height: number): Buffer<ArrayBufferLike> {
    if (bbox === undefined || bbox.length !== 4)
        throw new Error('bbox must be an array of length 4');

    const pixel_x_size = (bbox[2]! - bbox[0]!) / m_width;
    const pixel_y_size = (bbox[3]! - bbox[1]!) / m_height;
    const left_pixel_center_x = bbox[0]! + pixel_x_size * 0.5;
    const top_pixel_center_y = bbox[3]! - pixel_y_size * 0.5;

    return Buffer.from([
        pixel_x_size,
        0.0,
        0.0,
        -pixel_y_size,
        left_pixel_center_x,
        top_pixel_center_y
    ].map(n => n.toFixed(8)).join('\n') + '\n', 'utf-8');
}
