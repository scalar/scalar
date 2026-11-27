import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { appendFileSync, chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), 'purge-jsdelivr.ts')

const PATHS = [
  '@scalar/api-reference',
  '@scalar/api-reference@latest/dist/browser/standalone.js',
  '@scalar/api-reference/esm.js',
  '@scalar/api-reference/dist/browser/standalone.esm.js',
]

/** Fake npm range lookups, with optional delays or changes to the latest tag. */
const fakeNpm = String.raw`
const { appendFileSync, existsSync, readFileSync } = require('node:fs')
if (process.argv[3] !== '@scalar/api-reference@>=2.0.0') {
  throw new Error('Expected an npm version range starting at the release')
}
const log = process.env.LOG_FILE
const calls = (existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter((line) => line === 'npm view').length : 0) + 1
appendFileSync(log, 'npm view\n')
const readyAfter = Number(process.env.NPM_READY_AFTER || '1')
setTimeout(() => {
  if (readyAfter === 0 || calls < readyAfter || JSON.parse(process.env.NPM_FAILURES).includes(calls)) {
    process.stderr.write('npm error 404 Not Found\n')
    process.exitCode = 1
    return
  }

  const tags = JSON.parse(process.env.NPM_LATEST_TAGS || '[]')
  const latest = tags[Math.min(calls - 1, tags.length - 1)] ?? '2.0.0'
  const release = { version: '2.0.0', 'dist-tags.latest': latest }
  const result = latest === '2.1.0' ? [release, { version: latest, 'dist-tags.latest': latest }] : release
  process.stdout.write(JSON.stringify(result))
}, Number(process.env.NPM_RESPONSE_DELAY || '0'))
`

type RunOptions = {
  initiallyFresh?: boolean
  purgeAll?: boolean
  waitForNpm?: boolean
  npmReadyAfter?: number
  npmLatestTags?: string[]
  npmResponseDelay?: number
  purgesNeeded?: Record<string, number>
  npmFailures?: number[]
  headFailure?: 'disconnect' | 'redirect' | 'httpError'
  purgeResults?: unknown[]
  statusResult?: unknown
  purgeStatus?: string
  npmTimeoutSeconds?: number
}

const run = async (options: RunOptions = {}): Promise<{ status: number | null; stdout: string; log: string[] }> => {
  const directory = mkdtempSync(join(tmpdir(), 'purge-jsdelivr-test-'))
  const npmPath = join(directory, 'npm.cjs')
  const logFile = join(directory, 'calls.log')
  const log = (): string[] => (existsSync(logFile) ? readFileSync(logFile, 'utf8').trim().split('\n') : [])

  writeFileSync(npmPath, `#!/usr/bin/env node\n${fakeNpm}`)
  chmodSync(npmPath, 0o755)

  const server = createServer((request, response) => {
    const url = request.url ?? ''
    if (url === '/status/request-id' && request.method === 'GET') {
      appendFileSync(logFile, 'status /status/request-id\n')
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify(options.statusResult))
      return
    }
    if (url === '/redirect-target' && request.method === 'HEAD') {
      response.end()
      return
    }
    const path = PATHS.find((alias) => url === `/npm/${alias}`)
    if (!path) {
      response.writeHead(404).end()
      return
    }
    if (request.method === 'HEAD') {
      if (path === PATHS[0] && options.headFailure) {
        if (options.headFailure === 'disconnect') {
          request.socket.destroy()
          return
        }
        response
          .writeHead(options.headFailure === 'redirect' ? 302 : 503, {
            location: '/redirect-target',
            'x-jsd-version': '2.0.0',
          })
          .end()
        return
      }
      const count = log().filter((line) => line === `purge ${path}`).length
      const needed = options.purgesNeeded?.[path] ?? 1
      response.setHeader(
        'x-jsd-version',
        options.initiallyFresh || (needed >= 0 && count >= needed) ? '2.0.0' : '1.0.0',
      )
      response.end()
      return
    }
    if (request.method !== 'GET') {
      response.writeHead(405).end()
      return
    }
    const previous = log().filter((line) => line === `purge ${path}`).length
    appendFileSync(logFile, `purge ${path}\n`)
    response.statusCode = Number(options.purgeStatus ?? 200)
    const result = path === PATHS[0] ? options.purgeResults?.[previous] : undefined
    const success = {
      status: 'finished',
      paths: { [`/npm/${path}`]: { throttled: false, providers: { CF: true, FY: true } } },
    }
    if (response.statusCode === 200) {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify(result ?? success))
    } else {
      response.end('Internal error')
    }
  })

  try {
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Expected a local HTTP port')
    }
    const origin = `http://127.0.0.1:${address.port}`
    const child = spawn(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        VERSION: '2.0.0',
        PURGE_ALL: String(options.purgeAll ?? false),
        WAIT_FOR_NPM: String(options.waitForNpm ?? true),
        CDN_ORIGIN: origin,
        PURGE_ORIGIN: origin,
        REQUEST_TIMEOUT_SECONDS: '10',
        NPM_TIMEOUT_SECONDS: String(options.npmTimeoutSeconds ?? 10),
        NPM_POLL_SECONDS: '0.05',
        SETTLE_SECONDS: '0',
        VERIFY_ATTEMPTS: '3',
        VERIFY_INTERVAL_SECONDS: '0',
        NPM_COMMAND: npmPath,
        LOG_FILE: logFile,
        NPM_READY_AFTER: String(options.npmReadyAfter ?? 1),
        NPM_FAILURES: JSON.stringify(options.npmFailures ?? []),
        NPM_LATEST_TAGS: JSON.stringify(options.npmLatestTags ?? []),
        NPM_RESPONSE_DELAY: String(options.npmResponseDelay ?? 0),
      },
    })
    let stdout = ''
    for (const stream of [child.stdout, child.stderr]) {
      stream.on('data', (data: Buffer) => {
        stdout += data.toString()
      })
    }
    const [status] = await once(child, 'close')
    return { status, stdout, log: log() }
  } finally {
    server.close()
    rmSync(directory, { recursive: true, force: true })
  }
}

describe('purge-jsdelivr', () => {
  it('does nothing when jsDelivr already serves the version', async () => {
    const { status, stdout, log } = await run({ initiallyFresh: true })

    expect(status).toBe(0)
    expect(stdout.trim()).toBe('jsDelivr already serves @scalar/api-reference@2.0.0; nothing to purge')
    expect(log).toStrictEqual([])
  })

  it('does nothing when the CDN is stale but this run did not publish', async () => {
    const { status, stdout, log } = await run({ waitForNpm: false })

    expect(status).toBe(0)
    expect(stdout).toContain('this run did not publish it; nothing to purge')
    expect(log).toStrictEqual([])
  })

  it('waits for npm to serve the version before purging every URL', async () => {
    const { status, stdout, log } = await run({ npmReadyAfter: 2, npmTimeoutSeconds: 10 })

    expect(status).toBe(0)
    expect(log).toStrictEqual(['npm view', 'npm view', 'npm view', ...PATHS.map((path) => `purge ${path}`)])
    expect(stdout).toContain('jsDelivr serves @scalar/api-reference@2.0.0 for every URL')
  })

  it('purges every alias on a release even when this CDN route is fresh', async () => {
    const { status, log } = await run({ initiallyFresh: true, purgeAll: true })

    expect(status).toBe(0)
    expect(log).toStrictEqual(['npm view', 'npm view', ...PATHS.map((path) => `purge ${path}`)])
  })

  it('requires a successful release purge even when this CDN route is fresh', async () => {
    const { status, stdout, log } = await run({ initiallyFresh: true, purgeAll: true, purgeStatus: '500' })

    expect(status).toBe(1)
    expect(log.filter((line) => line === 'purge @scalar/api-reference')).toHaveLength(3)
    expect(stdout).toContain('Could not confirm jsDelivr purge for @scalar/api-reference@2.0.0 after 3 attempt(s) for:')
  })

  it.each([
    ['failed provider', { throttled: false, providers: { CF: false, FY: true } }],
    ['throttled path', { throttled: true, providers: { CF: true } }],
    ['missing providers', { throttled: false }],
    ['malformed provider results', { throttled: false, providers: [true] }],
    ['missing path', undefined],
  ])('retries only the unconfirmed global purge for a %s', async (_, details) => {
    const firstPath = '/npm/@scalar/api-reference'
    const result = { status: 'finished', paths: { [firstPath]: details } }
    const { status, log } = await run({ initiallyFresh: true, purgeAll: true, purgeResults: [result] })
    expect(status).toBe(0)
    expect(log.filter((line) => line.startsWith('purge'))).toEqual([...PATHS, PATHS[0]].map((path) => `purge ${path}`))
  })

  it('polls an unfinished global purge until the providers confirm it', async () => {
    const result = {
      status: 'finished',
      paths: { '/npm/@scalar/api-reference': { throttled: false, providers: { CF: true } } },
    }
    const { status, log } = await run({
      initiallyFresh: true,
      purgeAll: true,
      purgeResults: [{ status: 'pending', id: 'request-id' }],
      statusResult: result,
    })
    expect(status).toBe(0)
    expect(log).toEqual([
      'npm view',
      'npm view',
      ...PATHS.map((path) => `purge ${path}`),
      'npm view',
      'status /status/request-id',
    ])
  })

  it('recovers from an npm lookup failure after the release was ready', async () => {
    const { status, log } = await run({ purgeAll: true, npmFailures: [2] })
    expect(status).toBe(0)
    expect(log).toEqual(['npm view', 'npm view', 'npm view', ...PATHS.map((path) => `purge ${path}`)])
  })

  it('stops after bounded confirmation failures without sending a purge', async () => {
    const { status, log, stdout } = await run({ purgeAll: true, npmFailures: [2, 3, 4, 5] })
    expect(status).toBe(1)
    expect(log).toEqual(Array(5).fill('npm view'))
    expect(stdout).toContain('  @scalar/api-reference/esm.js')
  })

  it('waits if npm still tags an older version as latest', async () => {
    const { status, log } = await run({ purgeAll: true, npmLatestTags: ['1.0.0', '2.0.0'] })

    expect(status).toBe(0)
    expect(log).toStrictEqual(['npm view', 'npm view', 'npm view', ...PATHS.map((path) => `purge ${path}`)])
  })

  it.each([
    ['before the wait', ['2.1.0']],
    ['during the cache settle', ['2.0.0', '2.1.0']],
  ])('skips purging when a newer release is latest %s', async (_, npmLatestTags) => {
    const { status, stdout, log } = await run({ purgeAll: true, npmLatestTags })

    expect(status).toBe(0)
    expect(stdout).toContain('Skipping @scalar/api-reference@2.0.0 because npm latest is now 2.1.0')
    expect(log).toStrictEqual(npmLatestTags.map(() => 'npm view'))
  })

  it('purges only the URLs that are still stale on the next attempt', async () => {
    const { status, stdout, log } = await run({ purgesNeeded: { '@scalar/api-reference/esm.js': 2 } })

    expect(status).toBe(0)
    expect(log).toStrictEqual([
      'npm view',
      'npm view',
      ...PATHS.map((path) => `purge ${path}`),
      'npm view',
      'purge @scalar/api-reference/esm.js',
    ])
    expect(stdout).toContain('Still stale after attempt 1: @scalar/api-reference/esm.js')
  })

  it('fails and names the stale URLs when purging never takes effect', async () => {
    const { status, stdout, log } = await run({ purgesNeeded: { '@scalar/api-reference/esm.js': -1 } })

    expect(status).toBe(1)
    expect(log.filter((line) => line === 'purge @scalar/api-reference/esm.js')).toHaveLength(3)
    expect(stdout).toContain('Could not confirm jsDelivr purge for @scalar/api-reference@2.0.0 after 3 attempt(s) for:')
    expect(stdout).toContain('  @scalar/api-reference/esm.js')
  })

  it.each(['disconnect', 'redirect', 'httpError'] as const)(
    'requires a successful final HEAD response with the version (%s)',
    async (headFailure) => {
      const path = '@scalar/api-reference'
      const { status, stdout, log } = await run({ headFailure })

      expect(status).toBe(1)
      expect(log).toStrictEqual([
        'npm view',
        'npm view',
        ...PATHS.map((entry) => `purge ${entry}`),
        'npm view',
        `purge ${path}`,
        'npm view',
        `purge ${path}`,
        'npm view',
      ])
      expect(stdout.trim().split('\n').at(-1)).toBe(`  ${path}`)
    },
  )

  it('fails without purging when npm never serves the version', async () => {
    const { status, stdout, log } = await run({ npmReadyAfter: 0, npmTimeoutSeconds: 1 })

    expect(status).toBe(1)
    expect(stdout).toContain('npm still does not serve @scalar/api-reference@2.0.0 as latest after 1s')
    expect(log.some((line) => line.startsWith('purge'))).toBe(false)
  })

  it('stops a registry request that would succeed after the polling deadline', async () => {
    const { status, stdout, log } = await run({ purgeAll: true, npmTimeoutSeconds: 1, npmResponseDelay: 3000 })

    expect(status).toBe(1)
    expect(stdout).toContain('npm still does not serve @scalar/api-reference@2.0.0 as latest after 1s')
    expect(log).toStrictEqual(['npm view'])
  })

  it('reports a failed purge request and lets the CDN check decide the result', async () => {
    const { status, stdout } = await run({ purgeStatus: '500', purgesNeeded: { '@scalar/api-reference': -1 } })

    expect(status).toBe(1)
    expect(stdout).toContain('Failed to purge @scalar/api-reference (HTTP 500')
    expect(stdout).toContain('Internal error')
  })
})
