#!/usr/bin/env vite-node
import { executeCommands } from './utils/utils'

executeCommands(['tsc -p tsconfig.build.json', 'tsc-alias -p tsconfig.build.json'], 'types build')
