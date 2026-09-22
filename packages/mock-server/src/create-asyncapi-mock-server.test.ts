import { once } from 'node:events'

import { serve } from '@hono/node-server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'

import { createAsyncApiMockServer } from './create-asyncapi-mock-server'
import type { MockTransport } from './transports/types'
import { isAsyncApiDocument } from './utils/process-asyncapi-document'

describe('createAsyncApiMockServer', () => {
  // Some tests spy on the global console, so restore it even when an assertion throws first.
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('pushes and replies to messages over a real WebSocket connection', async () => {
    const onMessage = vi.fn()
    const { app, websocket } = await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Chat', version: '1.0.0' },
        servers: { local: { host: 'localhost', protocol: 'ws' } },
        channels: {
          messages: {
            address: 'messages',
            messages: {
              message: {
                contentType: 'application/json',
                payload: {
                  type: 'object',
                  properties: { text: { type: 'string', const: 'hello' } },
                  required: ['text'],
                },
              },
            },
          },
        },
        operations: {
          receive: { action: 'receive', channel: { $ref: '#/channels/messages' } },
          send: { action: 'send', channel: { $ref: '#/channels/messages' } },
        },
      },
      onMessage,
    })
    const server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 0, websocket })
    const clients: WebSocket[] = []

    try {
      if (!server.listening) {
        await once(server, 'listening')
      }
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP address')
      }
      const client = new WebSocket(`ws://127.0.0.1:${address.port}/messages`)
      clients.push(client)
      const messages: string[] = []
      client.on('message', (data) => messages.push(data.toString()))
      await once(client, 'open')

      await vi.waitFor(() => expect(messages).toStrictEqual(['{"text":"hello"}']))
      client.send('hi')
      await vi.waitFor(() => expect(messages).toStrictEqual(['{"text":"hello"}', '{"text":"hello"}']))
      expect(onMessage.mock.calls).toStrictEqual([
        [{ channel: 'messages', direction: 'out', payload: '{"text":"hello"}' }],
        [{ channel: 'messages', direction: 'in', payload: 'hi' }],
        [{ channel: 'messages', direction: 'out', payload: '{"text":"hello"}' }],
      ])

      const closed = once(client, 'close')
      client.close(1000)
      const [code] = await closed
      expect(code).toBe(1000)
      const response = await fetch(`http://127.0.0.1:${address.port}/missing`)
      expect(response.status).toBe(404)
    } finally {
      for (const client of clients) {
        client.terminate()
      }
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })

  it('serves SSE channels with a generated message', async () => {
    const { app } = await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Prices', version: '1.0.0' },
        servers: { production: { host: 'localhost', protocol: 'sse' } },
        channels: {
          prices: {
            address: 'prices',
            messages: {
              priceUpdate: {
                contentType: 'application/json',
                payload: {
                  type: 'object',
                  properties: { symbol: { type: 'string' }, price: { type: 'number' } },
                  required: ['symbol', 'price'],
                },
              },
            },
          },
        },
        operations: {
          streamPrices: { action: 'receive', channel: { $ref: '#/channels/prices' } },
        },
      },
    })

    const response = await app.request('/prices')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const body = await response.text()
    expect(body).toContain('event: priceUpdate')
    expect(body).toContain('data:')
    expect(body).toContain('symbol')
  })

  it('serves a generated message for a deprecated payload schema', async () => {
    // `deprecated` marks a payload as discouraged, not as absent, so omitting it sent the channel's
    // declared payload as `data: null` — `encode` falls back to `null` for a generated `undefined`.
    const { app } = await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Legacy Prices', version: '1.0.0' },
        servers: { production: { host: 'localhost', protocol: 'sse' } },
        channels: {
          prices: {
            address: 'prices',
            messages: {
              priceUpdate: {
                contentType: 'application/json',
                payload: {
                  deprecated: true,
                  type: 'object',
                  required: ['symbol'],
                  properties: { symbol: { type: 'string' } },
                },
              },
            },
          },
        },
        operations: {
          streamPrices: { action: 'receive', channel: { $ref: '#/channels/prices' } },
        },
      },
    })

    const response = await app.request('/prices')

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('data: {"symbol":"string"}')
  })

  it('lets custom transports claim channels (extension point)', async () => {
    const claimed: string[] = []
    const signalr: MockTransport = {
      name: 'signalr',
      supports: (channel) => channel.protocols.includes('signalr'),
      register: (channel) => {
        claimed.push(channel.id)
      },
    }

    await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Hub', version: '1.0.0' },
        servers: { production: { host: 'localhost', protocol: 'signalr' } },
        channels: { hub: { address: 'hub', messages: { ping: { payload: { type: 'string' } } } } },
        operations: { onPing: { action: 'receive', channel: { $ref: '#/channels/hub' } } },
      },
      transports: [signalr],
    })

    expect(claimed).toEqual(['hub'])
  })

  it('warns about channels that no transport can serve, even with logging disabled', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Kafka', version: '1.0.0' },
        servers: { broker: { host: 'localhost:9092', protocol: 'kafka' } },
        channels: { events: { address: 'events', messages: { evt: { payload: { type: 'string' } } } } },
        operations: { onEvent: { action: 'receive', channel: { $ref: '#/channels/events' } } },
      },
      logger: false,
    })

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('no transport for channel "events"'))
  })

  it('logs transport registration to the console when logger is true', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Prices', version: '1.0.0' },
        servers: { production: { host: 'localhost', protocol: 'sse' } },
        channels: { prices: { address: 'prices', messages: { priceUpdate: { payload: { type: 'string' } } } } },
        operations: { streamPrices: { action: 'receive', channel: { $ref: '#/channels/prices' } } },
      },
      logger: true,
    })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('channel "prices"'))
  })
})

describe('isAsyncApiDocument', () => {
  it('detects AsyncAPI documents', () => {
    expect(isAsyncApiDocument({ asyncapi: '3.1.0' })).toBe(true)
    expect(isAsyncApiDocument({ openapi: '3.1.0' })).toBe(false)
    expect(isAsyncApiDocument(null)).toBe(false)
    expect(isAsyncApiDocument('asyncapi')).toBe(false)
  })
})
