#!/usr/bin/env vite-node
import { executeCommands } from './utils/utils'

// Check formatting without making changes
executeCommands(['biome format --check', 'prettier --check . --ignore-path ../../.prettierignore'], 'format check')
