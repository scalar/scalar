#!/usr/bin/env node
import { executeCommand } from './utils/utils.js'
import { globSync } from 'glob'

// Run Biome lint with error diagnostic level
executeCommand('biome lint --diagnostic-level=error', 'Error during linting check')

// Check if Vue files exist and run ESLint on them if they do
const vueFiles = globSync('**/*.vue', { ignore: 'node_modules/**' })
if (vueFiles.length > 0) {
  executeCommand("pnpm eslint '**/*.vue'", 'Error during Vue files linting')
}
