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

import {createLayers, createStyles, createTextStyle, createUniqueStyles, getInline} from "./utils";
import {Territorium} from "../index";

// @ts-ignore
import fs from "node:fs";

import path = require('path');

export class Renderer {
    constructor() {
        console.log('Ready');
    }

    map(polygon: Territorium.Polygon): Buffer {
        let layers = createLayers(polygon);
        let uniqueStyles = createUniqueStyles(polygon);
        let lineStyles = createStyles(uniqueStyles);
        let textStyles = createTextStyle(polygon);
        let inline = getInline(layers);
        let styles = `<Map>${lineStyles}${textStyles}</Map>`
        console.log(layers);
        console.log(uniqueStyles);
        console.log(styles);
        console.log(inline);

        if (polygon.mediaType === 'image/svg+xml')
            return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-52 -53 100 100" stroke-width="2">\n' +
                ' <g fill="none">\n' +
                '  <ellipse stroke="#66899a" rx="6" ry="44"/>\n' +
                '  <ellipse stroke="#e1d85d" rx="6" ry="44" transform="rotate(-66)"/>\n' +
                '  <ellipse stroke="#80a3cf" rx="6" ry="44" transform="rotate(66)"/>\n' +
                '  <circle  stroke="#4b541f" r="44"/>\n' +
                ' </g>\n' +
                ' <g fill="#66899a" stroke="white">\n' +
                '  <circle fill="#80a3cf" r="13"/>\n' +
                '  <circle cy="-44" r="9"/>\n' +
                '  <circle cx="-40" cy="18" r="9"/>\n' +
                '  <circle cx="40" cy="18" r="9"/>\n' +
                ' </g>\n' +
                '</svg>\n', 'utf-8');
        else
            return fs.readFileSync(path.resolve(__dirname, 'testmap.png'));
    }
}