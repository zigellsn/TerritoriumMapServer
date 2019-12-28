#!/bin/sh

if [ "${STYLE:-de}" = 'de' ]; then
  git clone https://github.com/giggls/openstreetmap-carto-de.git osm-carto
  cp -f /output/project.mml ./osm-carto/
  echo "Creating osm-de.xml..."
  # node makestyle.js ./osm-carto/project.mml
  carto -a "3.0.22" ./osm-carto/project.mml >/output/osm-de.xml
  cp -rf ./osm-carto/symbols-de /output/
  cp -rf ./osm-carto/views_osmde /output/
  cp -f ./osm-carto/osm_tag2num.sql /output/
  cp -f ./osm-carto/hstore-only.style /output/
else
  git clone https://github.com/gravitystorm/openstreetmap-carto.git osm-carto
  cp -f /output/project.mml ./osm-carto/
  echo "Creating osm.xml..."
  # node makestyle.js ./osm-carto/project.mml
  carto -a "3.0.22" ./osm-carto/project.mml >/output/osm.xml
fi
cp -f ./osm-carto/openstreetmap-carto.* /output/
cp -rf ./osm-carto/symbols /output/
echo "Finished."
