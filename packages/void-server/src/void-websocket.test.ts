import { type Server as HttpServer, createServer } from 'node:http'

import { getRequestListener } from '@hono/node-server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WebSocket from 'ws'

import { createVoidServer } from '@/create-void-server'
import { DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS, attachVoidWebSocket } from '@/void-websocket'

const listen = (server: HttpServer): Promise<number> => {
  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to resolve server port'))
        return
      }
      resolve(address.port)
    })
  })
}

const waitForOpen = (client: WebSocket): Promise<void> => {
  return new Promise((resolve, reject) => {
    client.on('open', () => resolve())
    client.on('error', reject)
  })
}

describe('attachVoidWebSocket', () => {
  let httpServer: HttpServer
  let port: number

  afterEach(async () => {
    vi.useRealTimers()
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve())
    })
  })

  const startServer = async (options: { connectionTimeoutMs?: number; path?: string } = {}): Promise<void> => {
    const app = createVoidServer()
    httpServer = createServer(getRequestListener(app.fetch))
    attachVoidWebSocket(httpServer, options)
    port = await listen(httpServer)
  }

  it('echoes text messages on any path', async () => {
    await startServer()

    const client = new WebSocket(`ws://127.0.0.1:${port}/mirror/async`)
    const echoed = new Promise<string>((resolve, reject) => {
      client.on('message', (data) => resolve(data.toString()))
      client.on('error', reject)
    })

    await waitForOpen(client)
    client.send('hello void')

    await expect(echoed).resolves.toBe('hello void')
    client.close()
  })

  it('echoes binary frames unchanged', async () => {
    await startServer()

    const client = new WebSocket(`ws://127.0.0.1:${port}/binary`)
    const echoed = new Promise<Buffer>((resolve, reject) => {
      client.on('message', (data) => resolve(data as Buffer))
      client.on('error', reject)
    })

    await waitForOpen(client)
    const payload = Buffer.from([0x01, 0x02, 0x03, 0x04])
    client.send(payload)

    await expect(echoed).resolves.toEqual(payload)
    client.close()
  })

  it('rejects upgrades on paths other than the configured one', async () => {
    await startServer({ path: '/ws' })

    const client = new WebSocket(`ws://127.0.0.1:${port}/not-ws`)
    const error = new Promise<Error>((resolve) => {
      client.on('error', (err) => resolve(err))
    })

    await expect(error).resolves.toBeInstanceOf(Error)
  })

  it('closes the connection after the timeout', async () => {
    vi.useFakeTimers()
    await startServer({ connectionTimeoutMs: 50 })

    const client = new WebSocket(`ws://127.0.0.1:${port}/`)
    const closed = new Promise<{ code: number; reason: string }>((resolve) => {
      client.on('close', (code, reason) => {
        resolve({ code, reason: reason.toString() })
      })
    })

    await waitForOpen(client)
    await vi.advanceTimersByTimeAsync(50)

    await expect(closed).resolves.toMatchObject({
      code: 1000,
      reason: 'Connection timeout',
    })
  })

  it('falls back to the default timeout when none is provided', () => {
    expect(DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS).toBe(60_000)
  })
})
