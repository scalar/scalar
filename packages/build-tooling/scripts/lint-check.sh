#!/bin/bash
set -e

biome lint --diagnostic-level=error
pnpm eslint '**/*.vue'
