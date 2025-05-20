#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Illegal number of parameters"
    exit 1
fi

IMAGE_BASE=simplito/privmx-pki-server
TAG=$1

IMAGE_TAG=$IMAGE_BASE:$TAG
LATEST_TAG=$IMAGE_BASE:latest

docker buildx imagetools create -t $LATEST_TAG $IMAGE_TAG

echo ========================
echo ORIGINAL $IMAGE_TAG
docker manifest inspect $IMAGE_TAG

echo ========================
echo LATEST $LATEST_TAG
docker manifest inspect $LATEST_TAG