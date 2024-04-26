#!/bin/bash

# The source file is just YAML. We transform it to JSON to have both formats available.

./node_modules/.bin/scalar format ./dist/3.1.yaml --output ./dist/3.1.json
./node_modules/.bin/scalar format ./dist/latest.yaml --output ./dist/latest.json

