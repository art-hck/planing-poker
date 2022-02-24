FROM node:lts-alpine
WORKDIR /usr/src/app

COPY ./web-socket ./web-socket
RUN cd ./web-socket && npm ci

COPY ./common ./common
RUN cd ./common && npm ci

COPY ./certbot /etc/nginx/certbot

RUN cd ./web-socket && npm run build

CMD [ "node", "./web-socket/dist/server.js" ]
