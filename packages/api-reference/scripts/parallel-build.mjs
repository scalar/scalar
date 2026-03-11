#!/usr/bin/env node
/**
 * Runs build:default and build:standalone in parallel to reduce total build time.
 * Both write to different output dirs (dist/ vs dist/browser/) so they can run concurrently.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function run(cmd, args, name) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: 'inherit',
    })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${name} exited with ${code}`))))
    child.on('error', reject)
  })
}

const [defaultBuild, standaloneBuild] = await Promise.allSettled([
  run('pnpm', ['run', 'build:default'], 'build:default'),
  run('pnpm', ['run', 'build:standalone'], 'build:standalone'),
])

const failed = [defaultBuild, standaloneBuild].filter((r) => r.status === 'rejected')
if (failed.length) {
  failed.forEach((f) => console.error(f.reason?.message ?? f.reason))
  process.exit(1)
}
