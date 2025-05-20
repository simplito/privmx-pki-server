#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
MAIN_DIR="$(dirname $SCRIPT_DIR)"
if [ "$1" == "" ];then
    echo "Missing tag parameter for new image. Exiting..."
    exit -1;
fi

docker build --progress=plain -t simplito/privmx-pki-server:$1 $MAIN_DIR
