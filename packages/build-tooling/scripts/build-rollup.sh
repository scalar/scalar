#!/bin/bash
set -e

rollup -c rollup.config.ts --configPlugin typescript
pnpm types:build
