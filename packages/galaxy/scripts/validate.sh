#!/usr/bin/env bash
set -euo pipefail

echo "Validating OpenAPI documents..."

npx @scalar/cli document validate src/documents/3.1.yaml
npx @scalar/cli document validate src/documents/3.2.yaml
npx @scalar/cli document validate dist/3.1.yaml
npx @scalar/cli document validate dist/3.1.json
npx @scalar/cli document validate dist/3.2.yaml
npx @scalar/cli document validate dist/3.2.json
npx @scalar/cli document validate dist/latest.yaml
npx @scalar/cli document validate dist/latest.json

echo "All documents valid."
