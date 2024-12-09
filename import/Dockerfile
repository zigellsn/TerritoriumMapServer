FROM docker.io/debian:bookworm-slim

ENV VERSION 1.2.1

RUN echo "deb http://deb.debian.org/debian bookworm-backports main contrib non-free non-free-firmware" >> /etc/apt/sources.list \
    && apt-get update \
    && apt-get install --no-install-recommends -y \
    osm2pgsql/bookworm-backports \
    netcat-openbsd \
    postgresql-15 \
    libunac1 \
    libicu72 \
    lua5.3 \
    lua-socket \
    python3 \
    python3-venv \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN set -ex \
    && buildDeps=' \
    wget \
    dpkg-dev \
    build-essential \
    debhelper \
    liblua5.3-dev \
    libunac1-dev \
    libicu-dev \
    libpython3-dev \
    python3-icu \
    pkg-config' \
    && apt-get update \
    && apt-get install -y $buildDeps --no-install-recommends \
    && mkdir -p /build \
    && cd /build \
    && wget https://github.com/giggls/osml10n/archive/refs/tags/v${VERSION}.tar.gz \
    && tar -xvf v${VERSION}.tar.gz \
    && cd /build/osml10n-${VERSION} \
    && mkdir -p /scripts \
    && cp openstreetmap-carto-hstore-only-l10n.lua /scripts \
    && make deb \
    && cd lua_unac \
    && make deb \
    && dpkg -i ../lua-unaccent_*.deb \
    && cd .. \
    && dpkg -i ../osml10n_*_all.deb \
    && make install-daemon \
    && rm -rf /build \
    && apt-get purge -y --auto-remove $buildDeps \
    && rm -rf /var/lib/apt/lists/*

ENV VENV=/usr/local/osml10n
ENV PATH="$VENV/bin:$PATH"

RUN mkdir -p /input
VOLUME ["/input"]

COPY scripts/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["sh", "/usr/local/bin/docker-entrypoint.sh"]

CMD ["osm2pgsql"]