#!/usr/bin/env sh

if [ -n "${PGHOST}" ]; then
  OSMHOST="-H${PGHOST}"
fi

if [ -n "${PGPORT}" ]; then
  OSMPORT="-P${PGPORT}"
fi

if [ -n "${PGUSER}" ]; then
  OSMUSER="-U${PGUSER}"
fi

PG_WORK_MEM="${PG_WORK_MEM:-16MB}"
PG_MAINTENANCE_WORK_MEM="${PG_MAINTENANCE_WORK_MEM:-256MB}"
OSM2PGSQL_CACHE="${OSM2PGSQL_CACHE:-512}"
OSM2PGSQL_NUMPROC="${OSM2PGSQL_NUMPROC:-1}"
OSM2PGSQL_DATAFILE="${OSM2PGSQL_DATAFILE:-data.osm.pbf}"

psql -U "${PGUSER}" -d "${DBNAME}" -c 'CREATE EXTENSION IF NOT EXISTS hstore;'
if [ "${STYLE:-de}" = 'de' ]; then
  psql -U "${PGUSER}" -d "${DBNAME}" -c 'CREATE EXTENSION IF NOT EXISTS osml10n CASCADE;'
fi

if [ "${STYLE:-de}" = 'de' ]; then
  osm2pgsql -v \
    "${OSMHOST}" \
    "${OSMPORT}" \
    "${OSMUSER}" \
    --cache "${OSM2PGSQL_CACHE}" \
    --number-processes "${OSM2PGSQL_NUMPROC}" \
    --hstore \
    --multi-geometry \
    --database "${DBNAME}" \
    --slim \
    --drop \
    --style /input/hstore-only.style \
    --prefix planet_osm_hstore \
    --tag-transform-script /input/openstreetmap-carto.lua \
    /input/"${OSM2PGSQL_DATAFILE}"
  /input/views_osmde/apply-views.sh "${DBNAME}" "${STYLE:-de}"
else
  osm2pgsql -v \
    "${OSMHOST}" \
    "${OSMPORT}" \
    "${OSMUSER}" \
    --cache "${OSM2PGSQL_CACHE}" \
    --number-processes "${OSM2PGSQL_NUMPROC}" \
    --hstore \
    --multi-geometry \
    --database "${DBNAME}" \
    --slim \
    --drop \
    --style /input/openstreetmap-carto.style \
    --tag-transform-script /input/openstreetmap-carto.lua \
    /input/"${OSM2PGSQL_DATAFILE}"
fi
