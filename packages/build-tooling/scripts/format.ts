#!/usr/bin/env vite-node
import { executeCommands } from './utils/utils'

executeCommands(['biome format --write', 'prettier --write . --ignore-path ../../.prettierignore'], 'formatting')
