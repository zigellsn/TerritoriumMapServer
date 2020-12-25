FROM node:15-buster-slim

RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_USER node
ENV HOME /home/$NODE_USER

RUN mkdir -p /output
VOLUME ["/output"]
WORKDIR $HOME/app

COPY package.json .
RUN npm install -g carto
RUN npm install

COPY scripts/create_carto.sh .
COPY makestyle.js .

CMD ["sh", "create_carto.sh"]
