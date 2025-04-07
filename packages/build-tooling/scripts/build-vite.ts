#!/usr/bin/env vite-node
import { executeCommands } from './utils/utils'

executeCommands(['vite build', 'pnpm types:build'], 'Vite build')
