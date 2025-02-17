#!/bin/bash
set -e

biome lint --diagnostic-level=error
if find . -name "*.vue" -type f | grep -q .; then
    pnpm eslint '**/*.vue'
fi
