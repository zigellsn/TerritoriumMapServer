# TerritoriumMapServer

## Requirements
- [Docker](https://www.docker.com/)
- [Docker Compose](https://github.com/docker/compose)
- unzip
- wget or curl or ...

## Workflow

Copy the file .env.example to .env and adjust to your needs.
``` bash
cp ./frontend/.env.example ./frontend/.env
```

``` bash
mkdir exchange
mkdir data
mkdir geodata
mkdir files
mkdir static
docker-compose run geodb
```

Copy project.mml from [openstreetmap-carto](https://github.com/gravitystorm/openstreetmap-carto) or 
[openstreetmap-carto-de](https://github.com/giggls/openstreetmap-carto-de) to ./exchange and
adjust if necessary.

``` bash
docker-compose -f docker-compose.yml -f docker-compose.import.yml run style
docker-compose -f docker-compose.yml -f docker-compose.import.yml run shapefiles
cd ./exchange/data/
wget https://tile.openstreetmap.de/shapefiles/river-polygons-reduced-3857.zip
unzip river-polygons-reduced-3857.zip
wget https://tile.openstreetmap.de/shapefiles/lakes-polygons-reduced-3857.zip
unzip lakes-polygons-reduced-3857.zip
wget https://tile.openstreetmap.de/shapefiles/ocean-polygons-reduced-3857.zip
unzip ocean-polygons-reduced-3857.zip
cd ../..
```

Download pbf file and place in ./exchange. Adjust in ./frontend/.env environment variable OSM2PGSQL_DATAFILE accordingly.

Provide key.pem and crt.pem files in ./nginx/certs/

Then run
``` bash
docker-compose -f docker-compose.yml -f docker-compose.import.yml run import
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec frontend python manage.py createsuperuser
```