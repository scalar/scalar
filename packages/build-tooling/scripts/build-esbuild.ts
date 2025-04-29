#!/usr/bin/env vite-node
import { executeCommands } from './utils/utils'

executeCommands(['vite-node esbuild.ts', 'pnpm types:build'], 'esbuild')
