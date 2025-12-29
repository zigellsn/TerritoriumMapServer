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

import {dlopen, FFIType, type Pointer, ptr, suffix, toArrayBuffer} from "bun:ffi";

function assertPtr(p: Pointer | null, msg: string): asserts p {
    if (p === null || !p || p === 0) throw new Error(msg);
}

type Lib = ReturnType<typeof createLib>;

function createLib(libraryPath = `./libwrapper.${suffix}`) {
    const lib = dlopen(libraryPath, {
        // error handling
        last_error: {args: [], returns: FFIType.cstring},
        last_error_clear: {args: [], returns: FFIType.void},

        version: {args: [], returns: FFIType.i32},
        supports_cairo: {args: [], returns: FFIType.i32},
        set_log_severity: {args: [FFIType.i32], returns: FFIType.void},

        // map
        map_new: {args: [FFIType.i32, FFIType.i32], returns: FFIType.ptr},
        map_free: {args: [FFIType.ptr], returns: FFIType.void},
        map_load: {args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32},
        map_load_string: {args: [FFIType.ptr, FFIType.cstring, FFIType.cstring], returns: FFIType.i32},
        map_zoom_all: {args: [FFIType.ptr], returns: FFIType.void},
        map_zoom_to_box: {
            args: [FFIType.ptr, FFIType.f64, FFIType.f64, FFIType.f64, FFIType.f64],
            returns: FFIType.i32
        },
        map_add_layer: {args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32},
        map_add_style_xml: {args: [FFIType.ptr, FFIType.cstring, FFIType.cstring], returns: FFIType.i32},
        map_load_fonts: {args: [FFIType.ptr], returns: FFIType.i32},
        map_render: {args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void},
        map_render_svg: {args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32},
        map_render_pdf: {args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32},
        mem_free: {args: [FFIType.ptr], returns: FFIType.void},
        map_render_svg_to_memory: {args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr},

        map_width: {args: [FFIType.ptr], returns: FFIType.i32},
        map_height: {args: [FFIType.ptr], returns: FFIType.i32},
        map_get_extent: {args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32},
        // image
        image_new: {args: [FFIType.i32, FFIType.i32], returns: FFIType.ptr},
        image_free: {args: [FFIType.ptr], returns: FFIType.void},
        image_save: {args: [FFIType.ptr, FFIType.cstring, FFIType.cstring], returns: FFIType.void},
        image_encode_to_memory: {args: [FFIType.ptr, FFIType.cstring, FFIType.ptr], returns: FFIType.ptr},

        // layer
        layer_new: {args: [FFIType.cstring, FFIType.cstring], returns: FFIType.ptr},
        layer_free: {args: [FFIType.ptr], returns: FFIType.void},
        layer_set_datasource: {args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32},
        layer_add_style: {args: [FFIType.ptr, FFIType.cstring], returns: FFIType.i32},
        layer_clear_styles: {args: [FFIType.ptr], returns: FFIType.void},

        // datasource
        datasource_register_plugin_dir: {args: [FFIType.cstring], returns: FFIType.i32},
        datasource_is_valid: {args: [FFIType.ptr], returns: FFIType.i32},
        datasource_free: {args: [FFIType.ptr], returns: FFIType.void},

        datasource_shape_new: {args: [FFIType.cstring, FFIType.cstring, FFIType.cstring], returns: FFIType.ptr},
        datasource_postgis_new: {
            args: [
                FFIType.cstring, // host
                FFIType.cstring, // dbname
                FFIType.cstring, // table
                FFIType.cstring, // user
                FFIType.cstring, // password
                FFIType.i32, // port
                FFIType.cstring, // geometry_field
                FFIType.i32, // srid
            ],
            returns: FFIType.ptr,
        },
        datasource_geojson_file_new: {args: [FFIType.cstring], returns: FFIType.ptr},
        datasource_geojson_inline_new: {args: [FFIType.cstring], returns: FFIType.ptr},

        datasource_csv_file_new: {args: [FFIType.cstring, FFIType.cstring], returns: FFIType.ptr},
        datasource_csv_inline_new: {args: [FFIType.cstring], returns: FFIType.ptr},

        register_fonts: {args: [FFIType.cstring, FFIType.bool], returns: FFIType.bool},
        fonts_face_names: {args: [], returns: FFIType.cstring},
        fonts_get_cache: {args: [], returns: FFIType.cstring},
        fonts_get_mapping: {args: [], returns: FFIType.cstring},
    });

    const api = lib.symbols;

    function lastError(): string {
        return (api.last_error() as unknown as string) || "unknown error";
    }

    function okOrThrow(ok: number, context: string) {
        if (ok !== 1) throw new Error(`${context}: ${lastError()}`);
    }

    function clearError() {
        api.last_error_clear();
    }

    return {lib, api, lastError, okOrThrow, clearError};
}

export enum LogLevel {
    Debug = 0,
    Warn = 1,
    Error = 2,
    None = 3
}

function toNullTerminatedUtf8(s: string): Uint8Array {
    const raw = new TextEncoder().encode(s);
    const z = new Uint8Array(raw.length + 1);
    z.set(raw, 0);
    z[raw.length] = 0; // NUL
    return z;
}

// -----------------------------
// Base: NativeHandle + dispose()
// -----------------------------

abstract class NativeHandle {
    protected ptr: Pointer | null = null;
    protected readonly lib: Lib;
    private disposed = false;

    protected constructor(lib: Lib, ptr: Pointer) {
        this.lib = lib;
        this.ptr = ptr;
    }

    get handle(): Pointer {
        if (this.disposed || ptr === null) throw new Error("Object already disposed");
        return this.ptr!;
    }

    get isDisposed(): boolean {
        return this.disposed;
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        const p = this.ptr;
        this.ptr = null;
        if (p === null) return;
        this._free(p!);
    }

    [Symbol.dispose](): void {
        this.dispose();
    }

    protected abstract _free(ptr: Pointer): void;
}

// -----------------------------
// Datasource
// -----------------------------

export type PostgisOptions = {
    host: string;
    dbname: string;
    table: string;
    user?: string;
    password?: string; // use placeholders in code/examples
    port?: number;
    geometryField?: string;
    srid?: number;
};

export class Datasource extends NativeHandle {
    private static finalizer = new FinalizationRegistry<{ lib: Lib; ptr: Pointer }>((v) => {
        // best-effort cleanup if user forgets dispose()
        try {
            v.lib.api.datasource_free(v.ptr);
        } catch {
            // ignore
        }
    });

    protected _free(ptr: Pointer): void {
        Datasource.finalizer.unregister(this);
        this.lib.api.datasource_free(ptr);
    }

    private constructor(lib: Lib, ptr: Pointer) {
        super(lib, ptr);
        Datasource.finalizer.register(this, {lib, ptr}, this);
        if (lib.api.datasource_is_valid(ptr) !== 1) {
            const msg = lib.lastError();
            this.dispose();
            throw new Error(`Datasource invalid: ${msg}`);
        }
    }

    static registerPluginDir(lib: Lib, path: string): void {
        const pathZ = toNullTerminatedUtf8(path);
        lib.okOrThrow(lib.api.datasource_register_plugin_dir(ptr(pathZ)), "datasource_register_plugin_dir");
    }

    static shape(lib: Lib, file: string, encoding: string | null = "UTF-8", base: string | null = null): Datasource {
        lib.clearError();
        const fileZ = toNullTerminatedUtf8(file);
        const encodingZ = toNullTerminatedUtf8(encoding ?? "");
        const baseZ = toNullTerminatedUtf8(base ?? "");
        const _ptr = lib.api.datasource_shape_new(ptr(fileZ), ptr(encodingZ), ptr(baseZ));
        assertPtr(_ptr, `datasource_shape_new returned null: ${lib.lastError()}`);
        return new Datasource(lib, _ptr);
    }

    static geojsonFile(lib: Lib, file: string): Datasource {
        lib.clearError();
        const fileZ = toNullTerminatedUtf8(file);
        const _ptr = lib.api.datasource_geojson_file_new(ptr(fileZ));
        assertPtr(_ptr, `datasource_geojson_file_new returned null: ${lib.lastError()}`);
        return new Datasource(lib, _ptr);
    }

    static geojsonInline(lib: Lib, json: string): Datasource {
        lib.clearError();
        const jsonZ = toNullTerminatedUtf8(json);
        const _ptr = lib.api.datasource_geojson_inline_new(ptr(jsonZ));
        assertPtr(_ptr, `datasource_geojson_inline_new returned null: ${lib.lastError()}`);
        return new Datasource(lib, _ptr);
    }

    static postgis(lib: Lib, opts: PostgisOptions): Datasource {
        lib.clearError();
        const hostZ = toNullTerminatedUtf8(opts.host);
        const dbnameZ = toNullTerminatedUtf8(opts.dbname);
        const tableZ = toNullTerminatedUtf8(opts.table);
        const userZ = toNullTerminatedUtf8(opts.user ?? "");
        const passwordZ = toNullTerminatedUtf8(opts.password ?? "");
        const geometryFieldZ = toNullTerminatedUtf8(opts.geometryField ?? "");
        const ptr = lib.api.datasource_postgis_new(
            hostZ,
            dbnameZ,
            tableZ,
            userZ ?? null,
            passwordZ ?? null,
            opts.port ?? 5432,
            geometryFieldZ ?? null,
            opts.srid ?? 0,
        );
        assertPtr(ptr, `datasource_postgis_new returned null: ${lib.lastError()}`);
        return new Datasource(lib, ptr);
    }

    static csvFile(lib: Lib, file: string, base: string | null = null): Datasource {
        lib.clearError();
        const fileZ = toNullTerminatedUtf8(file);
        const baseZ = toNullTerminatedUtf8(base ?? "");
        const _ptr = lib.api.datasource_csv_file_new(ptr(fileZ), ptr(baseZ));
        assertPtr(_ptr, `datasource_csv_file_new returned null: ${lib.lastError()}`);
        return new Datasource(lib, _ptr);
    }

    static csvInline(lib: Lib, csv: string): Datasource {
        lib.clearError();
        const csvZ = toNullTerminatedUtf8(csv);
        const _ptr = lib.api.datasource_csv_inline_new(ptr(csvZ));
        assertPtr(_ptr, `datasource_csv_inline_new returned null: ${lib.lastError()}`);
        return new Datasource(lib, _ptr);
    }
}

// -----------------------------
// Layer
// -----------------------------

export class Layer extends NativeHandle {
    private static finalizer = new FinalizationRegistry<{ lib: Lib; ptr: Pointer }>((v) => {
        try {
            v.lib.api.layer_free(v.ptr);
        } catch {
            // ignore
        }
    });

    protected _free(ptr: Pointer): void {
        Layer.finalizer.unregister(this);
        this.lib.api.layer_free(ptr);
    }

    constructor(lib: Lib, name: string, srs: string) {
        lib.clearError();
        const nameZ = toNullTerminatedUtf8(name);
        const srsZ = toNullTerminatedUtf8(srs);
        const _ptr = lib.api.layer_new(ptr(nameZ), ptr(srsZ));
        assertPtr(_ptr, `layer_new returned null: ${lib.lastError()}`);
        super(lib, _ptr);
        Layer.finalizer.register(this, {lib, ptr: _ptr}, this);
    }

    setDatasource(ds: Datasource): this {
        this.lib.okOrThrow(this.lib.api.layer_set_datasource(this.handle, ds.handle), "layer_set_datasource");
        return this;
    }

    addStyle(styleName: string): this {
        const styleNameZ = toNullTerminatedUtf8(styleName);
        this.lib.okOrThrow(this.lib.api.layer_add_style(this.handle, ptr(styleNameZ)), "layer_add_style");
        return this;
    }

    clearStyles(): this {
        this.lib.api.layer_clear_styles(this.handle);
        return this;
    }
}

// -----------------------------
// Image
// -----------------------------

export class Image extends NativeHandle {
    private static finalizer = new FinalizationRegistry<{ lib: Lib; ptr: Pointer }>((v) => {
        try {
            v.lib.api.image_free(v.ptr);
        } catch {
            // ignore
        }
    });

    protected _free(ptr: Pointer): void {
        Image.finalizer.unregister(this);
        this.lib.api.image_free(ptr);
    }

    constructor(lib: Lib, width: number, height: number) {
        const ptr = lib.api.image_new(width, height);
        assertPtr(ptr, "image_new returned null");
        super(lib, ptr);
        Image.finalizer.register(this, {lib, ptr}, this);
    }

    save(path: string, format: string = "png"): void {
        const pathZ = toNullTerminatedUtf8(path);
        const formatZ = toNullTerminatedUtf8(format);
        this.lib.api.image_save(this.handle, ptr(pathZ), ptr(formatZ));
    }

    encode(format: string = "png"): Buffer | null {
        const outLenBuf = new BigUint64Array(1);
        const formatZ = toNullTerminatedUtf8(format);
        const p = this.lib.api.image_encode_to_memory(this.handle, ptr(formatZ), ptr(outLenBuf));

        if (!p || p === 0) {
            return null;
        }

        try {
            const len = Number(outLenBuf[0]);
            if (len === 0) return null;

            const ab = new Uint8Array(toArrayBuffer(p, 0, len)).slice();
            return Buffer.from(ab);
        } finally {
            this.lib.api.mem_free(p);
        }
    }

}

// -----------------------------
// Map
// -----------------------------

export type BBox = { minx: number; miny: number; maxx: number; maxy: number };

export class Map extends NativeHandle {
    private static finalizer = new FinalizationRegistry<{ lib: Lib; ptr: Pointer }>((v) => {
        try {
            v.lib.api.map_free(v.ptr);
        } catch {
            // ignore
        }
    });

    protected _free(ptr: Pointer): void {
        Map.finalizer.unregister(this);
        this.lib.api.map_free(ptr);
    }

    constructor(lib: Lib, width: number, height: number) {
        lib.clearError();
        const ptr = lib.api.map_new(width, height);
        assertPtr(ptr, `map_new returned null: ${lib.lastError()}`);
        super(lib, ptr);
        Map.finalizer.register(this, {lib, ptr}, this);
    }

    get width(): number {
        return this.lib.api.map_width(this.handle);
    }

    get height(): number {
        return this.lib.api.map_height(this.handle);
    }

    get extent(): [number, number, number, number] {
        const out = new Float64Array(4);
        this.lib.okOrThrow(this.lib.api.map_get_extent(this.handle, ptr(out)), "map_get_extent");
        return [out[0] ?? 0, out[1] ?? 0, out[2] ?? 0, out[3] ?? 0];
    }

    load(path: string): this {
        const pathZ = toNullTerminatedUtf8(path);
        this.lib.okOrThrow(this.lib.api.map_load(this.handle, ptr(pathZ)), "map_load");
        return this;
    }

    loadString(xml: string, basePath: string | null = null): this {
        const xmlZ = toNullTerminatedUtf8(xml);
        const baseZ = basePath == null ? null : toNullTerminatedUtf8(basePath);
        this.lib.okOrThrow(this.lib.api.map_load_string(this.handle, ptr(xmlZ), baseZ ? ptr(baseZ) : null), "map_load_string");
        return this;
    }

    loadFonts(): this {
        this.lib.okOrThrow(this.lib.api.map_load_fonts(this.handle), "map_load_fonts");
        return this;
    }

    addLayer(layer: Layer): this {
        this.lib.okOrThrow(this.lib.api.map_add_layer(this.handle, layer.handle), "map_add_layer");
        return this;
    }

    addStyleXml(styleName: string, styleXml: string): this {
        const nameZ = toNullTerminatedUtf8(styleName);
        const xmlZ = toNullTerminatedUtf8(styleXml);
        this.lib.okOrThrow(
            this.lib.api.map_add_style_xml(this.handle, ptr(nameZ), ptr(xmlZ)),
            "map_add_style_xml",
        );
        return this;
    }

    zoomAll(): this {
        this.lib.api.map_zoom_all(this.handle);
        return this;
    }

    zoomToBox(a: [number, number, number, number]): this;
    zoomToBox(b: BBox): this;
    zoomToBox(minx: number | [number, number, number, number] | BBox, miny?: number, maxx?: number, maxy?: number): this {
        let x0: number, y0: number, x1: number, y1: number;

        if (Array.isArray(minx) && minx.length === 4) {
            [x0, y0, x1, y1] = minx;
        } else if (typeof minx === 'object' && minx !== null) {
            const bbox = minx as BBox;
            x0 = bbox.minx;
            y0 = bbox.miny;
            x1 = bbox.maxx;
            y1 = bbox.maxy;
        } else {
            x0 = minx as number;
            y0 = miny!;
            x1 = maxx!;
            y1 = maxy!;
        }

        this.lib.okOrThrow(this.lib.api.map_zoom_to_box(this.handle, x0, y0, x1, y1), "map_zoom_to_box");
        return this;
    }

    render(image: Image): this {
        this.lib.api.map_render(this.handle, image.handle);
        return this;
    }

    renderSvg(path: string): this {
        const p = toNullTerminatedUtf8(path);
        this.lib.okOrThrow(this.lib.api.map_render_svg(this.handle, ptr(p)), "map_render_svg");
        return this;
    }

    renderSvgToString(): string {
        // outLen as uint64 stored in an ArrayBuffer
        const outLenBuf = new BigUint64Array(1);

        const p = this.lib.api.map_render_svg_to_memory(this.handle, ptr(outLenBuf));
        if (!p || p === 0) {
            throw new Error(`map_render_svg_to_memory: ${this.lib.lastError()}`);
        }

        try {
            const len = Number(outLenBuf[0]);
            const ab = toArrayBuffer(p, 0, len);
            return new TextDecoder().decode(ab);
        } finally {
            this.lib.api.mem_free(p);
        }
    }

    renderPdf(path: string): this {
        const p = toNullTerminatedUtf8(path);
        this.lib.okOrThrow(this.lib.api.map_render_pdf(this.handle, ptr(p)), "map_render_pdf");
        return this;
    }
}

// -----------------------------
// Facade: Mapnik (lib singleton)
// -----------------------------

export class Mapnik {
    readonly lib: Lib;

    constructor(libraryPath?: string) {
        this.lib = createLib(libraryPath);
    }

    version(): number {
        return this.lib.api.version();
    }

    setLogLevel(level: LogLevel): void {
        this.lib.api.set_log_severity(level);
    }

    registerPluginDir(path: string): void {
        Datasource.registerPluginDir(this.lib, path);
    }

    registerFontDir(path: string, recurse: boolean = false): boolean {
        const pathZ = toNullTerminatedUtf8(path);
        return this.lib.api.register_fonts(ptr(pathZ), recurse);
    }

    registerDefaultFontDir() {
        this.registerFontDir('/usr/share/fonts', true)
        this.registerFontDir('/usr/local/share/fonts', true)
    }

    get fontFaces(): string[] {
        const json = this.lib.api.fonts_face_names() as unknown as string;
        return JSON.parse(json || "[]");
    }

    get fontMapping(): Record<string, string> {
        const json = this.lib.api.fonts_get_mapping() as unknown as string;
        return JSON.parse(json || "{}");
    }

    get fontCacheInfo(): any {
        const json = this.lib.api.fonts_get_cache() as unknown as string;
        return JSON.parse(json || "{}");
    }

    get supports(): { cairo: boolean } {
        return {cairo: this.lib.api.supports_cairo() === 1};
    }

    Map(width: number, height: number): Map {
        return new Map(this.lib, width, height);
    }

    Image(width: number, height: number): Image {
        return new Image(this.lib, width, height);
    }

    Layer(name: string, srs: string): Layer {
        return new Layer(this.lib, name, srs);
    }

    Datasource = {
        shape: (file: string, encoding: string | null = "UTF-8", base: string | null = null) =>
            Datasource.shape(this.lib, file, encoding, base),
        geojsonFile: (file: string) => Datasource.geojsonFile(this.lib, file),
        geojsonInline: (json: string) => Datasource.geojsonInline(this.lib, json),
        csvFile: (file: string, base: string | null = null) => Datasource.csvFile(this.lib, file, base),
        csvInline: (csv: string) => Datasource.csvInline(this.lib, csv),
        postgis: (opts: PostgisOptions) => Datasource.postgis(this.lib, opts),
    };
}
