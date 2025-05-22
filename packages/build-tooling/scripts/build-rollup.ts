#!/usr/bin/env vite-node
import { executeCommands } from './utils/utils'

executeCommands(['rollup -c rollup.config.ts --configPlugin typescript', 'pnpm types:build'], 'Rollup build')
