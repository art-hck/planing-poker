#!/usr/bin/bash

git pull
docker-compose build
docker-compose stop
docker-compose up -d
docker rmi $(docker images -f "dangling=true" -q)
