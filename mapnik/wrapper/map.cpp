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

#include <mapnik/map.hpp>
#include <mapnik/load_map.hpp>
#include <mapnik/agg_renderer.hpp>

extern "C" {

// -----------------------------
// Map helpers
// -----------------------------

EXPORT void *map_new(const int32_t width, const int32_t height) {
    try {
        auto *map = new mapnik::Map(width, height);
        return map;
    } catch (...) {
        _set_last_error("map_new: unknown error");
        return nullptr;
    }
}

EXPORT void map_free(void *map_ptr) {
    if (map_ptr) {
        delete static_cast<mapnik::Map *>(map_ptr);
    }
}

// Karte laden (Datei)
EXPORT int32_t map_load(void *map_ptr, const char *path) {
    if (!map_ptr || !path) {
        _set_last_error("map_load: null map or path");
        return 0;
    }
    auto *map = static_cast<mapnik::Map *>(map_ptr);
    try {
        mapnik::load_map(*map, path);
        return 1;
    } catch (std::exception const &ex) {
        _set_last_error(ex.what());
        return 0;
    } catch (...) {
        _set_last_error("map_load: unknown error");
        return 0;
    }
}

// base_path wird für relative Pfade in XML genutzt (Fonts, Shapefiles, etc.)
EXPORT int32_t map_load_string(void *map_ptr, const char *xml, const char *base_path) {
    if (!map_ptr || !xml) {
        _set_last_error("map_load_string: null map or xml");
        return 0;
    }
    auto *map = static_cast<mapnik::Map *>(map_ptr);
    try {
        if (base_path && *base_path) {
            mapnik::load_map_string(*map, std::string(xml), true, std::string(base_path));
        } else {
            mapnik::load_map_string(*map, std::string(xml), true);
        }
        return 1;
    } catch (std::exception const &ex) {
        _set_last_error(ex.what());
        return 0;
    } catch (...) {
        _set_last_error("map_load_string: unknown error");
        return 0;
    }
}

EXPORT void map_zoom_all(void *map_ptr) {
    if (map_ptr) {
        auto *map = static_cast<mapnik::Map *>(map_ptr);
        map->zoom_all();
    }
}

EXPORT int32_t map_zoom_to_box(void *map_ptr, double minx, double miny, double maxx, double maxy) {
    if (!map_ptr) {
        _set_last_error("map_zoom_to_box: null map");
        return 0;
    }
    try {
        auto *map = static_cast<mapnik::Map *>(map_ptr);
        mapnik::box2d<double> bbox(minx, miny, maxx, maxy);
        map->zoom_to_box(bbox);
        return 1;
    } catch (std::exception const &ex) {
        _set_last_error(ex.what());
        return 0;
    } catch (...) {
        _set_last_error("map_zoom_to_box: unknown error");
        return 0;
    }
}

EXPORT void map_render(void *map_ptr, void *img_ptr) {
    if (map_ptr && img_ptr) {
        auto *map = static_cast<mapnik::Map *>(map_ptr);
        auto *im = static_cast<mapnik::image_rgba8 *>(img_ptr);

        mapnik::agg_renderer<mapnik::image_rgba8> ren(*map, *im);
        ren.apply();
    }
}

EXPORT int32_t map_add_layer(void *map_ptr, void *layer_ptr) {
    if (!map_ptr || !layer_ptr) {
        _set_last_error("map_add_layer: null map or layer");
        return 0;
    }
    try {
        auto *map = static_cast<mapnik::Map *>(map_ptr);
        auto *lyr = static_cast<mapnik::layer *>(layer_ptr);
        map->add_layer(*lyr); // copies layer
        return 1;
    } catch (std::exception const &ex) {
        _set_last_error(ex.what());
        return 0;
    } catch (...) {
        _set_last_error("map_add_layer: unknown error");
        return 0;
    }
}

EXPORT int32_t map_render_svg(void *map_ptr, const char *filepath) {
    if (!map_ptr || !filepath) {
        _set_last_error("map_render_svg: null map or filepath");
        return 0;
    }

#if !defined(MAPNIK_USE_CAIRO)
    _set_last_error("map_render_svg: Mapnik built without Cairo (MAPNIK_USE_CAIRO not defined)");
    return 0;
#else
    try {
        auto *map = static_cast<mapnik::Map *>(map_ptr);

        // Vector SVG surface sized to the map
        auto surface = mapnik::cairo::create_svg_surface(std::string(filepath), map->width(), map->height());

        mapnik::cairo_renderer<mapnik::cairo_surface_ptr> ren(*map, surface);
        ren.apply();

        // Ensure bytes are flushed/written
        mapnik::cairo::finish(surface);
        return 1;
    } catch (std::exception const &ex) {
        _set_last_error(ex.what());
        return 0;
    } catch (...) {
        _set_last_error("map_render_svg: unknown error");
        return 0;
    }
#endif
}

EXPORT int32_t map_render_pdf(void *map_ptr, const char *filepath) {
    if (!map_ptr || !filepath) {
        _set_last_error("map_render_pdf: null map or filepath");
        return 0;
    }

#if !defined(MAPNIK_USE_CAIRO)
    _set_last_error("map_render_pdf: Mapnik built without Cairo (MAPNIK_USE_CAIRO not defined)");
    return 0;
#else
    try {
        auto *map = static_cast<mapnik::Map *>(map_ptr);

        // Vector PDF surface sized to the map
        auto surface = mapnik::cairo::create_pdf_surface(std::string(filepath), map->width(), map->height());

        mapnik::cairo_renderer<mapnik::cairo_surface_ptr> ren(*map, surface);
        ren.apply();

        // Ensure bytes are flushed/written
        mapnik::cairo::finish(surface);
        return 1;
    } catch (std::exception const &ex) {
        _set_last_error(ex.what());
        return 0;
    } catch (...) {
        _set_last_error("map_render_pdf: unknown error");
        return 0;
    }
#endif
}

EXPORT void mem_free(void *p) {
    if (p) std::free(p);
}

// out_len: pointer to size_t (uint64 on 64-bit) where we store byte length
EXPORT void *map_render_svg_to_memory(void *map_ptr, uint64_t *out_len) {
    if (!out_len) {
        _set_last_error("map_render_svg_to_memory: out_len is null");
        return nullptr;
    }
    *out_len = 0;

    if (!map_ptr) {
        _set_last_error("map_render_svg_to_memory: null map");
        return nullptr;
    }

#if !defined(MAPNIK_USE_CAIRO)
    _set_last_error("map_render_svg_to_memory: Mapnik built without Cairo (MAPNIK_USE_CAIRO not defined)");
    return nullptr;
#else
    try {
        auto *map = static_cast<mapnik::Map *>(map_ptr);

        // Create an in-memory Cairo SVG surface (writes into an internal buffer)
        auto surface = mapnik::cairo::create_svg_surface();

        mapnik::cairo_renderer<mapnik::cairo_surface_ptr> ren(*map, surface);
        ren.apply();

        // Finalize to flush content into the buffer
        mapnik::cairo::finish(surface);

        // Extract bytes
        std::string s = mapnik::cairo::to_string(surface);
        void *buf = std::malloc(s.size());
        if (!buf && !s.empty()) {
            _set_last_error("map_render_svg_to_memory: malloc failed");
            return nullptr;
        }

        if (!s.empty()) std::memcpy(buf, s.data(), s.size());
        *out_len = static_cast<uint64_t>(s.size());
        return buf;
    } catch (std::exception const &ex) {
        _set_last_error(ex.what());
        return nullptr;
    } catch (...) {
        _set_last_error("map_render_svg_to_memory: unknown error");
        return nullptr;
    }
#endif
}

EXPORT int32_t map_add_style_xml(void *map_ptr, const char *style_name, const char *style_xml) {
    if (!map_ptr || !style_name || !style_xml) {
        _set_last_error("map_add_style_xml: null map/style_name/style_xml");
        return 0;
    }

    try {
        auto *map = static_cast<mapnik::Map *>(map_ptr);

        // Parse the style in a temporary map, then copy the style object over.
        // We wrap it into a minimal <Map> document because load_map_string expects a stylesheet.
        mapnik::Map tmp(1, 1);
        mapnik::load_map_string(tmp, style_xml, true);

        // find_style returns boost::optional<feature_type_style const&> in newer Mapnik
        auto styOpt = tmp.find_style(std::string(style_name));
        if (!styOpt) {
            _set_last_error("map_add_style_xml: style not found in provided XML");
            return 0;
        }

        mapnik::feature_type_style const &sty = *styOpt;

        // insert_style returns false if style already exists; we replace in that case
        if (!map->insert_style(std::string(style_name), sty)) {
            map->remove_style(std::string(style_name));
            if (!map->insert_style(std::string(style_name), sty)) {
                _set_last_error("map_add_style_xml: failed to insert style");
                return 0;
            }
        }
        return 1;
    } catch (std::exception const &ex) {
        _set_last_error(ex.what());
        return 0;
    } catch (...) {
        _set_last_error("map_add_style_xml: unknown error");
        return 0;
    }
}

EXPORT int32_t map_width(void *map_ptr) {
    if (!map_ptr) {
        _set_last_error("map_width: null map");
        return 0;
    }
    auto *map = static_cast<mapnik::Map *>(map_ptr);
    return static_cast<int32_t>(map->width());
}

EXPORT int32_t map_height(void *map_ptr) {
    if (!map_ptr) {
        _set_last_error("map_height: null map");
        return 0;
    }
    auto *map = static_cast<mapnik::Map *>(map_ptr);
    return static_cast<int32_t>(map->height());
}

EXPORT int32_t map_get_extent(void *map_ptr, double *out4) {
    if (!map_ptr) {
        _set_last_error("map_get_extent: null map");
        return 0;
    }
    if (!out4) {
        _set_last_error("map_get_extent: out4 is null");
        return 0;
    }

    try {
        auto *map = static_cast<mapnik::Map *>(map_ptr);
        // "current extent" after zoom_to_box / zoom_all etc.
        mapnik::box2d<double> b = map->get_current_extent();

        out4[0] = b.minx();
        out4[1] = b.miny();
        out4[2] = b.maxx();
        out4[3] = b.maxy();
        return 1;
    } catch (std::exception const &ex) {
        _set_last_error(ex.what());
        return 0;
    } catch (...) {
        _set_last_error("map_get_extent: unknown error");
        return 0;
    }
}

EXPORT int32_t map_load_fonts(void *map_ptr) {
    if (!map_ptr) {
        _set_last_error("map_load_fonts: null map");
        return 0;
    }
    try {
        auto *map = static_cast<mapnik::Map *>(map_ptr);
        map->load_fonts();
        return 1;
    } catch (std::exception const &ex) {
        _set_last_error(ex.what());
        return 0;
    } catch (...) {
        _set_last_error("map_load_fonts: unknown error");
        return 0;
    }
}

}