#!/usr/bin/env node
import { executeCommands } from './utils/utils.js'

executeCommands(['rollup -c rollup.config.ts --configPlugin typescript', 'pnpm types:build'], 'Rollup build')
