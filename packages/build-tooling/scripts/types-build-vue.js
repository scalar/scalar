#!/usr/bin/env node
import { executeCommands } from './utils/utils.js'
import as from 'ansis'

const start = performance.now()
executeCommands(['vue-tsc -p tsconfig.build.json', 'tsc-alias -p tsconfig.build.json'], 'Vue types build')

const duration = (performance.now() - start) / 1000
console.log(as.green(`Vue types build completed in ${duration.toFixed(2)}s`))
