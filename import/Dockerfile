FROM docker.io/debian:trixie-slim

ENV VERSION 1.3.0

RUN echo "deb http://deb.debian.org/debian trixie-backports main contrib non-free non-free-firmware" >> /etc/apt/sources.list \
    && apt-get update \
    && apt-get install --no-install-recommends -y curl gpg ca-certificates \
    && curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/keyrings/postgres.pgp \
    && echo "deb [signed-by=/etc/apt/keyrings/postgres.pgp] http://apt.postgresql.org/pub/repos/apt/ trixie-pgdg main" >> /etc/apt/sources.list.d/pgdg.list \
    && apt-get purge -y --auto-remove curl gpg \
    && apt-get update \
    && apt-get install --no-install-recommends -y \
    osm2pgsql/trixie-backports \
    netcat-openbsd \
    postgresql-18 \
    libunac1 \
    libicu76 \
    lua5.3 \
    lua-socket \
    python3 \
    python3-venv \
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

COPY scripts/entrypoint.sh /usr/local/bin/

ENTRYPOINT ["sh", "/usr/local/bin/entrypoint.sh"]

CMD ["osm2pgsql"]
