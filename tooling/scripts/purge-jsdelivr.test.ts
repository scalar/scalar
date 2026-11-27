import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), 'purge-jsdelivr.sh')

const PATHS = [
  '@scalar/api-reference',
  '@scalar/api-reference@latest/dist/browser/standalone.js',
  '@scalar/api-reference/esm.js',
  '@scalar/api-reference/dist/browser/standalone.esm.js',
]

/**
 * Fake curl. A HEAD request answers with the old version until the path has
 * been purged as often as PURGES_NEEDED says (a missing path needs one purge,
 * -1 never turns fresh). A purge request is logged and answers with
 * PURGE_STATUS. Every call is appended to LOG_FILE so tests can check order.
 */
const fakeCurl = String.raw`
const { appendFileSync, existsSync, readFileSync } = require('node:fs')
const args = process.argv.slice(2)
const url = args.find((arg) => arg.startsWith('https://'))
const log = process.env.LOG_FILE
const purgesNeeded = JSON.parse(process.env.PURGES_NEEDED || '{}')

if (args.includes('--head')) {
  const path = url.replace('https://cdn.jsdelivr.net/npm/', '')
  const response = JSON.parse(process.env.HEAD_RESPONSES || '{}')[path]
  if (response) {
    process.stdout.write(response.output ?? '')
    process.exitCode = response.exitCode ?? 0
    return
  }

  const purges = existsSync(log)
    ? readFileSync(log, 'utf8').split('\n').filter((line) => line === 'purge ' + path).length
    : 0
  const needed = purgesNeeded[path] ?? 1
  const fresh = process.env.INITIALLY_FRESH === 'true' || (needed >= 0 && purges >= needed)
  process.stdout.write('HTTP/2 200\r\nx-jsd-version: ' + (fresh ? '2.0.0' : '1.0.0') + '\r\n\r\n')
  process.exit(0)
}

const path = url.replace('https://purge.jsdelivr.net/npm/', '')
appendFileSync(log, 'purge ' + path + '\n')
const status = process.env.PURGE_STATUS || '200'
process.stdout.write(status === '200' ? '{"status":"finished","paths":{}}' : 'Internal error')
process.stdout.write('\n' + status)
`

/** Fake npm: serves 2.0.0 from its NPM_READY_AFTER-th call on (0 never does). */
const fakeNpm = String.raw`
const { appendFileSync, existsSync, readFileSync } = require('node:fs')
const log = process.env.LOG_FILE
const calls = (existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter((line) => line === 'npm view').length : 0) + 1
appendFileSync(log, 'npm view\n')
const readyAfter = Number(process.env.NPM_READY_AFTER || '1')
if (readyAfter > 0 && calls >= readyAfter) {
  process.stdout.write('2.0.0\n')
  process.exit(0)
}
process.stderr.write('npm error 404 Not Found\n')
process.exit(1)
`

type RunOptions = {
  initiallyFresh?: boolean
  waitForNpm?: boolean
  npmReadyAfter?: number
  purgesNeeded?: Record<string, number>
  headResponses?: Record<string, { output?: string; exitCode?: number }>
  purgeStatus?: string
  npmTimeoutSeconds?: number
}

const run = (options: RunOptions = {}): { status: number | null; stdout: string; log: string[] } => {
  const directory = mkdtempSync(join(tmpdir(), 'purge-jsdelivr-test-'))
  const curlPath = join(directory, 'curl.js')
  const npmPath = join(directory, 'npm.js')
  const logFile = join(directory, 'calls.log')

  writeFileSync(curlPath, `#!/usr/bin/env node\n${fakeCurl}`)
  writeFileSync(npmPath, `#!/usr/bin/env node\n${fakeNpm}`)
  chmodSync(curlPath, 0o755)
  chmodSync(npmPath, 0o755)

  const result = spawnSync('bash', [scriptPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      VERSION: '2.0.0',
      WAIT_FOR_NPM: options.waitForNpm === false ? 'false' : 'true',
      NPM_TIMEOUT_SECONDS: String(options.npmTimeoutSeconds ?? 1),
      NPM_POLL_SECONDS: '1',
      SETTLE_SECONDS: '0',
      VERIFY_ATTEMPTS: '3',
      VERIFY_INTERVAL_SECONDS: '0',
      CURL_COMMAND: curlPath,
      NPM_COMMAND: npmPath,
      LOG_FILE: logFile,
      INITIALLY_FRESH: options.initiallyFresh ? 'true' : 'false',
      NPM_READY_AFTER: String(options.npmReadyAfter ?? 1),
      PURGES_NEEDED: JSON.stringify(options.purgesNeeded ?? {}),
      HEAD_RESPONSES: JSON.stringify(options.headResponses ?? {}),
      PURGE_STATUS: options.purgeStatus ?? '200',
    },
  })

  const log = existsSync(logFile) ? readFileSync(logFile, 'utf8').trim().split('\n') : []
  return { status: result.status, stdout: result.stdout, log }
}

describe('purge-jsdelivr', () => {
  it('does nothing when jsDelivr already serves the version', () => {
    const { status, stdout, log } = run({ initiallyFresh: true })

    expect(status).toBe(0)
    expect(stdout.trim()).toBe('jsDelivr already serves @scalar/api-reference@2.0.0; nothing to purge')
    expect(log).toStrictEqual([])
  })

  it('does nothing when the CDN is stale but this run did not publish', () => {
    const { status, stdout, log } = run({ waitForNpm: false })

    expect(status).toBe(0)
    expect(stdout).toContain('this run did not publish it; nothing to purge')
    expect(log).toStrictEqual([])
  })

  it('waits for npm to serve the version before purging every URL', () => {
    const { status, stdout, log } = run({ npmReadyAfter: 2, npmTimeoutSeconds: 10 })

    expect(status).toBe(0)
    expect(log).toStrictEqual(['npm view', 'npm view', ...PATHS.map((path) => `purge ${path}`)])
    expect(stdout).toContain('jsDelivr serves @scalar/api-reference@2.0.0 for every URL')
  })

  it('purges only the URLs that are still stale on the next attempt', () => {
    const { status, stdout, log } = run({ purgesNeeded: { '@scalar/api-reference/esm.js': 2 } })

    expect(status).toBe(0)
    expect(log).toStrictEqual([
      'npm view',
      ...PATHS.map((path) => `purge ${path}`),
      'purge @scalar/api-reference/esm.js',
    ])
    expect(stdout).toContain('Still stale after attempt 1: @scalar/api-reference/esm.js')
  })

  it('fails and names the stale URLs when purging never takes effect', () => {
    const { status, stdout, log } = run({ purgesNeeded: { '@scalar/api-reference/esm.js': -1 } })

    expect(status).toBe(1)
    expect(log.filter((line) => line === 'purge @scalar/api-reference/esm.js')).toHaveLength(3)
    expect(stdout).toContain('jsDelivr still does not serve @scalar/api-reference@2.0.0 after 3 attempt(s) for:')
    expect(stdout).toContain('  @scalar/api-reference/esm.js')
  })

  it.each([
    ['the HEAD request fails', { exitCode: 7 }],
    [
      'only the redirect reports the expected version',
      { output: 'HTTP/2 302\r\nx-jsd-version: 2.0.0\r\n\r\nHTTP/2 200\r\n\r\n' },
    ],
    ['the final response is an error', { output: 'HTTP/2 503\r\nx-jsd-version: 2.0.0\r\n\r\n' }],
  ])('fails verification when %s', (_, response) => {
    const path = '@scalar/api-reference'
    const { status, stdout, log } = run({ headResponses: { [path]: response } })

    expect(status).toBe(1)
    expect(log).toStrictEqual(['npm view', ...PATHS.map((entry) => `purge ${entry}`), `purge ${path}`, `purge ${path}`])
    expect(stdout.trim().split('\n').at(-1)).toBe(`  ${path}`)
  })

  it('fails without purging when npm never serves the version', () => {
    const { status, stdout, log } = run({ npmReadyAfter: 0 })

    expect(status).toBe(1)
    expect(stdout).toContain('npm still does not serve @scalar/api-reference@2.0.0 after 1s')
    expect(log.some((line) => line.startsWith('purge'))).toBe(false)
  })

  it('reports a failed purge request and lets the CDN check decide the result', () => {
    const { status, stdout } = run({ purgeStatus: '500', purgesNeeded: { '@scalar/api-reference': -1 } })

    expect(status).toBe(1)
    expect(stdout).toContain('Failed to purge @scalar/api-reference (HTTP 500)')
    expect(stdout).toContain('Internal error')
  })
})
