#!/bin/bash

./node_modules/.bin/scalar format ./dist/3.1.yaml
./node_modules/.bin/scalar format ./dist/3.1.yaml --output ./dist/3.1.json

./node_modules/.bin/scalar format ./dist/latest.yaml
./node_modules/.bin/scalar format ./dist/latest.yaml --output ./dist/latest.json

