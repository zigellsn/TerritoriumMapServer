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

#include <mapnik/font_engine_freetype.hpp>
#include <string>
#include <vector>
#include <iomanip>

// Hilfsfunktion zum Escapen von JSON-Strings
std::string json_escape(const std::string& s) {
    std::ostringstream o;
    for (auto c : s) {
        if (c == '"' || c == '\\' || ('\x00' <= c && c <= '\x1f')) {
            o << "\\u" << std::hex << std::setw(4) << std::setfill('0') << (int)c;
        } else {
            o << c;
        }
    }
    return o.str();
}

extern "C" {
    static thread_local std::string g_font_info_buffer;
    EXPORT bool register_fonts(const char *path, const bool recurse) {
        if (!path) {
            _set_last_error("register_fonts: null path");
            return false;
        }
        bool found = false;
        found = mapnik::freetype_engine::register_fonts(path, recurse);
        return found;
    }

    EXPORT const char* fonts_face_names() {
        try {
            auto names = mapnik::freetype_engine::face_names();
            g_font_info_buffer = "[";
            for (size_t i = 0; i < names.size(); ++i) {
                g_font_info_buffer += "\"" + names[i] + "\"";
                if (i < names.size() - 1) g_font_info_buffer += ",";
            }
            g_font_info_buffer += "]";
            return g_font_info_buffer.c_str();
        } catch (...) {
            return "[]";
        }
    }

    EXPORT const char* fonts_get_cache() {
        try {
            // get_cache returns a map of font names to face objects (internal)
            // Since we cannot easily serialize the objects, we return the count as a JSON info
            auto const& cache = mapnik::freetype_engine::get_cache();
            g_font_info_buffer = "{\"count\":" + std::to_string(cache.size()) + "}";
            return g_font_info_buffer.c_str();
        } catch (...) {
            return "{}";
        }
    }

    EXPORT const char* fonts_get_mapping() {
        try {
            // Wir rufen die Funktion auf und binden das Ergebnis SOFORT an eine const-Referenz.
            // Das verhindert den Aufruf des gelöschten Copy-Constructors der Map/unique_ptr.
            const auto& mapping = mapnik::freetype_engine::get_mapping();

            std::string json = "{";
            bool first_entry = true;

            for (auto const& [name, path_info] : mapping) {
             if (!first_entry) json += ",";

             const std::string& path = path_info.second;

             json += "\"" + json_escape(name) + "\":\"" + json_escape(path) + "\"";
             first_entry = false;
            }

            json += "}";

            g_font_info_buffer = std::move(json);
            return g_font_info_buffer.c_str();

        } catch (const std::exception& e) {        // Logge e.what() falls möglich
            return "{}";
        } catch (...) {
            return "{}";
        }
    }
}
