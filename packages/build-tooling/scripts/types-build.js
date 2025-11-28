#!/usr/bin/env node

import as from 'ansis'

import { executeCommands } from './utils/utils.js'

const start = performance.now()
executeCommands(['tsc -p tsconfig.build.json', 'tsc-alias -p tsconfig.build.json'], 'types build')

const duration = (performance.now() - start) / 1000
console.log(as.green(`Types build completed in ${duration.toFixed(2)}s`))
