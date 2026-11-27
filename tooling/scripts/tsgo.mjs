#!/usr/bin/env node
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

// Keep the native CLI isolated from TypeScript 6 consumers of the compiler API.
const require = createRequire(import.meta.url)
const compilerPackage = require.resolve('typescript-native/package.json')

await import(pathToFileURL(join(dirname(compilerPackage), 'bin/tsc')).href)
