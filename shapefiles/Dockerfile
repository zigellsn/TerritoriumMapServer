FROM localhost/tms/python-base:slim

ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends mapnik-utils netcat-openbsd gdal-bin curl unzip && \
    pip install --no-cache-dir pyYAML requests psycopg2-binary && \
    rm -rf /var/lib/apt/lists/*

USER pyuser

ADD --chown=pyuser:users . .

VOLUME ["/output"]

COPY scripts/docker-entrypoint.sh .

CMD ["sh", "docker-entrypoint.sh"]
