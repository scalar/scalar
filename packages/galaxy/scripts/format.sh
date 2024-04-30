#!/bin/bash

# The source file is just YAML. We transform it to JSON to have both formats available.

pnpm dlx @scalar/cli format ./dist/3.1.yaml --output ./dist/3.1.json
pnpm dlx @scalar/cli format ./dist/latest.yaml --output ./dist/latest.json

