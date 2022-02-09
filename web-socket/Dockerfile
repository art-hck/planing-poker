FROM node:lts-alpine
WORKDIR /usr/src/app
COPY ./web-socket/package.json ./web-socket/package-lock.json ./web-socket/
RUN cd ./web-socket && npm ci
COPY ./web-socket ./web-socket
COPY ./common ./common
RUN cd ./web-socket && npm run build
CMD [ "node", "./web-socket/dist/server.js" ]
