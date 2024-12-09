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
```

Download pbf file and place in ./exchange. Adjust in ./frontend/.env environment variable OSM2PGSQL_DATAFILE accordingly.

Provide key.pem and crt.pem files in ./nginx/certs/

Copy mapnik/npmrc.example to mapnik/npmrc and add your GitHub-Token 

Then run
``` bash
docker-compose -f docker-compose.yml -f docker-compose.import.yml run import
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec frontend python manage.py createsuperuser
```

## Podman
Since the Dockerfiles have already been migrated to Podman and podman-compose, use the aforementioned docker-compose commands like this:
``` bash
podman-compose -f docker-compose.yml -f docker-compose.import.yml --podman-build-args '--format docker' run style
...
```

You might have to use podman unshare to make the shared folders accessible.
``` bash
podman unshare chown -R 1000:100 exchange
podman unshare chown -R 1000:100 static
podman unshare chown -R 1000:100 files
```