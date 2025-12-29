# TerritoriumMapServer

## Requirements
- [Podman](https://podman.io/docs/installation)
- [Podman Compose](https://github.com/containers/podman-compose)
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
podman-compose run geodb
```

Copy project.mml from [openstreetmap-carto](https://github.com/gravitystorm/openstreetmap-carto) or 
[openstreetmap-carto-de](https://github.com/giggls/openstreetmap-carto-de) to ./exchange and
adjust if necessary.

``` bash
podman-compose -f podman-compose.yml -f podman-compose.import.yml --podman-build-args '--format docker' run style
podman-compose -f podman-compose.yml -f podman-compose.import.yml --podman-build-args '--format docker' run shapefiles
```

Download the pbf file and place it in ./exchange. Adjust in ./frontend/.env environment variable OSM2PGSQL_DATAFILE accordingly.

Provide `key.pem` and `crt.pem`  files in `./nginx/certs/`

Copy `mapnik/.npmrc.example` to `mapnik/.npmrc` and add your GitHub-Token 

To serve over port 80, it may be necessary to add the line `net.ipv4.ip_unprivileged_port_start=80` to `/etc/sysctl.conf`

Then run
``` bash
podman-compose -f podman-compose.yml -f podman-compose.import.yml --podman-build-args '--format docker' run import
podman-compose -f podman-compose.yml -f podman-compose.prod.yml --podman-build-args '--format docker' up -d --build
podman-compose -f podman-compose.yml -f podman-compose.prod.yml --podman-build-args '--format docker' exec frontend python manage.py createsuperuser
```

You may have to use podman unshare to make the shared folders accessible.
``` bash
podman unshare chown -R 1000:100 exchange
podman unshare chown -R 1000:100 static
podman unshare chown -R 1000:100 files
```