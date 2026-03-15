#!/usr/bin/env node

/**
 * OpenAPI CLI playground: load a spec, explore CLI schema/snippets, and run commands.
 *
 * Usage:
 *   pnpm playground [spec-path]
 *   pnpm playground ../../galaxy/src/documents/3.1.yaml
 *
 * Then enter commands like: get /planets   or   planets getAllData --limit=2
 */

import { spawn } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

import { buildHelpSchema, loadSpec } from '@scalar/openapi-cli'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DEFAULT_SPEC = resolve(ROOT, '../../packages/galaxy/src/documents/3.1.yaml')

function print(msg: string): void {
  console.log(msg)
}

function runCli(specPath: string, args: string[]): Promise<void> {
  const cliPath = join(ROOT, 'dist/cli.js')
  return new Promise((resolvePromise, reject) => {
    const child = spawn('node', [cliPath, '-s', specPath, ...args], {
      stdio: 'inherit',
      cwd: ROOT,
      shell: false,
    })
    child.on('close', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`CLI exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

async function main(): Promise<void> {
  const specPath = process.argv[2] ?? DEFAULT_SPEC

  print('')
  print('  OpenAPI CLI Playground')
  print(`  Spec: ${specPath}`)
  print('')

  let spec: Awaited<ReturnType<typeof loadSpec>>
  try {
    spec = await loadSpec(specPath)
  } catch (err) {
    print(`  Failed to load spec: ${err instanceof Error ? err.message : String(err)}`)
    print('  Usage: pnpm playground [path-to-openapi.yaml]')
    process.exit(1)
  }

  const schema = buildHelpSchema(spec)

  print('  Two styles (path works with or without leading slash):')
  print('')
  print('  • Verb + path:   get /planets   get /planets -q limit=2   post /planets -d \'{"name":"Earth"}\'')
  print(
    '  • Resource + action:   planets getAllData   planets getAllData --limit=2   planets createPlanet --name=Earth',
  )
  print('')
  print(`  This spec: ${schema.operations.length} resource+action operations (${schema.verbs.join(', ')} verbs).`)
  print('')
  print('  Example commands to try (omit the openapi-cli -s <spec> part; we add it for you):')
  print('    get /planets')
  print('    get /planets -q limit=2')
  print('    planets getAllData --limit=2')
  print('    planets createPlanet --name=Earth')
  print('')
  print('  Type a command below, or "exit" / Ctrl+D to quit.')
  print('')

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  const next = (): void => {
    try {
      rl.question('  $ ', async (line) => {
        const trimmed = line?.trim()
        if (!trimmed || trimmed === 'exit' || trimmed === 'quit') {
          rl.close()
          process.exit(0)
        }
        const args = trimmed.split(/\s+/).filter(Boolean)
        try {
          await runCli(specPath, args)
        } catch {
          // exit code already shown by child
        }
        next()
      })
    } catch {
      // stdin closed (e.g. piped input ended)
      rl.close()
      process.exit(0)
    }
  }
  next()
}

void main()
