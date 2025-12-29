FROM localhost/tms/python-base:slim

ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends mapnik-utils netcat-openbsd gdal-bin curl unzip && \
    uv add --no-cache pyYAML requests psycopg2-binary && \
    rm -rf /var/lib/apt/lists/*

ADD . .

VOLUME ["/output"]

COPY scripts/entrypoint.sh .

CMD ["sh", "entrypoint.sh"]
