#!/bin/bash

set -e

if [ "$#" -ne 2 ]; then
    echo "Illegal number of parameters. Add source version tag and dst version tag"
    exit 1
fi

IMAGE_BASE=simplito/privmx-pki-server
SRC_VERSION=$1
DST_VERSION=$2


SRC_IMAGE_ID=$IMAGE_BASE:$SRC_VERSION

DST_IMAGE_ID=$IMAGE_BASE:$DST_VERSION

echo "Tagging image: $SRC_IMAGE_ID with: $DST_IMAGE_ID"
docker tag $SRC_IMAGE_ID $DST_IMAGE_ID


echo "Pushing to dockerhub..."
docker push $DST_IMAGE_ID
