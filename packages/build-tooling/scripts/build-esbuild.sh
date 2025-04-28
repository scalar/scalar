#!/bin/bash
set -e

vite-node esbuild.ts
pnpm types:build
