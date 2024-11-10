FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
  libmapnik3.1 \
  libmapnik-dev \
  postgresql-client-14 \
  netcat \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /input
VOLUME ["/input"]

ENV NODE_USER node
ENV HOME /home/$NODE_USER
ENV FONT_DIRECTORY $HOME/app/fonts
RUN mkdir $HOME/app

WORKDIR $HOME/app

COPY . .

RUN chown -R $NODE_USER $HOME/app

USER $NODE_USER

RUN npm install

RUN npm run build

EXPOSE 5000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
