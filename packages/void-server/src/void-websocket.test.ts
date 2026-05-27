import { type Server as HttpServer, createServer } from 'node:http'
import { connect } from 'node:net'

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

  it('destroys the socket for non-WebSocket upgrade requests', async () => {
    await startServer()

    const closed = await new Promise<boolean>((resolve) => {
      const socket = connect(port, '127.0.0.1', () => {
        socket.write(
          'GET / HTTP/1.1\r\n' + 'Host: localhost\r\n' + 'Connection: Upgrade\r\n' + 'Upgrade: h2c\r\n' + '\r\n',
        )
      })

      socket.on('close', () => resolve(true))
      setTimeout(() => resolve(false), 500)
    })

    expect(closed).toBe(true)
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

  it('falls back to the default timeout when connectionTimeoutMs is zero or negative', async () => {
    vi.useFakeTimers()
    await startServer({ connectionTimeoutMs: 0 })

    const client = new WebSocket(`ws://127.0.0.1:${port}/`)
    const echoed = new Promise<string>((resolve, reject) => {
      client.on('message', (data) => resolve(data.toString()))
      client.on('error', reject)
    })

    await waitForOpen(client)
    await vi.advanceTimersByTimeAsync(100)

    client.send('still open')
    await expect(echoed).resolves.toBe('still open')

    await vi.advanceTimersByTimeAsync(DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS)

    const closed = new Promise<{ code: number; reason: string }>((resolve) => {
      client.on('close', (code, reason) => {
        resolve({ code, reason: reason.toString() })
      })
    })

    await expect(closed).resolves.toMatchObject({
      code: 1000,
      reason: 'Connection timeout',
    })
  })

  it('registers only one upgrade listener when called multiple times', async () => {
    const app = createVoidServer()
    httpServer = createServer(getRequestListener(app.fetch))

    const first = attachVoidWebSocket(httpServer)
    const second = attachVoidWebSocket(httpServer)

    expect(first).toBe(second)
    expect(httpServer.listenerCount('upgrade')).toBe(1)

    port = await listen(httpServer)

    const client = new WebSocket(`ws://127.0.0.1:${port}/`)
    const messages: string[] = []
    const echoed = new Promise<string>((resolve, reject) => {
      client.on('message', (data) => {
        messages.push(data.toString())
        if (messages.length === 1) {
          resolve(data.toString())
        }
      })
      client.on('error', reject)
    })

    await waitForOpen(client)
    client.send('once')

    await expect(echoed).resolves.toBe('once')

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(messages).toEqual(['once'])

    client.close()
  })
})
