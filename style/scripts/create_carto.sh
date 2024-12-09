#!/usr/bin/env sh

DE_VERSION=5.4.0-de0
EN_VERSION=5.7.0

if [ "${STYLE:-de}" = 'de' ]; then
  wget https://github.com/giggls/openstreetmap-carto-de/archive/v${DE_VERSION}.tar.gz
  tar -xvf v${DE_VERSION}.tar.gz
  mv openstreetmap-carto-de-${DE_VERSION} osm-carto
  echo "Creating osm-de.xml..."
  carto -a "3.0.22" ./osm-carto/project.mml >/output/osm-de.xml
  cp -rf ./osm-carto/symbols-de /output/
  cp -rf ./osm-carto/views_osmde /output/
else
  wget https://github.com/gravitystorm/openstreetmap-carto/archive/v${EN_VERSION}.tar.gz
  tar -xvf v${EN_VERSION}.tar.gz
  mv openstreetmap-carto-${EN_VERSION} osm-carto
  cp -f /output/project.mml ./osm-carto/
  echo "Creating osm.xml..."
  carto -a "3.0.22" ./osm-carto/project.mml >/output/osm.xml
  cp -f ./osm-carto/scripts/get-fonts.sh /output/
fi
cp -f ./osm-carto/openstreetmap-carto.* /output/
cp -rf ./osm-carto/symbols /output/
cp -rf ./osm-carto/patterns /output/
cp -f ./osm-carto/scripts/get-external-data.py /output/
cp -f ./osm-carto/external-data.yml /output/
echo "Finished."
