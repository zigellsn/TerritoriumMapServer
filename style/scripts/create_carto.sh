#!/usr/bin/env sh

DE_VERSION=5.4.0-de0
EN_VERSION=5.7.0

if [ "${STYLE:-de}" = 'de' ]; then
  wget https://github.com/giggls/openstreetmap-carto-de/archive/v${DE_VERSION}.tar.gz
  tar -xvf v${DE_VERSION}.tar.gz
  mv openstreetmap-carto-de-${DE_VERSION} osm-carto
  # cp -f /output/project.mml ./osm-carto/
  echo "Creating osm-de.xml..."
  # node makestyle.js ./osm-carto/project.mml
  carto -a "3.0.22" ./osm-carto/project.mml >/output/osm-de.xml
  cp -rf ./osm-carto/symbols-de /output/
  cp -rf ./osm-carto/views_osmde /output/
  cp -f ./osm-carto/osm_tag2num.sql /output/
  cp -f ./osm-carto/hstore-only.style /output/
else
  wget https://github.com/gravitystorm/openstreetmap-carto/archive/v${EN_VERSION}.tar.gz
  tar -xvf v${EN_VERSION}.tar.gz
  mv openstreetmap-carto-${EN_VERSION} osm-carto
  cp -f /output/project.mml ./osm-carto/
  echo "Creating osm.xml..."
  # node makestyle.js ./osm-carto/project.mml
  carto -a "3.0.22" ./osm-carto/project.mml >/output/osm.xml
fi
cp -f ./osm-carto/openstreetmap-carto.* /output/
cp -rf ./osm-carto/symbols /output/
cp -f ./osm-carto/scripts/get-shapefiles.py /output/
echo "Finished."
