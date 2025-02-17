#!/bin/bash
set -e

biome lint --fix
if find . -name "*.vue" -type f | grep -q .; then
  pnpm eslint '**/*.vue' --fix
fi

