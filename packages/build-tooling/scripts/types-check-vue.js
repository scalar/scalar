#!/usr/bin/env node
import { executeCommand } from './utils/utils.js'

// Run Vue TypeScript type-checking without emitting files
executeCommand('vue-tsc --noEmit', 'Error during Vue TypeScript type checking')
