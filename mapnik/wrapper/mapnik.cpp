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
#include <mapnik/version.hpp>
#include <mapnik/debug.hpp>

#include <string>
#include <cstdlib>
#include <cstring>

extern "C" {
static thread_local std::string g_last_error;

void _set_last_error(const char *msg) {
    g_last_error = (msg ? msg : "");
}

EXPORT const char *last_error() {
    return g_last_error.c_str();
}

EXPORT void last_error_clear() {
    g_last_error.clear();
}

EXPORT int32_t supports_cairo() {
#if defined(MAPNIK_USE_CAIRO)
    return 1;
#else
    return 0;
#endif
}

EXPORT int32_t version() {
    return MAPNIK_VERSION;
}

EXPORT void set_log_severity(int32_t level) {
    switch (level) {
        case 0: mapnik::logger::instance().set_severity(mapnik::logger::debug); break;
        case 1: mapnik::logger::instance().set_severity(mapnik::logger::warn); break;
        case 2: mapnik::logger::instance().set_severity(mapnik::logger::error); break;
        default: mapnik::logger::instance().set_severity(mapnik::logger::none); break;
    }
}
}
