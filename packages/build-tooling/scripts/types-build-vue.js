#!/usr/bin/env node
import { executeCommands } from './utils/utils.js'

executeCommands(['vue-tsc -p tsconfig.build.json', 'tsc-alias -p tsconfig.build.json'], 'Vue types build')
