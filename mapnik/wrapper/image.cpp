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

#include <mapnik/image.hpp>
#include <mapnik/image_util.hpp>

#if defined(MAPNIK_USE_CAIRO)
#include <mapnik/cairo/cairo_renderer.hpp>
#include <mapnik/cairo/cairo_surface.hpp>
#include <mapnik/cairo/cairo_io.hpp>
#endif

extern "C" {

    // -----------------------------
    // Image helpers
    // -----------------------------

    EXPORT void *image_new(int32_t width, int32_t height) {
        return new mapnik::image_rgba8(width, height);
    }

    EXPORT void image_free(void *img_ptr) {
        if (img_ptr) {
            delete static_cast<mapnik::image_rgba8 *>(img_ptr);
        }
    }

    EXPORT uint32_t *image_get_data(void *img_ptr) {
        if (img_ptr) {
            auto *im = static_cast<mapnik::image_rgba8 *>(img_ptr);
            return im->data();
        }
        return nullptr;
    }

    EXPORT void image_save(void *img_ptr, const char *filepath, const char *format) {
        if (img_ptr && filepath && format) {
            auto *im = static_cast<mapnik::image_rgba8 *>(img_ptr);
            mapnik::save_to_file(*im, filepath, std::string(format));
        }
    }

    EXPORT void *image_encode_to_memory(void *img_ptr, const char *format, uint64_t *out_len) {
        if (!out_len) {
            _set_last_error("image_encode_to_memory: out_len is null");
            return nullptr;
        }
        *out_len = 0;

        if (!img_ptr || !format) {
            _set_last_error("image_encode_to_memory: null image or format");
            return nullptr;
        }

        try {
            auto *im = static_cast<mapnik::image_rgba8 *>(img_ptr);

            std::string s = mapnik::save_to_string(*im, std::string(format));
            void *buf = std::malloc(s.size());
            if (!buf && !s.empty()) {
                _set_last_error("image_encode_to_memory: malloc failed");
                return nullptr;
            }

            if (!s.empty()) std::memcpy(buf, s.data(), s.size());
            *out_len = static_cast<uint64_t>(s.size());
            return buf;
        } catch (std::exception const &ex) {
            _set_last_error(ex.what());
            return nullptr;
        } catch (...) {
            _set_last_error("image_encode_to_memory: unknown error");
            return nullptr;
        }
    }
}
