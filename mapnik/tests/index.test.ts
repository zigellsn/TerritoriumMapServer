/*
 * Copyright 2019-2024 Simon Zigelli
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

import {createLayers} from '../renderer/utils';
import {mergeLayers} from '../renderer/utils';
import {Territorium} from "../index";

let json = `{
  "name": {
    "text": "LE",
    "position": [
      1012733.7982249999,
      6231687.508946997
    ],
    "offset": [
      10,
      -3
    ]
  },
  "number": "123",
  "size": [
    1000,
    2000
  ],
  "bbox": [
    1012733.7982249999,
    6231687.508946997,
    1012600.660129,
    6231492.922499001
  ],
  "way": {
    "type": "LineString",
    "coordinates": [
      [
        1012733.7982249999,
        6231687.508946997
      ],
      [
        1012761.9620529999,
        6231567.172591001
      ],
      [
        1012645.4662189997,
        6231521.0863270005
      ],
      [
        1012600.660129,
        6231492.922499001
      ],
      [
        1012572.496301,
        6231466.038845
      ],
      [
        1012539.2117770001,
        6231404.590493002
      ],
      [
        1012518.7289929998,
        6231413.5517110005
      ],
      [
        1012503.366905,
        6231437.8750169985
      ],
      [
        1012503.366905,
        6231592.776070997
      ],
      [
        1012608.3411729999,
        6231636.301986998
      ],
      [
        1012733.7982249999,
        6231687.508946997
      ]
    ]
  },
  "mimeType": "image/png",
  "style": {
    "name": "Style 1",
    "color": "#FFA2A2",
    "opacity": 0.5,
    "width": 12
  },
  "subpolygon": [
    {
      "name": {
        "text": "L-Le-01",
        "position": [
          1012733.7982249999,
          6231687.508946997
        ],
        "offset": [
          10,
          -3
        ]
      },
      "way": {
        "type": "LineString",
        "coordinates": [
          [
            1012733.7982249999,
            6231687.508946997
          ],
          [
            1012761.9620529999,
            6231567.172591001
          ],
          [
            1012645.4662189997,
            6231521.0863270005
          ],
          [
            1012600.660129,
            6231492.922499001
          ],
          [
            1012572.496301,
            6231466.038845
          ],
          [
            1012539.2117770001,
            6231404.590493002
          ],
          [
            1012518.7289929998,
            6231413.5517110005
          ],
          [
            1012503.366905,
            6231437.8750169985
          ],
          [
            1012503.366905,
            6231592.776070997
          ],
          [
            1012608.3411729999,
            6231636.301986998
          ],
          [
            1012733.7982249999,
            6231687.508946997
          ]
        ]
      },
      "style": {
        "name": "Style 2",
        "color": "#FF002A",
        "opacity": 0.4,
        "width": 13
      }
    },
    {
      "name": {
        "text": "L-Le-02"
      },
      "way": {
        "type": "LineString",
        "coordinates": [
          [
            1012733.7982249999,
            6231687.508946997
          ],
          [
            1012761.9620529999,
            6231567.172591001
          ],
          [
            1012645.4662189997,
            6231521.0863270005
          ],
          [
            1012600.660129,
            6231492.922499001
          ],
          [
            1012572.496301,
            6231466.038845
          ],
          [
            1012539.2117770001,
            6231404.590493002
          ],
          [
            1012518.7289929998,
            6231413.5517110005
          ],
          [
            1012503.366905,
            6231437.8750169985
          ],
          [
            1012503.366905,
            6231592.776070997
          ],
          [
            1012608.3411729999,
            6231636.301986998
          ],
          [
            1012733.7982249999,
            6231687.508946997
          ]
        ]
      },
      "style": {
        "name": "Style 1",
        "color": "#FFA2A2",
        "opacity": 0.5,
        "width": 12
      }
    }
  ]
}`

describe('testing index file', () => {
    let polygon: Territorium.Polygon = JSON.parse(json);
    test('empty string should result in zero', () => {
        let layers = createLayers(polygon);
        expect(layers).not.toStrictEqual([]);
        let mergedLayers = mergeLayers(layers);
        expect(mergedLayers).not.toStrictEqual([]);
    });
});