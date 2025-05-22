#!/usr/bin/env vite-node
import { executeCommand } from './utils/utils'

// Run Vue TypeScript type-checking without emitting files
executeCommand('vue-tsc --noEmit', 'Error during Vue TypeScript type checking')
