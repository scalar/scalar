import { executeCommand } from './utils/utils'

// Run TypeScript type-checking without emitting files
executeCommand('tsc --noEmit', 'Error during TypeScript type checking')
