FROM node:12-buster-slim

RUN apt-get update && apt-get install -y \
  libmapnik3.0 \
  libmapnik-dev \
  postgresql-client \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_USER node
ENV HOME /home/$NODE_USER
RUN mkdir $HOME/app && \
    chown -R $NODE_USER $HOME/app

RUN mkdir -p /input
VOLUME ["/input"]
WORKDIR $HOME/app
USER $NODE_USER

COPY ../package.json ./

RUN npm install

COPY .. .
EXPOSE 5000

CMD [ "node", "./bin/www" ]
