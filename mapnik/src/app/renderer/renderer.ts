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

import {v4 as uuidv4} from 'uuid';
import * as fs from 'node:fs';
import {
    addCopyrightTextRaster,
    addCopyrightTextVector,
    createLayers,
    createStyles,
    createTextStyle,
    createUniqueStyles,
    generateWorldFile,
    getInline,
    mergeLayers
} from "./utils.ts";
import type {AbstractRenderer, Territorium} from "../index.d.ts";
import {parentPort} from "node:worker_threads";

import {LogLevel, Map, Mapnik} from './mapnik.ts';

let fontsDirectory = process.env.FONT_DIRECTORY ?? '';
if (fontsDirectory === '')
    fontsDirectory = '/input/fonts';

let pluginDirectory = process.env.MAPNIK_PLUGIN_DIRECTORY ?? '';

let osmStyle = process.env.STYLE ?? '';
if (osmStyle === '')
    osmStyle = '/input/osm.xml';
else if (osmStyle === 'de')
    osmStyle = '/input/osm-de.xml';

export class Renderer implements AbstractRenderer {

    private srs = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over';
    private mapnik = new Mapnik();

    constructor() {
        this.mapnik.setLogLevel(LogLevel.Error);
        this.mapnik.registerPluginDir(pluginDirectory);
        this.mapnik.registerDefaultFontDir();
        this.mapnik.registerFontDir(fontsDirectory, true);
        parentPort?.postMessage(this.mapnik.version());
    }

    private addAdditionalLayers(m: Map, layers: Array<Territorium.Layer>, inline: string) {

        let i = 0;

        for (const l of layers) {
            let ds = this.mapnik.Datasource.geojsonInline(JSON.stringify(l.way));
            let layer = this.mapnik.Layer(`border${i}`, this.srs);
            layer.setDatasource(ds);
            layer.addStyle(l.styleName);
            m.addLayer(layer);
            i++;
        }

        let ds_names = this.mapnik.Datasource.csvInline(inline);
        let layer = this.mapnik.Layer('names', this.srs);
        layer.setDatasource(ds_names);
        layer.addStyle('names_style');
        m.addLayer(layer);
    }

    async map(polygon: Territorium.Polygon): Promise<{
        map: string | Buffer<ArrayBufferLike>,
        worldFile: Buffer<ArrayBufferLike>
    }> {
        let layers = createLayers(polygon);
        let mergedLayers = mergeLayers(layers);
        let uniqueStyles = createUniqueStyles(polygon);
        let lineStyles = createStyles(uniqueStyles);
        let textStyles = createTextStyle(polygon);
        let inline = getInline(layers);
        let styles = `<Map>${lineStyles}${textStyles}</Map>`

        using map = this.mapnik.Map(polygon.size[0], polygon.size[1]);
        map.load(osmStyle);
        map.zoomToBox(polygon.bbox);
        map.loadString(styles);
        this.addAdditionalLayers(map, mergedLayers, inline);
        if (polygon.mediaType === 'image/svg+xml' || polygon.mediaType === 'application/pdf') {
            if (!this.mapnik.supports.cairo) {
                parentPort?.postMessage({error: true, message: 'So sad... no Cairo'});
                throw new Error('Cairo support missing');
            }

            let worldFile = generateWorldFile(map.extent, map.width, map.height);
            let result: string | Buffer;

            if (polygon.mediaType === 'image/svg+xml') {
                let svgString = map.renderSvgToString();
                svgString = addCopyrightTextVector(svgString, map.width, map.height);
                result = Buffer.from(svgString, 'utf-8');
            } else {
                const filename = `${uuidv4()}.pdf`;
                map.renderPdf(filename);
                result = fs.readFileSync(filename);
                fs.unlinkSync(filename);
            }
            return {map: result, worldFile: worldFile};
        } else {
            using im = this.mapnik.Image(map.width, map.height);
            map.render(im);
            let src = im.encode('png');
            if (src !== null) {
                src = await addCopyrightTextRaster(src, map.width, map.height);
            }
            let worldFile = generateWorldFile(map.extent, map.width, map.height);
            return {map: src!, worldFile: worldFile};
        }
    }
}
