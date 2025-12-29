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

#include <mapnik/layer.hpp>

extern "C" {
    // -----------------------------
    // Layer helpers
    // -----------------------------

    EXPORT void *layer_new(const char *name, const char *srs) {
        try {
            mapnik::layer *lyr = nullptr;
            if (name && srs) lyr = new mapnik::layer(std::string(name), std::string(srs));
            else if (name) lyr = new mapnik::layer(std::string(name));
            else lyr = new mapnik::layer(std::string(""));
            return static_cast<void *>(lyr);
        } catch (std::exception const &ex) {
            _set_last_error(ex.what());
            return nullptr;
        } catch (...) {
            _set_last_error("layer_new: unknown error");
            return nullptr;
        }
    }

    EXPORT int32_t layer_set_datasource(void *layer_ptr, void *datasource_ptr) {
        if (!layer_ptr || !datasource_ptr) {
            _set_last_error("layer_set_datasource: null layer or datasource");
            return 0;
        }
        try {
            auto *lyr = static_cast<mapnik::layer *>(layer_ptr);
            auto *ds_handle = static_cast<mapnik::datasource_ptr *>(datasource_ptr);
            if (!(*ds_handle)) {
                _set_last_error("layer_set_datasource: datasource handle is empty");
                return 0;
            }
            lyr->set_datasource(*ds_handle);
            return 1;
        } catch (std::exception const &ex) {
            _set_last_error(ex.what());
            return 0;
        } catch (...) {
            _set_last_error("layer_set_datasource: unknown error");
            return 0;
        }
    }

    EXPORT void layer_free(void *layer_ptr) {
        if (layer_ptr) delete static_cast<mapnik::layer *>(layer_ptr);
    }

    // style_name muss im Map-Stylesheet existieren (z.B. aus map_load/map_load_string)
    EXPORT int32_t layer_add_style(void *layer_ptr, const char *style_name) {
        if (!layer_ptr || !style_name) {
            _set_last_error("layer_add_style: null layer or style_name");
            return 0;
        }
        try {
            auto *lyr = static_cast<mapnik::layer *>(layer_ptr);
            lyr->add_style(std::string(style_name));
            return 1;
        } catch (std::exception const &ex) {
            _set_last_error(ex.what());
            return 0;
        } catch (...) {
            _set_last_error("layer_add_style: unknown error");
            return 0;
        }
    }

    EXPORT void layer_clear_styles(void *layer_ptr) {
        if (!layer_ptr) return;
        try {
            auto *lyr = static_cast<mapnik::layer *>(layer_ptr);
            lyr->styles().clear();
        } catch (...) {
            // bewusst still; last_error wäre hier optional
        }
    }

}