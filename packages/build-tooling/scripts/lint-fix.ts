import { executeCommand } from './utils/utils'

// Run linting with auto-fix
executeCommand('biome check --apply .', 'Error during linting fix')
