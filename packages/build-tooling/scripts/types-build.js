#!/usr/bin/env node
import { executeCommands } from './utils/utils.js'

executeCommands(['tsc -p tsconfig.build.json', 'tsc-alias -p tsconfig.build.json'], 'types build')
