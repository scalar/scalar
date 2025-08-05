#!/usr/bin/env node
import { executeCommands } from './utils/utils.js'

executeCommands(['biome format --write', 'prettier --write . --ignore-path ../../.prettierignore'], 'formatting')
