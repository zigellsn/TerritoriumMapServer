#!/usr/bin/env sh
# From https://github.com/giggls/openstreetmap-carto-de

set -e
export PGUSER="${POSTGRES_USER}"
export PGPASSWORD="${POSTGRES_PASSWORD}"

"${psql[@]}" -c "ALTER SYSTEM SET work_mem='${PG_WORK_MEM:-16MB}';"
"${psql[@]}" -c "ALTER SYSTEM SET maintenance_work_mem='${PG_MAINTENANCE_WORK_MEM:-256MB}';"
