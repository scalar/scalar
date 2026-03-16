#!/usr/bin/env node

import { executeCommands } from './utils/utils.js'

executeCommands(['biome format --write', 'oxfmt --ignore-path ../../.prettierignore'], 'formatting')
