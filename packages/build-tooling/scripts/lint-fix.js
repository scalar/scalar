#!/usr/bin/env node
import { globSync } from 'fast-glob'

import { executeCommand } from './utils/utils.js'

// Run Biome lint
executeCommand('biome lint --fix', 'Error during linting check')

// Check if Vue files exist and run ESLint on them if they do
const vueFiles = globSync('**/*.vue', { ignore: 'node_modules/**' })
if (vueFiles.length > 0) {
  executeCommand("pnpm eslint '**/*.vue' --fix", 'Error during Vue files linting')
}
