import { type Server as HttpServer, createServer } from 'node:http'
import { getRequestListener } from '@hono/node-server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WebSocket from 'ws'

import { createVoidServer } from '@/create-void-server'
import {
  DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS,
  attachVoidWebSocketEcho,
  createVoidWebSocketServer,
  getVoidWebSocketTimeoutMs,
  isWebSocketUpgrade,
} from '@/utils/void-websocket'

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

describe('isWebSocketUpgrade', () => {
  it('returns true when Upgrade is websocket', () => {
    expect(
      isWebSocketUpgrade({
        headers: { upgrade: 'websocket' },
      } as import('node:http').IncomingMessage),
    ).toBe(true)
  })

  it('returns false for other upgrade protocols', () => {
    expect(
      isWebSocketUpgrade({
        headers: { upgrade: 'h2c' },
      } as import('node:http').IncomingMessage),
    ).toBe(false)
  })
})

describe('getVoidWebSocketTimeoutMs', () => {
  afterEach(() => {
    delete process.env.VOID_WEBSOCKET_TIMEOUT_MS
  })

  it('returns the override when provided', () => {
    expect(getVoidWebSocketTimeoutMs(12_345)).toBe(12_345)
  })

  it('reads VOID_WEBSOCKET_TIMEOUT_MS from the environment', () => {
    process.env.VOID_WEBSOCKET_TIMEOUT_MS = '9000'
    expect(getVoidWebSocketTimeoutMs()).toBe(9000)
  })

  it('falls back to the default timeout', () => {
    expect(getVoidWebSocketTimeoutMs()).toBe(DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS)
  })
})

describe('attachVoidWebSocketEcho', () => {
  let httpServer: HttpServer
  let port: number

  afterEach(async () => {
    vi.useRealTimers()
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve())
    })
  })

  const startServer = async (connectionTimeoutMs?: number): Promise<void> => {
    const app = createVoidServer()
    const webSocketServer = createVoidWebSocketServer()

    httpServer = createServer(getRequestListener(app.fetch))

    attachVoidWebSocketEcho(httpServer, webSocketServer, { connectionTimeoutMs })
    port = await listen(httpServer)
  }

  it('echoes text messages on any path', async () => {
    await startServer()

    const client = new WebSocket(`ws://127.0.0.1:${port}/mirror/async`)
    const echoed = new Promise<string>((resolve, reject) => {
      client.on('message', (data) => resolve(data.toString()))
      client.on('error', reject)
    })

    await new Promise<void>((resolve, reject) => {
      client.on('open', () => resolve())
      client.on('error', reject)
    })

    client.send('hello void')
    await expect(echoed).resolves.toBe('hello void')
    client.close()
  })

  it('closes the connection after the timeout', async () => {
    vi.useFakeTimers()
    await startServer(50)

    const client = new WebSocket(`ws://127.0.0.1:${port}/`)
    const closed = new Promise<{ code: number; reason: string }>((resolve) => {
      client.on('close', (code, reason) => {
        resolve({ code, reason: reason.toString() })
      })
    })

    await new Promise<void>((resolve, reject) => {
      client.on('open', () => resolve())
      client.on('error', reject)
    })

    await vi.advanceTimersByTimeAsync(50)
    await expect(closed).resolves.toMatchObject({
      code: 1000,
      reason: 'Connection timeout',
    })
  })
})
