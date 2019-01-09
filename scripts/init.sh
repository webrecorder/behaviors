#!/usr/bin/env bash

if [[ ! -d ./dist ]]; then
    mkdir dist
fi

if [[ ! -d ./build ]]; then
    mkdir build
fi

yarn install

