#!/usr/bin/env vite-node
import { executeCommands } from './utils/utils'

executeCommands(['npx vite-node esbuild.ts', 'pnpm types:build'], 'esbuild')
