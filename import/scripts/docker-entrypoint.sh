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
  psql -U postgres -c "SELECT 1 FROM pg_roles WHERE rolname='${PGUSER}'" | grep -q 1 || psql -U postgres -c "CREATE ROLE ${PGUSER} WITH LOGIN PASSWORD '${PGPASSWORD}'"
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
    export OSM2PGSQL_DATAFILE="/output/${OSM2PGSQL_DATAFILE:-data.osm.pbf}"
  fi

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
  --style /output/openstreetmap-carto.style \
  --tag-transform-script /output/openstreetmap-carto.lua \
  "${OSM2PGSQL_DATAFILE}"

# psql -d "${DBNAME}" -c "DELETE FROM planet_osm_ways AS w WHERE 0 = (SELECT COUNT(1) FROM planet_osm_nodes AS n WHERE n.id = ANY(w.nodes));"
# psql -d "${DBNAME}" -c "DELETE FROM planet_osm_rels AS r WHERE 0 = (SELECT COUNT(1) FROM planet_osm_nodes AS n WHERE n.id = ANY(r.parts)) AND 0 = (SELECT COUNT(1) FROM planet_osm_ways AS w WHERE w.id = ANY(r.parts));"
# psql -d "${DBNAME}" -c "REINDEX TABLE planet_osm_ways;"
# psql -d "${DBNAME}" -c "REINDEX TABLE planet_osm_rels;"
# psql -d "${DBNAME}" -c "VACUUM FULL;"
