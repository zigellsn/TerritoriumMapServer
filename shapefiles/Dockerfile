FROM docker.io/debian:trixie-slim

COPY --from=docker.io/astral/uv:latest /uv /uvx /bin/

ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends netcat-openbsd gdal-bin ca-certificates curl unzip
RUN --mount=type=bind,source=uv.lock,target=uv.lock,relabel=shared \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml,relabel=shared \
    uv sync --locked --no-install-project && \
    rm -rf /var/lib/apt/lists/*

COPY scripts/entrypoint.sh .

VOLUME ["/output"]

CMD ["sh", "entrypoint.sh"]
