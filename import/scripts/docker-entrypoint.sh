#!/bin/sh

if [ -n "${PGHOST}" ]; then
  OSMHOST="-H${PGHOST}"
fi

if [ -n "${PGPORT}" ]; then
  OSMPORT="-P${PGPORT}"
fi

if [ -n "${PGUSER}" ]; then
  OSMUSER="-U${PGUSER}"
fi

if [ -n "${PGUSER}" ]; then
  psql -U postgres -c "SELECT 1 FROM pg_roles WHERE rolname='${PGUSER}'" | grep -q 1 ||
    if [ -n "${PGPASSWORD}" ]; then
      psql -U postgres -c "CREATE ROLE ${PGUSER} WITH LOGIN PASSWORD '${PGPASSWORD}'"
    else
      psql -U postgres -c "CREATE ROLE ${PGUSER} WITH LOGIN"
    fi
fi
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = '${DBNAME}';" | grep -q 1 || createdb -U postgres -E UTF8 -O "${PGUSER}" "${DBNAME}" &&
  psql -U postgres -d "${DBNAME}" -c 'CREATE EXTENSION IF NOT EXISTS postgis;' &&
  psql -U postgres -d "${DBNAME}" -c 'CREATE EXTENSION IF NOT EXISTS hstore;' &&
  if [ ! -e ".env" ]; then
    cat >.env <<EOF
PG_WORK_MEM="${PG_WORK_MEM:-16MB}"
PG_MAINTENANCE_WORK_MEM="${PG_MAINTENANCE_WORK_MEM:-256MB}"
OSM2PGSQL_CACHE="${OSM2PGSQL_CACHE:-512}"
OSM2PGSQL_NUMPROC="${OSM2PGSQL_NUMPROC:-1}"
OSM2PGSQL_DATAFILE="${OSM2PGSQL_DATAFILE:-data.osm.pbf}"
EOF
    chmod a+rw .env
    export OSM2PGSQL_CACHE="${OSM2PGSQL_CACHE:-512}"
    export OSM2PGSQL_NUMPROC="${OSM2PGSQL_NUMPROC:-1}"
    export OSM2PGSQL_DATAFILE="/input/${OSM2PGSQL_DATAFILE:-data.osm.pbf}"
  fi

if [ "${STYLE:-de}" = 'de' ]; then
  psql -U postgres -d "${DBNAME}" -c 'CREATE EXTENSION IF NOT EXISTS osml10n CASCADE;'
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
    "${OSM2PGSQL_DATAFILE}"
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
    "${OSM2PGSQL_DATAFILE}"
fi
