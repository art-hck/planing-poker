FROM node:lts-alpine
WORKDIR /usr/src/app

ADD ./web-socket/package*.json ./web-socket/
RUN cd ./web-socket && npm ci
COPY ./web-socket ./web-socket

ADD ./common/package*.json ./common/
RUN cd ./common && npm ci
COPY ./common ./common

COPY ./certbot /etc/nginx/certbot

RUN cd ./web-socket && npm run build

CMD [ "node", "./web-socket/dist/server.js" ]
