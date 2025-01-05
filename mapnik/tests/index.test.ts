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

import {createLayers, getInline} from '../renderer/utils';
import {mergeLayers} from '../renderer/utils';
import {Territorium} from "../index";
import {Renderer as MockRenderer} from "../renderer/mockRenderer";

let json = `
        {
            "name": {
                "text": "L-Ec-01",
                "fontName": "DejaVu Sans Book",
                "size": 9.0,
                "offset": [
                    0,
                    0
                ],
                "color": "#FFFFFF",
                "visible": true
            },
            "number": "0",
            "size": [
                510,
                265
            ],
            "bbox": [
                1019432.2374216177,
                6223128.022675579,
                1020595.5984580765,
                6225183.726316212
            ],
            "way": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [
                                    1019724.8284389998,
                                    6223234.520024998
                                ],
                                [
                                    1019898.9321029999,
                                    6223248.601938999
                                ],
                                [
                                    1020067.9150709999,
                                    6223261.403679
                                ],
                                [
                                    1020281.7041290001,
                                    6223269.084722999
                                ],
                                [
                                    1020304.747261,
                                    6223269.084722999
                                ],
                                [
                                    1020489.0923169999,
                                    6223284.446811001
                                ],
                                [
                                    1020462.2086629999,
                                    6223514.878131
                                ],
                                [
                                    1020440.4457049997,
                                    6223718.425797
                                ],
                                [
                                    1020418.6827469999,
                                    6223861.805285002
                                ],
                                [
                                    1020394.359441,
                                    6224035.908948998
                                ],
                                [
                                    1020340.592133,
                                    6224180.568611
                                ],
                                [
                                    1020311.148131,
                                    6224332.909316998
                                ],
                                [
                                    1020317.5490009999,
                                    6224549.258723
                                ],
                                [
                                    1020336.7516109998,
                                    6224656.793338998
                                ],
                                [
                                    1020335.4714369999,
                                    6224760.487433
                                ],
                                [
                                    1020312.428305,
                                    6224830.897003001
                                ],
                                [
                                    1020295.7860429998,
                                    6224884.664311
                                ],
                                [
                                    1020138.3246409999,
                                    6225012.681711
                                ],
                                [
                                    1019966.781325,
                                    6225054.927452998
                                ],
                                [
                                    1019874.6087970001,
                                    6225076.690410999
                                ],
                                [
                                    1019539.2032089998,
                                    6225070.2895410005
                                ],
                                [
                                    1019636.4964330001,
                                    6224035.908948998
                                ],
                                [
                                    1019705.6258289999,
                                    6223411.184036997
                                ],
                                [
                                    1019724.8284389998,
                                    6223234.520024998
                                ]
                            ]
                        ]
            },
            "mediaType": "image/png",
            "style": {
                "name": "Rot 12pt",
                "color": "#FF0000",
                "opacity": 0.3137255,
                "width": 12.0,
                "ppi": 96.0
            }
        }`

describe('testing mergeLayers', () => {
    let polygon: Territorium.Polygon = JSON.parse(json);
    test('empty string should result in zero', () => {
        let layers = createLayers(polygon);
        expect(layers).not.toStrictEqual([]);
        let mergedLayers = mergeLayers(layers);
        expect(mergedLayers).not.toStrictEqual([]);
        mergedLayers.forEach((layer) => {
            expect(layer.way.type).toStrictEqual('FeatureCollection');
        })
    });
});

describe('testing getInline', () => {
    let polygon: Territorium.Polygon = JSON.parse(json);
    test('empty string should result in zero', () => {
        let layers = createLayers(polygon);
        expect(layers).not.toStrictEqual([]);
        let inline = getInline(layers);
        expect(inline).toStrictEqual('name,x,y\n"L-Ec-01",1020156.2470770002,6224111.105256565');
    });
});

describe('testing mockRenderer', () => {
    let polygon: Territorium.Polygon = JSON.parse(json);
    test('empty string should result in zero', () => {
        let renderer = new MockRenderer();
        let result = renderer.map(polygon);
        expect(result).not.toStrictEqual('');
    });
});