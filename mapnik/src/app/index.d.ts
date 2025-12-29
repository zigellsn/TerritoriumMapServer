/* * Copyright 2019-2025 Simon Zigelli
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

export declare namespace Territorium {

    interface Page {
        name: string | undefined;
        mediaType: 'application/pdf' | 'image/svg+xml' | 'application/epub+zip';
        pageSize: 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8' | 'A9' | 'A10'
            | 'B0' | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8' | 'B9' | 'B10'
            | 'LETTER' | 'LEGAL' | 'TABLOID' | 'LEDGER'
            | 'JUNIOR_LEGAL' | 'HALF_LETTER' | 'GOV_LETTER' | 'GOV_LEGAL'
            | 'ANSI_A' | 'ANSI_B' | 'ANSI_C' | 'ANSI_D' | 'ANSI_E'
            | 'ARCH_A' | 'ARCH_B' | 'ARCH_C' | 'ARCH_D' | 'ARCH_E' | 'ARCH_E1' | 'ARCH_E2' | 'ARCH_E3'
            | 'POSTCARD' | 'EXECUTIVE'
            | 'CUSTOM' | undefined;
        physicalSize: [number, number] | undefined; // Only with pageSize = CUSTOM
        ppi: number | undefined;
        margins: number | [number, number] | [number, number, number, number] | undefined;
        orientation: 'portrait' | 'landscape' | undefined;
        pageDecoration: boolean | undefined;
    }

    interface PolygonName {
        text: string;
        fontName: string | undefined;
        size: number | undefined;
        color: string | undefined;
        offset: [number, number] | undefined;
        position: [number, number] | undefined;
        visible: boolean;
    }

    interface SubPolygonName {
        text: string;
        offset: [number, number] | undefined;
        position: [number, number] | undefined;
        visible: boolean;
    }

    interface Style {
        name: string;
        color: string;
        opacity: number;
        width: number;
        ppi: number;
    }

    interface SubPolygon {
        name: SubPolygonName;
        projection: string | undefined;
        way: any;
        style: Style | undefined;
    }

    interface Polygon {
        name: PolygonName;
        number: string;
        size: [number, number];
        bbox: [number, number, number, number];
        projection: string | undefined;
        way: any;
        mediaType: 'image/png' | 'image/svg+xml' | 'application/pdf';
        style: Style | undefined;
        subpolygon: SubPolygon | Array<SubPolygon> | undefined;
        generateWorldFile: boolean;
    }

    interface PolygonContainer {
        polygon: Polygon | Array<Polygon>;
        page: Page | undefined;
    }

    interface Layer {
        projection: string | undefined;
        way: any;
        name: PolygonName | SubPolygonName;
        styleName: string;
    }

    export interface Job {
        job: string;
        payload: PolygonContainer | undefined;
    }

    interface JobResult {
        job: string;
        error: boolean;
        result: Result | Array<Result>;
    }

    interface Result {
        payload: string | Buffer;
        worldFile: string | Buffer | undefined;
        filename: string | undefined;
        mediaType: string | undefined;
        error: boolean;
    }

    interface ResultBuffer {
        name: string | undefined;
        fileName: string;
        buffer: string | Buffer;
        worldFile: string | Buffer | undefined;
        message: string;
        size: [number, number] | undefined;
        mediaType: string;
        ppi: number | undefined;
    }

    interface Container {
        page: Page;
        buffers: Array<ResultBuffer>;
        version: string;
    }
}

interface AbstractRenderer {
    map(polygon: Territorium.Polygon): Promise<{ map: string | Buffer<ArrayBufferLike>, worldFile: Buffer }>;
}
