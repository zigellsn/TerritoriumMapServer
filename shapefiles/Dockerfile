FROM localhost/tms/python-base:slim

ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends mapnik-utils && \
    rm -rf /var/lib/apt/lists/*

USER pyuser

ADD --chown=pyuser:users . .

VOLUME ["/output"]

CMD ["python", "/output/get-shapefiles.py", "-f"]