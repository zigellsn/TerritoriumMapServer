FROM docker.io/node:24-trixie-slim

RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_USER node
ENV HOME /home/$NODE_USER

RUN mkdir -p /output
VOLUME ["/output"]
WORKDIR $HOME/app

RUN npm install -g carto

COPY scripts/create_carto.sh .

CMD ["sh", "create_carto.sh"]
