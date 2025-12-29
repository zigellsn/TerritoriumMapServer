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

#include "include/mapnik.h"
#include "mapnik_internal.h"
#include <mapnik/datasource.hpp>
#include <mapnik/datasource_cache.hpp>
#include <mapnik/params.hpp>
#include <string>

extern "C" {
    // -----------------------------
    // Datasource helpers (shape/postgis/geojson)
    // handle type: mapnik::datasource_ptr* (allocated with new)
    // -----------------------------

    EXPORT int32_t datasource_register_plugin_dir(const char *path) {
        if (!path) {
            _set_last_error("datasource_register_plugin_dir: null path");
            return 0;
        }
        try {
            mapnik::datasource_cache::instance().register_datasources(path);
            return 1;
        } catch (std::exception const &ex) {
            _set_last_error(ex.what());
            return 0;
        } catch (...) {
            _set_last_error("datasource_register_plugin_dir: unknown error");
            return 0;
        }
    }

    EXPORT void datasource_free(void *ds_ptr) {
        if (ds_ptr) {
            delete static_cast<mapnik::datasource_ptr *>(ds_ptr);
        }
    }

    EXPORT int32_t datasource_is_valid(void *ds_ptr) {
        if (!ds_ptr) return 0;
        auto *ds = static_cast<mapnik::datasource_ptr *>(ds_ptr);
        return (*ds) ? 1 : 0;
    }

    static void *_create_ds_from_params(mapnik::parameters const &params) {
        try {
            mapnik::datasource_ptr ds = mapnik::datasource_cache::instance().create(params);
            if (!ds) {
                _set_last_error("create datasource: returned null (plugin missing or params invalid)");
                return nullptr;
            }
            return static_cast<void *>(new mapnik::datasource_ptr(ds));
        } catch (std::exception const &ex) {
            _set_last_error(ex.what());
            return nullptr;
        } catch (...) {
            _set_last_error("create datasource: unknown error");
            return nullptr;
        }
    }

// --- SHAPE ---
// Minimal: file path to .shp
// Optional: encoding (e.g. "UTF-8"), base (for relative paths)
EXPORT void *datasource_shape_new(const char *shp_path,
                                  const char *encoding,
                                  const char *base) {
    if (!shp_path) return nullptr;
    mapnik::parameters p;
    p["type"] = std::string("shape");
    p["file"] = std::string(shp_path);
    if (encoding && *encoding) p["encoding"] = std::string(encoding);
    if (base && *base) p["base"] = std::string(base);
    return _create_ds_from_params(p);
}

// --- POSTGIS ---
// Minimal fields: host, dbname, table
// Optional: user, password, port, geometry_field, srid
//
// table examples Mapnik accepts:
//   "my_table"
//   "(SELECT * FROM my_table) as sub"
//   "schema.my_table"
EXPORT void *datasource_postgis_new(const char *host,
                                    const char *dbname,
                                    const char *table,
                                    const char *user,
                                    const char *password,
                                    int32_t port,
                                    const char *geometry_field,
                                    int32_t srid) {
    if (!host || !dbname || !table) return nullptr;

    mapnik::parameters p;
    p["type"] = std::string("postgis");
    p["host"] = std::string(host);
    p["dbname"] = std::string(dbname);
    p["table"] = std::string(table);

    if (user && *user) p["user"] = std::string(user);
    if (password && *password) p["password"] = std::string(password);
    if (port > 0) p["port"] = std::to_string(port);
    if (geometry_field && *geometry_field) p["geometry_field"] = std::string(geometry_field);
    if (srid > 0) p["srid"] = std::to_string(srid);

    return _create_ds_from_params(p);
}

// --- GEOJSON ---
// Either pass a filename (recommended), or inline JSON string.
// Many builds use "file" param. Some support "inline".
EXPORT void *datasource_geojson_file_new(const char *filename) {
    if (!filename) return nullptr;
    mapnik::parameters p;
    p["type"] = std::string("geojson");
    p["file"] = std::string(filename);
    return _create_ds_from_params(p);
}

EXPORT void *datasource_geojson_inline_new(const char *json) {
    if (!json) return nullptr;
    mapnik::parameters p;
    p["type"] = std::string("geojson");
    p["inline"] = std::string(json);
    return _create_ds_from_params(p);
}

// --- CSV ---
// Either pass a filename (recommended), or inline CSV text.
// Optional: base (for resolving relative "file" paths if you use them)
EXPORT void *datasource_csv_file_new(const char *filename, const char *base) {
    if (!filename) return nullptr;
    mapnik::parameters p;
    p["type"] = std::string("csv");
    p["file"] = std::string(filename);
    if (base && *base) p["base"] = std::string(base);
    return _create_ds_from_params(p);
}

EXPORT void *datasource_csv_inline_new(const char *csv) {
    if (!csv) return nullptr;
    mapnik::parameters p;
    p["type"] = std::string("csv");
    p["inline"] = std::string(csv);
    return _create_ds_from_params(p);
}

}