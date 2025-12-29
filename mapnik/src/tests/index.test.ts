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

import {createLayers, getInline, mergeLayers} from '../app/renderer/utils.ts';
import type {Territorium} from "../app";
import {Renderer as MockRenderer} from "../app/renderer/mockRenderer.ts";
import {existsSync} from "node:fs";
import {describe, expect, test} from "bun:test";
import {resolve} from "node:path";
import {rm} from "node:fs/promises";
import {Mapnik} from "../app/renderer/mapnik.ts";

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
            },
            "generateWorldfile": true
        }`

let page: Territorium.Page = {
    'name': 'Congregation',
    'physicalSize': undefined,
    'mediaType': 'application/pdf',
    'pageSize': 'A4',
    'ppi': 72.0,
    'margins': [36.0, 36.0, 36.0, 36.0],
    'orientation': 'portrait',
    'pageDecoration': true
};

describe('testing mergeLayers', () => {
    let polygon: Territorium.Polygon = JSON.parse(json);
    test('empty string should result in zero', () => {
        let layers = createLayers(polygon);
        expect(layers).not.toStrictEqual([]);
        let mergedLayers = mergeLayers(layers);
        expect(mergedLayers).not.toStrictEqual([]);
        mergedLayers.forEach((layer) => {
            let way = JSON.stringify(layer.way)
            expect(way).not.toStrictEqual('');
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
        expect(inline).toStrictEqual('name,x,y\n"L-Ec-01",1020156.2470770002,6224111.105256565\n');
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

/* describe('testing buildPdf', () => {
    test('empty string should result in zero', async () => {
        let images: Array<Territorium.ResultBuffer> = [];
        let svgBuffer = Buffer.from(addCopyrightTextVector('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-52 -53 100 100" stroke-width="2">\n' +
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
            '</svg>\n', 30, 30), 'utf-8');
        // svgBuffer = fs.readFileSync('tests/complex_test.pdf')
        images.push({
            name: 'Territory 1', fileName: 'fileName', buffer: svgBuffer, worldFile: '123', message: '',
            size: [510, 265], mediaType: 'image/svg+xml', ppi: 72.0
        });
        images.push({
            name: 'Territory 2', fileName: 'fileName', buffer: svgBuffer, worldFile: '321', message: '',
            size: [510, 265], mediaType: 'image/svg+xml', ppi: 72.0
        });
        let buffer = await buildPdf(page, images);
        let pdfDocuments: Array<Territorium.ResultBuffer> = [{
            fileName: `map_test.pdf`,
            buffer: buffer,
            worldFile: undefined,
            message: '',
            mediaType: 'application/pdf',
            name: undefined,
            ppi: undefined,
            size: undefined
        }];
        expect(pdfDocuments).not.toStrictEqual('');
        for (const pdfDocument of pdfDocuments) {
            fs.writeFile(pdfDocument.fileName, pdfDocument.buffer, err => {
                if (err) {
                    console.error(err);
                }
            });
        }
    });
});*/

const WIDTH = 64;
const HEIGHT = 64;

const cwd = process.cwd();
const dataDir = resolve(cwd, ".");

const pluginsDir = "/usr/local/lib/mapnik/input/";
const xmlPath = resolve(dataDir, "stylesheet.xml");
const shpPath = resolve(dataDir, "ne_110m_admin_0_countries.shp");

const hasPluginsDir = existsSync(pluginsDir);
const hasXml = existsSync(xmlPath);
const hasShp = existsSync(shpPath);

const canRunIntegration = hasPluginsDir && hasXml && hasShp;

function integrationTest(name: string, fn: Parameters<typeof test>[1]) {
    if (canRunIntegration) test(name, fn);
    else test.skip(`${name} (skipped: missing pluginsDir/xml/shp)`, fn);
}

async function getXml(): Promise<string> {
    return Bun.file(xmlPath).text();
}

function makeLargeXml(baseXml: string, targetBytes: number): string {
    const prefix = `<!-- prefix start -->\n`;
    const suffix = `\n<!-- suffix end -->`;

    const padUnit = "X".repeat(1024); // 1KB
    const perChunk = `\n<!-- ${padUnit} -->`; // ~1KB + Overhead

    let xml = `${prefix}${baseXml}${suffix}`;
    while (xml.length < targetBytes) {
        xml = `${prefix}${perChunk}${baseXml}${perChunk}${suffix}`;
        while (xml.length < targetBytes) {
            xml = `${prefix}${perChunk}${xml}${perChunk}${suffix}`;
        }
    }
    return xml;
}

describe("Mapnik FFI wrapper", () => {
    integrationTest("registerPluginDir does not throw", () => {
        const mapnik = new Mapnik();
        expect(() => mapnik.registerPluginDir(pluginsDir)).not.toThrow();
    });

    integrationTest("Map.loadString(xml, basePath) succeeds for valid stylesheet.xml", async () => {
        const mapnik = new Mapnik();
        mapnik.registerPluginDir(pluginsDir);

        using map = mapnik.Map(WIDTH, HEIGHT);

        const xml = await getXml();
        expect(() => map.loadString(xml, dataDir)).not.toThrow();
    });

    integrationTest("Map.loadString throws for invalid XML (clean error)", () => {
        const mapnik = new Mapnik();
        mapnik.registerPluginDir(pluginsDir);

        using map = mapnik.Map(WIDTH, HEIGHT);

        const badXml = `<Map><Layer></Map>`; // absichtlich kaputt
        expect(() => map.loadString(badXml, dataDir)).toThrow(/map_load_string/i);
    });

    integrationTest("Map.loadString throws if basePath is wrong (relative datasource can't be resolved)", async () => {
        const mapnik = new Mapnik();
        mapnik.registerPluginDir(pluginsDir);

        using map = mapnik.Map(WIDTH, HEIGHT);

        const xml = await getXml();
        const wrongBase = resolve(dataDir, "__definitely_not_existing__");

        expect(() => map.loadString(xml, wrongBase)).toThrow(/map_load_string/i);
    });

    integrationTest("Render pipeline creates a non-empty PNG and cleans it up", async () => {
        const mapnik = new Mapnik();
        mapnik.registerPluginDir(pluginsDir);

        using map = mapnik.Map(WIDTH, HEIGHT);
        using image = mapnik.Image(WIDTH, HEIGHT);

        const xml = await getXml();
        map.loadString(xml, dataDir);

        map.zoomAll();
        map.render(image);

        const outPath = resolve(dataDir, "tmp_test_output.png");

        try {
            image.save(outPath, "png");

            const stat = await Bun.file(outPath).stat();
            expect(stat.size).toBeGreaterThan(0);
        } finally {
            await rm(outPath, {force: true});
        }
    });

    integrationTest("Stress: loadString handles multi-megabyte XML input", async () => {
        const mapnik = new Mapnik();
        mapnik.registerPluginDir(pluginsDir);

        using map = mapnik.Map(WIDTH, HEIGHT);

        const baseXml = await getXml();

        // Zielgröße: ~5 MB (kannst du hoch/runter drehen)
        const largeXml = makeLargeXml(baseXml, 5 * 1024 * 1024);

        expect(largeXml.length).toBeGreaterThan(4 * 1024 * 1024);

        expect(() => map.loadString(largeXml, dataDir)).not.toThrow();

        // Optional: ein weiterer Call, um sicherzustellen, dass Mapnik nicht "in einem komischen Zustand" ist
        expect(() => map.zoomAll()).not.toThrow();
    });

    integrationTest("Stress: repeated loadString calls (stability / lifetime)", async () => {
        const mapnik = new Mapnik();
        mapnik.registerPluginDir(pluginsDir);

        const baseXml = await getXml();

        // nicht zu hoch anfangen; wenn stabil, kannst du auf 500/1000 erhöhen
        const ITERATIONS = 200;

        for (let i = 0; i < ITERATIONS; i++) {
            using map = mapnik.Map(WIDTH, HEIGHT);

            expect(() => map.loadString(baseXml, dataDir)).not.toThrow();

            // alle 25 Iterationen ein extra native call
            if (i % 25 === 0) {
                expect(() => map.zoomAll()).not.toThrow();
            }
        }
    });

    integrationTest("Stress: repeated loadString + render (heavier)", async () => {
        const mapnik = new Mapnik();
        mapnik.registerPluginDir(pluginsDir);

        const baseXml = await getXml();

        const ITERATIONS = 50;

        for (let i = 0; i < ITERATIONS; i++) {
            using map = mapnik.Map(WIDTH, HEIGHT);
            using image = mapnik.Image(WIDTH, HEIGHT);

            expect(() => map.loadString(baseXml, dataDir)).not.toThrow();
            expect(() => map.zoomAll()).not.toThrow();
            expect(() => map.render(image)).not.toThrow();
            // kein savePng hier, um IO rauszuhalten
        }
    });

    integrationTest("Render SVG creates a non-empty file", async () => {
        const mapnik = new Mapnik();
        mapnik.registerPluginDir(pluginsDir);

        using map = mapnik.Map(WIDTH, HEIGHT);

        const xml = await getXml();
        map.loadString(xml, dataDir);
        map.zoomAll();

        const outSvg = resolve(dataDir, "tmp_test_output.svg");
        try {
            map.renderSvg(outSvg);
            const stat = await Bun.file(outSvg).stat();
            expect(stat.size).toBeGreaterThan(0);
        } finally {
            await rm(outSvg, {force: true});
        }
    });

    integrationTest("Render PDF (vector) creates a non-empty file (skips if Cairo missing)", async () => {
        const mapnik = new Mapnik();
        mapnik.registerPluginDir(pluginsDir);

        using map = mapnik.Map(WIDTH, HEIGHT);

        const xml = await getXml();
        map.loadString(xml, dataDir);
        map.zoomAll();

        const outPdf = resolve(dataDir, "tmp_test_output.pdf");
        try {
            try {
                map.renderPdf(outPdf);
            } catch (e) {
                const msg = String(e);
                if (msg.includes("built without Cairo") || msg.includes("MAPNIK_USE_CAIRO")) {
                    test.skip("cairo", () => undefined);
                    console.warn(
                        "Skipping PDF rendering test because Cairo is not available. " +
                        "If you have Cairo installed, you can run this test again with MAPNIK_USE_CAIRO=1."
                    )
                    return;
                }
                throw e;
            }

            const stat = await Bun.file(outPdf).stat();
            expect(stat.size).toBeGreaterThan(0);
        } finally {
            await rm(outPdf, {force: true});
        }
    });

    integrationTest("renderSvgToString returns SVG markup", async () => {
        const mapnik = new Mapnik();
        mapnik.registerPluginDir(pluginsDir);

        using map = mapnik.Map(WIDTH, HEIGHT);

        const xml = await getXml();
        map.loadString(xml, dataDir);
        map.zoomAll();

        const svg = map.renderSvgToString();

        expect(typeof svg).toBe("string");
        expect(svg.length).toBeGreaterThan(100);

        // very lightweight sanity checks
        expect(svg).toMatch(/<svg\b/i);
        expect(svg).toMatch(/<\/svg>/i);
        expect(svg).toMatch(/viewBox=|width=|height=/i);
    });

    test("Smoke: creating Map and Image should not throw (no plugins needed)", () => {
        const mapnik = new Mapnik();
        using map = mapnik.Map(1, 1);
        using image = mapnik.Image(1, 1);

        expect(map.isDisposed).toBe(false);
        expect(image.isDisposed).toBe(false);
    });
});
