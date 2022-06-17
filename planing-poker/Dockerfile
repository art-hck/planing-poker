FROM node:lts-alpine AS build
WORKDIR /usr/src/app

COPY ./planing-poker ./planing-poker
RUN cd ./planing-poker && npm ci

COPY ./common ./common
RUN cd ./common && npm ci

RUN cd ./planing-poker && npm run build

FROM nginx:stable
COPY ./nginx /etc/nginx/
COPY ./certbot /etc/nginx/certbot
COPY --from=build /usr/src/app/planing-poker/dist/planing-poker /usr/share/nginx/html
