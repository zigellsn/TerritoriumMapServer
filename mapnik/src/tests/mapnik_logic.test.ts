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

import {Mapnik} from "../app/renderer/mapnik.ts";
import {describe, expect, test} from "bun:test";

describe("Mapnik Core Logic & Metadata", () => {
    const mapnik = new Mapnik();

    test("version should return a valid positive number", () => {
        const version = mapnik.version();
        expect(version).toBeGreaterThan(0);
    });

    test("Map geometry properties (width/height) should match constructor", () => {
        const W = 512, H = 256;
        using map = mapnik.Map(W, H);
        expect(map.width).toBe(W);
        expect(map.height).toBe(H);
    });

    test("initial map extent should return a valid numeric array", () => {
        using map = mapnik.Map(100, 100);
        const extent = map.extent;
        expect(extent).toBeArrayOfSize(4);
        expect(extent.every(_ => true)).toBe(true);
    });

    test("zoomToBox should update the map extent", () => {
        using map = mapnik.Map(100, 100);
        const targetBBox = { minx: 0, miny: 0, maxx: 1000, maxy: 1000 };
        map.zoomToBox(targetBBox);

        const current = map.extent;
        expect(current[0]).toBeCloseTo(0);
        expect(current[2]).toBeCloseTo(1000);
    });
});

describe("In-Memory Rendering & Encoding", () => {
    const mapnik = new Mapnik();

    test("image encoding (PNG) should produce a valid header", () => {
        using im = mapnik.Image(10, 10);
        // We encode a blank transparent image
        const buffer = im.encode("png");

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer!.length).toBeGreaterThan(0);

        // PNG Magic Number Check: 89 50 4E 47 0D 0A 1A 0A
        expect(buffer![0]).toBe(0x89);
        expect(buffer![1]).toBe(0x50); // 'P'
        expect(buffer![2]).toBe(0x4E); // 'N'
    });

    test("SVG string rendering should return XML markup", () => {
        if (!mapnik.supports.cairo) {
            console.warn("Skipping SVG test: Cairo not supported");
            return;
        }
        using map = mapnik.Map(100, 100);
        map.loadString("<Map></Map>");

        const svg = map.renderSvgToString();
        expect(svg).toStartWith("<?xml");
        expect(svg).toContain("<svg");
        expect(svg).toContain("</svg>");
    });
});

describe("Fonts & Resources", () => {
    const mapnik = new Mapnik();

    test("font faces and mapping should be accessible", () => {
        const faces = mapnik.fontFaces;
        expect(Array.isArray(faces)).toBe(true);

        const mapping = mapnik.fontMapping;
        expect(typeof mapping).toBe("object");
    });

    test("font cache info should contain count property", () => {
        const cache = mapnik.fontCacheInfo;
        expect(cache).toHaveProperty("count");
        expect(typeof cache.count).toBe("number");
    });
});

describe("Error Handling", () => {
    const mapnik = new Mapnik();

    test("invalid XML in loadString should throw an exception", () => {
        using map = mapnik.Map(100, 100);
        const brokenXml = "<Map><Style>"; // Unclosed tags

        expect(() => {
            map.loadString(brokenXml);
        }).toThrow();
    });

    test("adding a non-existent style should throw", () => {
        using map = mapnik.Map(100, 100);
        expect(() => {
            map.addStyleXml("missing-style", "<Map></Map>");
        }).toThrow();
    });

    test("explicit disposal should mark object as disposed", () => {
        const map = mapnik.Map(1, 1);
        expect(map.isDisposed).toBe(false);
        map.dispose();
        expect(map.isDisposed).toBe(true);

        // Accessing properties after disposal should throw
        expect(() => map.width).toThrow();
    });
});
