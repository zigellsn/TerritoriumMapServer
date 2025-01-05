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

echo "Waiting for postgres..."

while ! nc -z "${PGHOST}" "${PGPORT}"; do
  sleep 0.1
done

echo "PostgreSQL started"

psql -U "${PGUSER}" -d "${DBNAME}" -c 'CREATE EXTENSION IF NOT EXISTS hstore;'

if [ "${STYLE:-de}" = 'de' ]; then
  python /usr/local/osml10n/bin/geo-transcript-srv.py -s &
  while ! nc -z "127.0.0.1" "8033"; do
    sleep 0.1
  done
  osm2pgsql -v \
    "${OSMHOST}" \
    "${OSMPORT}" \
    "${OSMUSER}" \
    --cache "${OSM2PGSQL_CACHE}" \
    --number-processes "${OSM2PGSQL_NUMPROC}" \
    --output flex \
    --database "${DBNAME}" \
    --slim \
    --verbose \
    --drop \
    --style /scripts/openstreetmap-carto-hstore-only-l10n.lua \
    --tag-transform-script /scripts/openstreetmap-carto.lua
    /input/"${OSM2PGSQL_DATAFILE}"
  /input/views_osmde/apply-views.sh "${DBNAME}"
  psql -d osm -f /input/views_osmde/functions.sql
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
