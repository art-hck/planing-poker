FROM node:lts-alpine AS build
WORKDIR /usr/src/app
COPY ./planing-poker/package.json ./planing-poker/package-lock.json ./planing-poker/
RUN cd ./planing-poker && npm ci --only=production
COPY ./planing-poker ./planing-poker
COPY ./common ./common
RUN cd ./planing-poker && npm run build

FROM nginx:stable
COPY ./planing-poker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/planing-poker/dist/planing-poker /usr/share/nginx/html
