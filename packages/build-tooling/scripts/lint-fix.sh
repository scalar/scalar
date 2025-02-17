#!/bin/bash
set -e

biome lint --fix
pnpm eslint '**/*.vue' --fix

