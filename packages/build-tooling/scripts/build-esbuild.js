#!/usr/bin/env node
import { executeCommands } from './utils/utils.js'

executeCommands(['npx vite-node esbuild.ts', 'pnpm types:build'], 'esbuild')
