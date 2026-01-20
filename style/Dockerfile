FROM docker.io/oven/bun:1-slim

ENV VERSION=v4.50.1
ENV PLATFORM=linux_amd64

RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && wget https://github.com/mikefarah/yq/releases/download/${VERSION}/yq_${PLATFORM} -O /usr/local/bin/yq \
  && chmod +x /usr/local/bin/yq

ENV USER bun
ENV HOME /home/$BUN

RUN mkdir -p /output
VOLUME ["/output"]
WORKDIR $HOME/app

RUN bun install carto

COPY scripts/create_carto.sh .

CMD ["sh", "create_carto.sh"]
