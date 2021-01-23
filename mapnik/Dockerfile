FROM node:14-buster-slim

RUN apt-get update && apt-get install -y \
  libmapnik3.0 \
  libmapnik-dev \
  postgresql-client \
  netcat \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_USER node
ENV HOME /home/$NODE_USER
RUN mkdir $HOME/app && \
    chown -R $NODE_USER $HOME/app

RUN mkdir -p /input
VOLUME ["/input"]
WORKDIR $HOME/app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./

COPY . .

RUN npm run build

USER $NODE_USER

EXPOSE 5000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
