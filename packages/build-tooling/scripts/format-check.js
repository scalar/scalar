#!/usr/bin/env node

import { executeCommands } from './utils/utils.js'

// Check formatting without making changes
executeCommands(['pnpm biome format', 'oxfmt --check'], 'format check')
