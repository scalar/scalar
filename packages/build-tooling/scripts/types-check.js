#!/usr/bin/env node
import { executeCommand } from './utils/utils.js'

// Run TypeScript type-checking without emitting files
executeCommand('tsc --noEmit', 'Error during TypeScript type checking')
