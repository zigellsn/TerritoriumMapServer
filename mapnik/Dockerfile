FROM docker.io/oven/bun:1-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    libmapnik4.0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

FROM base AS lib

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    libmapnik-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY wrapper/ ./wrapper/

# RUN g++ -shared -fPIC -Iinclude -o ../../../libwrapper.so *.cpp $(mapnik-config --cflags --libs)
RUN g++ -shared -fPIC -Iinclude -o libwrapper.so ./wrapper/*.cpp -I/usr/local/include -I/usr/local/include/mapnik/agg -I/usr/local/include/mapnik/deps -I/usr/include -I/usr/include/freetype2 -I/usr/include/libpng16 -I/usr/include/gdal -I/usr/include/postgresql -I/usr/include/cairo -I/usr/include/pixman-1 -DBOOST_PHOENIX_STL_TUPLE_H_ -DMAPNIK_MEMORY_MAPPED_FILE -DMAPNIK_HAS_DLCFN -DBIGINT -DBOOST_REGEX_HAS_ICU -DHAVE_JPEG -DMAPNIK_USE_PROJ -DMAPNIK_PROJ_VERSION=90600 -DHAVE_PNG -DHAVE_AVIF -DHAVE_WEBP -DHAVE_TIFF -DLINUX -DMAPNIK_THREADSAFE -DBOOST_SPIRIT_NO_PREDEFINED_TERMINALS=1 -DBOOST_PHOENIX_NO_PREDEFINED_TERMINALS=1 -DBOOST_SPIRIT_USE_PHOENIX_V3=1 -DNDEBUG -DHAVE_CAIRO -DGRID_RENDERER -std=c++20 -DU_USING_ICU_NAMESPACE=0 -fvisibility=hidden -fvisibility-inlines-hidden -pthread -ftemplate-depth-300 -O3 -L/usr/local/lib -lmapnik

FROM base AS install

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    libmapnik-dev \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --production --frozen-lockfile

FROM base AS prerelease

COPY --from=install /temp/dev/node_modules node_modules
COPY --from=lib /usr/src/app/libwrapper.so .
COPY src/ .
COPY package.json .

ENV NODE_ENV=production
RUN bun test --
RUN bun build app/app.ts --target bun --minify --production --outdir ./

FROM base AS release

RUN mkdir -p /input
VOLUME ["/input"]

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl gpg ca-certificates \
    && curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/keyrings/postgres.pgp \
    && echo "deb [signed-by=/etc/apt/keyrings/postgres.pgp] https://apt.postgresql.org/pub/repos/apt/ trixie-pgdg main" >> /etc/apt/sources.list.d/pgdg.list \
    && apt-get purge -y --auto-remove curl gpg \
    && apt-get update && apt-get install -y \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/app.js .
COPY --from=prerelease /usr/src/app/app/rendererWorker.ts .
COPY --from=prerelease /usr/src/app/app/renderer ./renderer/
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=lib /usr/src/app/libwrapper.so .
COPY ["scripts", "./scripts"]

# run the app
# USER bun
EXPOSE 5000/tcp
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
