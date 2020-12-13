FROM postgis/postgis:13-3.0

RUN set -ex \
  && buildDeps=' \
  g++ \
  curl \
  debhelper \
  libicu-dev \
  wget \
  libkakasi2-dev \
  pandoc \
  postgresql-server-dev-12 \
  ca-certificates' \
  && apt-get update && apt-get install -y $buildDeps libkakasi2 --no-install-recommends \
  && mkdir -p /build \
  && cd /build \
  && LIBUTF8PROCVERSION=2.0.2-1 \
  && wget -O libutf8proc-dev.deb http://ftp.ch.debian.org/debian/pool/main/u/utf8proc/libutf8proc-dev_${LIBUTF8PROCVERSION}_amd64.deb \
  && wget -O libutf8proc1.deb http://ftp.ch.debian.org/debian/pool/main/u/utf8proc/libutf8proc2_${LIBUTF8PROCVERSION}_amd64.deb \
  && dpkg --install libutf8proc1.deb libutf8proc-dev.deb \
  && rm libutf8proc1.deb libutf8proc-dev.deb \
  && wget https://github.com/giggls/mapnik-german-l10n/archive/master.tar.gz \
  && tar -xvf master.tar.gz \
  && cd mapnik-german-l10n-master \
  && make && make install && make clean \
  && apt-get purge -y --auto-remove $buildDeps \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /build

ADD ./scripts/tune-postgis.sh /docker-entrypoint-initdb.d