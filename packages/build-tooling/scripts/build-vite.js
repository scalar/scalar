#!/usr/bin/env node
import { executeCommands } from './utils/utils.js'

executeCommands(['vite build', 'pnpm types:build'], 'Vite build')
