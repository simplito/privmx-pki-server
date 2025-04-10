#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
MAIN_DIR="$(dirname $SCRIPT_DIR)"

cd $MAIN_DIR
npm ci
npm run compile

# pack script
VERSION=ci
BUILD_DIR=$MAIN_DIR/build

rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR
echo $VERSION > $BUILD_DIR/version
cp -r $MAIN_DIR/out $BUILD_DIR
cp -r $MAIN_DIR/public $BUILD_DIR``
mkdir -p $BUILD_DIR/src/docs
cp -r $MAIN_DIR/src/docs/docs.json $BUILD_DIR/src/docs
cp $MAIN_DIR/.npmrc $BUILD_DIR
cp $MAIN_DIR/package.json $BUILD_DIR
cp $MAIN_DIR/package-lock.json $BUILD_DIR
touch $BUILD_DIR/production
cd $BUILD_DIR
npm ci --omit=dev
