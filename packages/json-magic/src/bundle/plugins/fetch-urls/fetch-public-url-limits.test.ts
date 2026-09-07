import { type Server, createServer } from 'node:http'
import { gzipSync } from 'node:zlib'

import { describe, expect, it, vi } from 'vitest'

import { createFetchBudget } from './fetch-budget'
import { fetchPublicUrl } from './fetch-public-url'

// Exercise the real transport against a local fixture after the separately tested public-host check.
vi.mock('./is-blocked-host', () => ({
  resolvePublicHost: () => Promise.resolve([{ address: '127.0.0.1', family: 4 }]),
}))

const listen = async (server: Server): Promise<number> => {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Expected a TCP address')
  }
  return address.port
}

const close = async (server: Server): Promise<void> => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
}

describe('fetch-public-url-limits', () => {
  it('rejects a compressed response based on decompressed stream bytes', async () => {
    const compressed = gzipSync(JSON.stringify({ value: 'x'.repeat(10_000) }))
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'Content-Encoding': 'gzip', 'Content-Length': compressed.byteLength })
      response.end(compressed)
    })
    const port = await listen(server)
    try {
      const budget = createFetchBudget({ maxResponseBytes: 100 })
      await expect(fetchPublicUrl(`http://fixture.example:${port}`, undefined, budget, budget.start())).rejects.toThrow(
        'response byte limit',
      )
    } finally {
      await close(server)
    }
  })

  it('aborts a stalled response and closes its connection at the deadline', async () => {
    let finishClosed: (() => void) | undefined
    const closed = new Promise<void>((resolve) => {
      finishClosed = resolve
    })
    const server = createServer((_request, response) => {
      response.once('close', () => finishClosed?.())
      response.writeHead(200)
      response.write('{')
    })
    const port = await listen(server)
    try {
      const budget = createFetchBudget({ timeoutMs: 1_000 })
      await expect(
        fetchPublicUrl(`http://fixture.example:${port}`, undefined, budget, budget.start()),
      ).rejects.toThrow()
      await closed
    } finally {
      await close(server)
    }
  })

  it('returns a normal response through the bounded transport', async () => {
    const server = createServer((_request, response) => response.end('{"ok":true}'))
    const port = await listen(server)
    try {
      const budget = createFetchBudget()
      const response = await fetchPublicUrl(`http://fixture.example:${port}`, undefined, budget, budget.start())
      expect(await response.json()).toStrictEqual({ ok: true })
    } finally {
      await close(server)
    }
  })
})
