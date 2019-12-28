# TerritoriumMapRenderer

## Requirements
- [Docker](https://www.docker.com/)
- [Docker Compose](https://github.com/docker/compose)
- unzip

## Workflow
``` bash
mkdir exchange
mkdir data
docker-compose build
docker-compose run db
```

Adjust and copy project.mml to ./exchange

``` bash
docker-compose run style
docker-compose run shapefiles
cd ./exchange/data/
wget https://tile.openstreetmap.de/shapefiles/river-polygons-reduced-3857.zip
unzip river-polygons-reduced-3857.zip
wget https://tile.openstreetmap.de/shapefiles/lakes-polygons-reduced-3857.zip
unzip lakes-polygons-reduced-3857.zip
wget https://tile.openstreetmap.de/shapefiles/ocean-polygons-reduced-3857.zip
unzip ocean-polygons-reduced-3857.zip
cd ../..
```

Download pbf file and place in ./exchange. Adjust in docker-compose.yml environment variable OSM2PGSQL_DATAFILE.

``` bash
docker-compose run import
docker-compose up mapnik
```