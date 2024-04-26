#!/bin/bash

# The source file is just YAML. We transform it to JSON to have both formats available.

npx @scalar/cli format ./dist/3.1.yaml --output ./dist/3.1.json
npx @scalar/cli format ./dist/latest.yaml --output ./dist/latest.json

