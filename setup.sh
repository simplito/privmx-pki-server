#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# MAIN_DIR="$(dirname $SCRIPT_DIR)"
ENV_FILE=$SCRIPT_DIR/.env
MONGO_VOLUME_DIR=$SCRIPT_DIR/volumes/mongo/data/db

if [ -f $ENV_FILE ]; then
    source $ENV_FILE
fi
# docker compose config
# MONGO_HOST_NAME=$MONGO_HOST_NAME MONGO_PORT=$MONGO_PORT MONGO_RS_NAME=$MONGO_RS_NAME MONGO_VOLUME_DIR=$MONGO_VOLUME_DIR docker compose config
MONGO_VOLUME_DIR=$MONGO_VOLUME_DIR docker compose up
