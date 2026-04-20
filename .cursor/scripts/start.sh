#!/usr/bin/env bash
set -euo pipefail

echo "[cloud-start] Activating pnpm 10.16.1..."
corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@10.16.1 --activate >/dev/null 2>&1 || true

echo "[cloud-start] Running startup validation checks..."
node --version
pnpm --version
node .cursor/scripts/ensure-vue-test-utils-resolution.mjs

echo "[cloud-start] Startup validation completed."
