#!/usr/bin/env vite-node
import { executeCommands } from './utils/utils'

executeCommands(['pnpm vite-node esbuild.ts', 'pnpm types:build'], 'esbuild')
