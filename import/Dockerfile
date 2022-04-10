FROM debian:bullseye-slim

ENV VERSION 1.6.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    libboost-system1.74.0 \
    libboost-filesystem1.74.0 \
    libpq5 \
    zlib1g \
    libexpat1 \
    libbz2-1.0 \
    libproj19 \
    liblua5.3 \
    postgresql-client \
    netcat \
    && rm -rf /var/lib/apt/lists/*

RUN set -ex \
    && buildDeps=' \
    make \
    cmake \
    g++ \
    wget \
    ca-certificates \
    libboost-dev \
    libboost-system-dev \
    libboost-filesystem-dev \
    libexpat1-dev \
    zlib1g-dev \
    libbz2-dev \
    libpq-dev \
    libproj-dev \
    lua5.3 \
    liblua5.3-dev' \
    && apt-get update \
    && apt-get install -y $buildDeps --no-install-recommends \
    && mkdir -p /build \
    && cd /build \
    && wget https://github.com/openstreetmap/osm2pgsql/archive/${VERSION}.tar.gz \
    && tar -xvf ${VERSION}.tar.gz \
    && mkdir -p /build/osm2pgsql-${VERSION}/build \
    && cd /build/osm2pgsql-${VERSION}/build \
    && cmake .. \
    && make \
    && make install \
    && rm -rf /build \
    && apt-get purge -y --auto-remove $buildDeps \
    && rm -rf /var/lib/apt/lists/*

COPY scripts/docker-entrypoint.sh /usr/local/bin/

RUN mkdir -p /input
VOLUME ["/input"]

ENTRYPOINT ["sh", "/usr/local/bin/docker-entrypoint.sh"]

CMD ["osm2pgsql"]