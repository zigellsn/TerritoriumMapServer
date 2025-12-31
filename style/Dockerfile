FROM docker.io/oven/bun:1-slim

RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV USER bun
ENV HOME /home/$BUN

RUN mkdir -p /output
VOLUME ["/output"]
WORKDIR $HOME/app

RUN bun install carto

COPY scripts/create_carto.sh .

CMD ["sh", "create_carto.sh"]
