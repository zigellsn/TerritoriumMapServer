/*
 * Copyright 2019-2023 Simon Zigelli
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
import * as fs from 'fs';
import {RenderError} from "./renderError";
import {
    addCopyrightTextRaster,
    addCopyrightTextVector,
    createLayers,
    createStyles,
    createTextStyle,
    createUniqueStyles,
    getInline
} from "./utils";
import {Territorium} from "../index";

const mapnik = require('mapnik');

let osmStyle = process.env.STYLE;
if (osmStyle === undefined || osmStyle === '')
    osmStyle = '/input/osm-de.xml';
else if (osmStyle === 'de')
    osmStyle = '/input/osm-de.xml';

export class Renderer {

    private srs = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over';

    constructor() {
        console.log(mapnik.versions);
        mapnik.register_system_fonts();
        mapnik.register_default_input_plugins();
    }

    private addAdditionalLayers(m, layers: Array<Territorium.Layer>, styles: string, inline: string) {

        m.fromStringSync(styles);

        let i = 0;
        //TODO: Merge layers with the same style
        for (const l of layers) {
            let ds = new mapnik.Datasource({
                type: 'geojson',
                inline: JSON.stringify(l.way)
            });
            let layer = new mapnik.Layer(`border${i}`, this.srs);
            layer.datasource = ds;
            layer.styles = [l.styleName];
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

    map(polygon: Territorium.Polygon): Buffer {
        try {
            let layers = createLayers(polygon);
            let uniqueStyles = createUniqueStyles(polygon);
            let lineStyles = createStyles(uniqueStyles);
            let textStyles = createTextStyle(polygon);
            let inline = getInline(layers);
            let styles = `<Map>${lineStyles}${textStyles}</Map>`

            let m = new mapnik.Map(polygon.size[0], polygon.size[1]);
            m.loadSync(osmStyle);
            m.zoomToBox(polygon.bbox);
            this.addAdditionalLayers(m, layers, styles, inline);
            let src;
            if (polygon.mediaType === 'image/svg+xml') {
                if (!mapnik.supports.cairo) {
                    console.log('So sad... no Cairo');
                    return undefined;
                }
                let filename = uuidv4();
                m.renderFileSync(filename, {format: 'svg'});
                src = fs.readFileSync(filename);
                fs.unlinkSync(filename);
                src = Buffer.from(addCopyrightTextVector(src, m.width, m.height), 'utf-8');
            } else {
                src = m.renderSync({format: 'PNG'});
                src = addCopyrightTextRaster(src, m.width, m.height);
            }
            return src;
        } catch (e) {
            throw new RenderError(e.toString());
        }
    }
}
