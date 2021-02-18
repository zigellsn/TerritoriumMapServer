/* * Copyright 2019-2021 Simon Zigelli
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
        mediaType: 'application/pdf' | 'image/svg+xml' | 'application/xhtml+xml';
        pageSize: 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8' | 'A9' | 'A10'
            | 'B0' | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8' | 'B9' | 'B10'
            | 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' | 'C9' | 'C10'
            | '4A0' | '2A0'
            | 'RA0' | 'RA1' | 'RA2' | 'RA3' | 'RA4'
            | 'SRA0' | 'SRA1' | 'SRA2' | 'SRA3' | 'SRA4'
            | 'EXECUTIVE' | 'FOLIO' | 'LEGAL' | 'LETTER' | 'TABLOID' | undefined;
        ppi: number;
        margins: number | [number, number] | [number, number, number, number];
        orientation: 'portrait' | 'landscape';
        pageDecoration: boolean;
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
        way: object;
        style: Style | undefined;
    }

    interface Polygon {
        name: PolygonName;
        number: string;
        size: [number, number];
        bbox: [number, number, number, number];
        way: object;
        mediaType: 'image/png' | 'image/svg+xml';
        style: Style | undefined;
        subpolygon: SubPolygon | Array<SubPolygon> | undefined;
    }

    interface JsonPolygon {
        polygon: Polygon | Array<Polygon>;
        page: Page | undefined;
    }

    interface Layer {
        way: object;
        name: PolygonName | SubPolygonName;
        styleName: string
    }

    export interface Job {
        job: string;
        payload: JsonPolygon;
    }

    interface Result {
        job: string;
        payload: string | Buffer;
        filename: string | undefined;
        mediaType: string | undefined;
        error: boolean;
    }

    interface ResultBuffer {
        name: string;
        fileName: string;
        buffer: Buffer;
        message: string;
        size: [number, number];
        mediaType: string;
        ppi: number;
    }
}