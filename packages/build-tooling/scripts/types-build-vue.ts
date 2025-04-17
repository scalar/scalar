#!/usr/bin/env vite-node
import { executeCommands } from './utils/utils'

executeCommands(['vue-tsc -p tsconfig.build.json', 'tsc-alias -p tsconfig.build.json'], 'Vue types build')
