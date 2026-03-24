#!/usr/bin/env bash
set -euo pipefail

echo "Validating OpenAPI documents..."

npx @scalar/cli validate src/documents/3.1.yaml
npx @scalar/cli validate dist/3.1.yaml
npx @scalar/cli validate dist/3.1.json
npx @scalar/cli validate dist/latest.yaml
npx @scalar/cli validate dist/latest.json

echo "All documents valid."
