#!/usr/bin/env sh

DE_VERSION=5.9.0-de7
EN_VERSION=5.9.0

mkdir osm-carto

if [ "${STYLE:-de}" = 'de' ]; then
  wget -O- https://github.com/giggls/openstreetmap-carto-de/archive/v${DE_VERSION}.tar.gz | tar -xz -C osm-carto --strip-components=1
  [ -f "/output/project.mml" ] && cp -f /output/project.mml ./osm-carto/
  echo "Creating osm-de.xml..."
  /usr/local/bin/yq -i '._parts.osm2pgsql.dbname = env(DBNAME)' ./osm-carto/project.mml
  sed -i 's/!!merge <<: /<<: /g' ./osm-carto/project.mml
  bun run carto -a "3.0.22" ./osm-carto/project.mml >/output/osm-de.xml
  cp -rf ./osm-carto/symbols-de /output/
else
  wget -O- https://github.com/gravitystorm/openstreetmap-carto/archive/v${EN_VERSION}.tar.gz | tar -xz -C osm-carto --strip-components=1
  [ -f "/output/project.mml" ] && cp -f /output/project.mml ./osm-carto/
  echo "Creating osm.xml..."
  /usr/local/bin/yq -i '._parts.osm2pgsql.dbname = env(DBNAME)' ./osm-carto/project.mml
  sed -i 's/!!merge <<: /<<: /g' ./osm-carto/project.mml
  bun run carto -a "3.0.22" ./osm-carto/project.mml >/output/osm.xml
  cp -f ./osm-carto/scripts/get-fonts.sh /output/
fi
cp -f ./osm-carto/openstreetmap-carto* /output/
cp -f ./osm-carto/functions.sql /output/
cp -rf ./osm-carto/symbols /output/
cp -rf ./osm-carto/patterns /output/
cp -f ./osm-carto/scripts/get-external-data.py /output/
cp -f ./osm-carto/external-data.yml /output/
echo "Finished."
